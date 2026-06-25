#include "mqtt_client.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include "driver/gpio.h"
#include "../config/config.h"
#include "../actuators/fan.h"
#include "../controllers/climate_controller.h"
#include "../controllers/heating controller.h"
#include "../controllers/water_controller.h"
#include "../controllers/lighting_controller.h"

MqttManager mqttMgr;
static MqttManager* _instance = nullptr;

void MqttManager::begin(const String& mac, const String& token) {
    _mac      = mac;
    _token    = token;
    _instance = this;
    _buildTopics();
    _mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    _mqtt.setCallback(_onMessage);
    _mqtt.setKeepAlive(MQTT_KEEPALIVE);
    _mqtt.setBufferSize(512);
    _connect();
}

void MqttManager::_buildTopics() {
    _topicData      = "coop/" + _mac + "/data";
    _topicHeartbeat = "coop/" + _mac + "/heartbeat";
    _topicCommands  = "coop/" + _mac + "/commands";
    _topicStatus    = "coop/" + _mac + "/status";
    _topicActuators = "coop/" + _mac + "/actuators";
}

void MqttManager::_connect() {
    String clientId = "ESP32-" + _mac;
    String willMsg  = "{\"online\":false,\"mac\":\"" + _mac + "\"}";
    Serial.print("[MQTT] Connexion...");
    if (_mqtt.connect(clientId.c_str(), nullptr, nullptr,
                      _topicStatus.c_str(), 1, true, willMsg.c_str())) {
        Serial.println(" OK");
        _mqtt.subscribe(_topicCommands.c_str(), 1);
        Serial.println("[MQTT] Souscrit : " + _topicCommands);  // ← log diagnostic MAC
        String onlineMsg = "{\"online\":true,\"mac\":\"" + _mac + "\"}";
        _mqtt.publish(_topicStatus.c_str(), onlineMsg.c_str(), true);
        delay(200);
        publishActuatorsState(fan.isOn(), waterCtrl.isPumpOn());
        Serial.println("[MQTT] Operationnel !");
    } else {
        Serial.println(" ERREUR code=" + String(_mqtt.state()));
    }
}

void MqttManager::loop() {
    if (!_mqtt.connected()) {
        if (millis() - _lastReconnect >= MQTT_RECONNECT_DELAY) {
            _lastReconnect = millis();
            _connect();
        }
        return;
    }
    _mqtt.loop();
}

bool          MqttManager::isConnected() { return _mqtt.connected(); }
PubSubClient* MqttManager::client()      { return &_mqtt; }

