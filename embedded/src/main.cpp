#include <Arduino.h>
#include "driver/gpio.h"

#include "config/config.h"
#include "actuators/fan.h"
#include "actuators/heater.h"
#include "sensors/temperature_sensor.h"
#include "sensors/water_sensor.h"
#include "communication/mqtt_client.h"
#include "communication/wifi_manager.h"
#include "controllers/climate_controller.h"
#include "controllers/heating controller.h"
#include "controllers/water_controller.h"

WiFiManager wifiMgr;
unsigned long lastData      = 0;
unsigned long lastHeartbeat = 0;
static bool   mqttStarted   = false;

static void initRelay(int pin) {
    gpio_config_t cfg  = {};
    cfg.pin_bit_mask   = (1ULL << pin);
    cfg.mode           = GPIO_MODE_OUTPUT;
    cfg.pull_up_en     = GPIO_PULLUP_DISABLE;
    cfg.pull_down_en   = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type      = GPIO_INTR_DISABLE;
    gpio_config(&cfg);
    gpio_set_level((gpio_num_t)pin, RELAY_OFF);
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
    Serial.println("  Ventilateur + Chauffage + Pompe");
    Serial.println("====================================");

    // 1. Tous les relais OFF avant tout le reste
    initRelay(PIN_FAN);
    initRelay(PIN_HEATER);
    initRelay(PIN_LIGHT);
    initRelay(PIN_PAD_COOLING);
    initRelay(PIN_WATER_PUMP);
    Serial.println("[MAIN] Tous les relais OFF");

    // 2. Sync état interne des actionneurs (sans reconfigurer le GPIO)
    fan.syncState();      // ← existait déjà
    heater.syncState();   // ← AJOUT : corrige le bug chauffage

    // 3. Capteurs
    tempSensor.begin();
    waterSensor.begin();

    // 4. Contrôleurs logiques
    climateCtrl.begin();
    heatingCtrl.begin();
    waterCtrl.begin();

    // 5. Communication
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

    if (millis() - lastData >= 800) {
        lastData = millis();

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

        Serial.printf("[WATER] Raw=%d  Pct=%d%%  Niveau=%s\n",
            waterSensor.getRaw(),
            waterPct,
            waterLevel == WaterLevel::WATER_FULL ? "PLEIN" :
            waterLevel == WaterLevel::WATER_LOW  ? "BAS"   : "SEC");

        // ── DEBUG chauffage ───────────────────────────────────
        Serial.printf("[HEATING DEBUG] T=%.1f°C | HeaterOn=%d | GPIO=%d\n",
            temperature,
            heater.isOn(),
            gpio_get_level((gpio_num_t)PIN_HEATER));
        // ─────────────────────────────────────────────────────

        if (mqttMgr.isConnected()) {
            bool stateChanged = false;

            if (climateCtrl.update(temperature))  stateChanged = true;
            if (heatingCtrl.update(temperature))  stateChanged = true;
            if (waterCtrl.update(waterLevel))      stateChanged = true;

            Serial.printf("[PUMP STATUS] Mode=%s | PumpOn=%d | GPIO=%d\n",
                waterCtrl.getPumpMode() == PumpMode::PUMP_AUTO ? "AUTO" : "MANUEL",
                waterCtrl.isPumpOn(),
                gpio_get_level((gpio_num_t)PIN_WATER_PUMP));

            if (stateChanged)
                mqttMgr.publishActuatorsState(fan.isOn(), waterCtrl.isPumpOn());

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