#include <Arduino.h>
#include "driver/gpio.h"

#include "config/config.h"
#include "actuators/fan.h"
#include "sensors/temperature_sensor.h"
#include "sensors/water_sensor.h"
#include "communication/mqtt_client.h"
#include "communication/wifi_manager.h"
#include "controllers/climate_controller.h"
#include "controllers/water_controller.h"

WiFiManager wifiMgr;
unsigned long lastData      = 0;
unsigned long lastHeartbeat = 0;
static bool   mqttStarted   = false;

// ─────────────────────────────────────────────────────────────
//  Relais OFF avec pull-up interne dès le boot
// ─────────────────────────────────────────────────────────────
static void initRelay(int pin) {
    gpio_config_t cfg  = {};
    cfg.pin_bit_mask   = (1ULL << pin);
    cfg.mode           = GPIO_MODE_OUTPUT;
    cfg.pull_up_en     = GPIO_PULLUP_ENABLE;
    cfg.pull_down_en   = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type      = GPIO_INTR_DISABLE;
    gpio_config(&cfg);
    gpio_set_level((gpio_num_t)pin, 1);   // HIGH = relais OFF
}

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
    Serial.println("  Ventilateur + Pompe a eau");
    Serial.println("====================================");

    // Tous les relais OFF avant tout le reste
    initRelay(PIN_FAN);
    initRelay(PIN_HEATER);
    initRelay(PIN_LIGHT);
    initRelay(PIN_PAD_COOLING);
    initRelay(PIN_WATER_PUMP);
    Serial.println("[MAIN] Tous les relais OFF (pull-up actif)");

    fan.syncState();      // Sync etat interne fan (_on = false)
    waterCtrl.begin();    // Pompe OFF, mode PUMP_AUTO

    tempSensor.begin();   // DHT22 GPIO4
    waterSensor.begin();  // Water sensor GPIO35

    climateCtrl.begin();  // Logique auto ventilateur

    wifiMgr.begin();      // WiFi + provisioning
    startMqttIfReady();   // MQTT si token deja en NVS
}

// ─────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────
void loop() {
    wifiMgr.handle();
    startMqttIfReady();
    if (!wifiMgr.isProvisioned()) return;

    mqttMgr.loop();

    if (millis() - lastData >= 800) {
        lastData = millis();

        // 1. Lire capteurs
        tempSensor.read();
        waterSensor.read();
        Serial.printf("[DEBUG] Raw=%d  getLevel=%d  isEmpty=%d\n",
    waterSensor.getRaw(),
    (int)waterSensor.getLevel(),
    waterSensor.isEmpty());

        float      temperature = tempSensor.getTemperature();
        float      humidity    = tempSensor.getHumidity();
        float      luminosity  = readLuminosity();
        WaterLevel waterLevel  = waterSensor.getLevel();
        int        waterPct    = waterSensor.getPercent();

        // Log capteur eau
        Serial.printf("[WATER] Raw=%d  Pct=%d%%  Niveau=%s\n",
            waterSensor.getRaw(),
            waterPct,
            waterLevel == WaterLevel::WATER_FULL ? "PLEIN" :
            waterLevel == WaterLevel::WATER_LOW  ? "BAS"   : "SEC");

        if (mqttMgr.isConnected()) {
            bool stateChanged = false;

            // 2. Controle auto ventilateur (selon temperature)
            if (climateCtrl.update(temperature)) stateChanged = true;

            // 3. Controle auto pompe (selon niveau eau)
            //    WATER_DRY  → pompe ON  (reservoir vide)
            //    WATER_LOW  → pompe ON  (reservoir bas)
            //    WATER_FULL → pompe OFF (reservoir plein)
            if (waterCtrl.update(waterLevel)) stateChanged = true;
            // Après : if (waterCtrl.update(waterLevel)) stateChanged = true;

Serial.printf("[PUMP STATUS] Mode=%s | PumpOn=%d | GPIO_Level=%d\n",
              waterCtrl.getPumpMode() == PumpMode::PUMP_AUTO ? "AUTO" : "MANUEL",
              waterCtrl.isPumpOn(),
              gpio_get_level((gpio_num_t)PIN_WATER_PUMP));

            // 4. Publier etat actionneurs si changement
            if (stateChanged)
                mqttMgr.publishActuatorsState(fan.isOn(), waterCtrl.isPumpOn());

            // 5. Publier donnees capteurs vers backend
            mqttMgr.publishData(
                temperature,
                humidity,
                luminosity,
                fan.isOn(),
                tempSensor.isOk(),
                waterPct,
                waterCtrl.isPumpOn()
            );
        }
    }

    if (millis() - lastHeartbeat >= INTERVAL_HEARTBEAT) {
        lastHeartbeat = millis();
        if (mqttMgr.isConnected())
            mqttMgr.publishHeartbeat(tempSensor.isOk());
    }
}