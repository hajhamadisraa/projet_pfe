#include <Arduino.h>
#include "driver/gpio.h"

#include "config/config.h"
#include "actuators/fan.h"
#include "sensors/temperature_sensor.h"
#include "communication/mqtt_client.h"
#include "communication/wifi_manager.h"
#include "controllers/climate_controller.h"

WiFiManager wifiMgr;

unsigned long lastData      = 0;
unsigned long lastHeartbeat = 0;
static bool   mqttStarted   = false;

// ─────────────────────────────────────────────────────────────
//  Helper : initialise un relais avec pull-up interne
//  Force HIGH (relais OFF) AVANT que le pin soit en OUTPUT
//  → ventilateur ne démarre pas au boot
// ─────────────────────────────────────────────────────────────
static void initRelay(int pin) {
    gpio_config_t cfg   = {};
    cfg.pin_bit_mask    = (1ULL << pin);
    cfg.mode            = GPIO_MODE_OUTPUT;
    cfg.pull_up_en      = GPIO_PULLUP_ENABLE;    // ← force HIGH au boot
    cfg.pull_down_en    = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type       = GPIO_INTR_DISABLE;
    gpio_config(&cfg);
    gpio_set_level((gpio_num_t)pin, 1);          // 1 = HIGH = relais OFF
}

// ─────────────────────────────────────────────────────────────
void startMqttIfReady() {
    if (mqttStarted) return;
    if (!wifiMgr.isProvisioned()) return;
    String token = wifiMgr.getToken();
    String mac   = wifiMgr.getMac();
    if (token.isEmpty() || mac.isEmpty()) return;
    mqttMgr.begin(mac, token);
    mqttStarted = true;
    Serial.println("[MAIN] MQTT demarre — " + mac);
}

float readLuminosity() {
    long sum = 0;
    for (int i = 0; i < 5; i++) { sum += analogRead(PIN_LIGHT_SENSOR); delay(5); }
    return (sum / 5.0f / 4095.0f) * 1000.0f;
}

// ─────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    Serial.println("\n====================================");
    Serial.println("  Poulailler Intelligent v4.0.0");
    Serial.println("====================================");

    // ✅ TOUS les relais initialisés avec pull-up interne
    // L'ordre est important : gpio_config() avant tout le reste
    // Ça force HIGH (relais OFF) dès les premières microsecondes
    initRelay(PIN_FAN);          // GPIO16
    initRelay(PIN_HEATER);       // GPIO17
    initRelay(PIN_LIGHT);        // GPIO18
    initRelay(PIN_PAD_COOLING);  // GPIO19
    initRelay(PIN_WATER_PUMP);   // GPIO23
    Serial.println("[MAIN] Tous les relais OFF (pull-up interne actif)");

    // fan.begin() maintenant juste pour l'état interne _on = false
    // Le GPIO est déjà configuré par initRelay ci-dessus
    fan.syncState();   // ← on va ajouter cette méthode légère dans fan.cpp

    tempSensor.begin();
    climateCtrl.begin();
    wifiMgr.begin();
    startMqttIfReady();
}

// ─────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────
void loop() {
    wifiMgr.handle();
    startMqttIfReady();
    if (!wifiMgr.isProvisioned()) return;

    mqttMgr.loop();

    if (millis() - lastData >= INTERVAL_SEND_DATA) {
        lastData = millis();
        tempSensor.read();
        float temperature = tempSensor.getTemperature();
        float humidity    = tempSensor.getHumidity();
        float luminosity  = readLuminosity();

        if (mqttMgr.isConnected()) {
            bool fanChanged = climateCtrl.update(temperature);
            if (fanChanged) mqttMgr.publishActuatorsState(fan.isOn());
            mqttMgr.publishData(temperature, humidity, luminosity,
                                fan.isOn(), tempSensor.isOk());
        }
    }

    if (millis() - lastHeartbeat >= INTERVAL_HEARTBEAT) {
        lastHeartbeat = millis();
        if (mqttMgr.isConnected()) mqttMgr.publishHeartbeat(tempSensor.isOk());
    }
}