// ─────────────────────────────────────────────────────────────
//  CALLBACK — commandes depuis l'app
// ─────────────────────────────────────────────────────────────
void MqttManager::_onMessage(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    Serial.println("[MQTT] Commande reçue sur : " + String(topic));  // ← log topic reçu
    Serial.println("[MQTT] Commande : " + msg);

    StaticJsonDocument<200> cmd;
    if (deserializeJson(cmd, msg)) { Serial.println("[MQTT] JSON invalide"); return; }

    String action = cmd["action"] | "";
    String target = cmd["target"] | "";
    bool   value  = cmd["value"]  | false;

    if (action == "SET_RELAY") {
        if (target == "fan") {
            climateCtrl.setFanMode(FanMode::MANUAL);
            climateCtrl.setFanManual(value);
        }
        else if (target == "waterPump") {
            waterCtrl.setPumpMode(PumpMode::PUMP_MANUAL);
            waterCtrl.setPumpManual(value);
        }
        else if (target == "heater") {
            heatingCtrl.setHeaterMode(HeaterMode::MANUAL);
            heatingCtrl.setHeaterManual(value);
        }
        else if (target == "light") {
            lightingCtrl.setLightMode(LightMode::MANUAL);
            lightingCtrl.setLightManual(value);
        }
        else if (target == "padCooling") gpio_set_level((gpio_num_t)PIN_PAD_COOLING, value ? 0 : 1);
        else { Serial.println("[MQTT] Cible inconnue : " + target); return; }

        delay(50);
        if (_instance) _instance->publishActuatorsState(fan.isOn(), waterCtrl.isPumpOn());
    }

    else if (action == "SET_MODE") {
        if (target == "fan") {
            String modeStr = cmd["value"] | "";
            climateCtrl.setFanMode(modeStr == "auto" ? FanMode::AUTO : FanMode::MANUAL);
        }
        else if (target == "waterPump") {
            String modeStr = cmd["value"] | "";
            waterCtrl.setPumpMode(modeStr == "auto" ? PumpMode::PUMP_AUTO : PumpMode::PUMP_MANUAL);
        }
        else if (target == "heater") {
            String modeStr = cmd["value"] | "";
            heatingCtrl.setHeaterMode(modeStr == "auto" ? HeaterMode::AUTO : HeaterMode::MANUAL);
        }
        else if (target == "light") {
            String modeStr = cmd["value"] | "";
            lightingCtrl.setLightMode(modeStr == "auto" ? LightMode::AUTO : LightMode::MANUAL);
        }

        delay(50);
        if (_instance) _instance->publishActuatorsState(fan.isOn(), waterCtrl.isPumpOn());
    }

    else if (action == "RESET") {
        Serial.println("[MQTT] Reset dans 3s...");
        delay(3000); ESP.restart();
    }
}

// ─────────────────────────────────────────────────────────────
void MqttManager::publishData(float temp, float humidity, float lux,
                               bool fanOn, bool sensorOk,
                               int waterPct, bool pumpOn) {
    StaticJsonDocument<512> doc;
    doc["token"]       = _token;
    doc["mac"]         = _mac;
    doc["temperature"] = temp;
    doc["humidity"]    = humidity;
    doc["luminosity"]  = lux;
    doc["ventilation"] = fanOn ? 1.0f : 0.0f;
    doc["waterLevel"]  = waterPct;
    doc["pumpOn"]      = pumpOn;
    doc["heaterOn"]    = heatingCtrl.isHeaterOn();
    doc["sensorOk"]    = sensorOk;
    doc["uptime"]      = millis() / 1000;
    doc["rssi"]        = WiFi.RSSI();
    String payload; serializeJson(doc, payload);
    if (_mqtt.publish(_topicData.c_str(), payload.c_str(), false))
        Serial.printf("[MQTT] T=%.1fC H=%.1f%% Fan=%s Pompe=%s Eau=%d%%\n",
                      temp, humidity, fanOn?"ON":"OFF", pumpOn?"ON":"OFF", waterPct);
    else
        Serial.println("[MQTT] Echec publication data");
}

void MqttManager::publishHeartbeat(bool sensorOk) {
    StaticJsonDocument<128> doc;
    doc["mac"]      = _mac;
    doc["ip"]       = WiFi.localIP().toString();
    doc["uptime"]   = millis() / 1000;
    doc["rssi"]     = WiFi.RSSI();
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["sensorOk"] = sensorOk;
    String payload; serializeJson(doc, payload);
    _mqtt.publish(_topicHeartbeat.c_str(), payload.c_str(), false);
}

void MqttManager::publishActuatorsState(bool fanOn, bool pumpOn) {
    StaticJsonDocument<200> doc;
    doc["mac"]        = _mac;
    doc["fan"]        = fanOn;
    doc["heater"]     = heatingCtrl.isHeaterOn();
    doc["light"]      = lightingCtrl.isLightOn();
    doc["padCooling"] = (gpio_get_level((gpio_num_t)PIN_PAD_COOLING) == 0);
    doc["waterPump"]  = pumpOn;
    String payload; serializeJson(doc, payload);
    if (_mqtt.publish(_topicActuators.c_str(), payload.c_str(), false))
        Serial.println("[MQTT] Actionneurs publies : " + payload);
}