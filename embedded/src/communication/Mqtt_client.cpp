// mqtt_client.h DOIT etre le premier include — sinon MqttManager n'est pas reconnu
#include "mqtt_client.h"

// Includes systeme apres
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>

// Includes projet apres
#include "../config/config.h"
#include "../actuators/fan.h"
#include "../controllers/climate_controller.h"

// ═══════════════════════════════════════════════════════════════
//  CLIENT MQTT — mqtt_client.cpp
// ═══════════════════════════════════════════════════════════════

MqttManager mqttMgr;
static MqttManager* _instance = nullptr;

// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
void MqttManager::_buildTopics() {
    _topicData      = "coop/" + _mac + "/data";
    _topicHeartbeat = "coop/" + _mac + "/heartbeat";
    _topicCommands  = "coop/" + _mac + "/commands";
    _topicStatus    = "coop/" + _mac + "/status";
    _topicActuators = "coop/" + _mac + "/actuators";
}

// ─────────────────────────────────────────────────────────────
void MqttManager::_connect() {
    String clientId = "ESP32-" + _mac;
    String willMsg  = "{\"online\":false,\"mac\":\"" + _mac + "\"}";

    Serial.print("[MQTT] Connexion...");
    if (_mqtt.connect(clientId.c_str(), nullptr, nullptr,
                      _topicStatus.c_str(), 1, true, willMsg.c_str())) {
        Serial.println(" OK");
        _mqtt.subscribe(_topicCommands.c_str(), 1);
        String onlineMsg = "{\"online\":true,\"mac\":\"" + _mac + "\"}";
        _mqtt.publish(_topicStatus.c_str(), onlineMsg.c_str(), true);
        delay(200);
        publishActuatorsState(fan.isOn());
        Serial.println("[MQTT] Operationnel !");
    } else {
        Serial.println(" ERREUR code=" + String(_mqtt.state()));
    }
}

// ─────────────────────────────────────────────────────────────
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
PubSubClient* MqttManager::client()           { return &_mqtt; }

// ─────────────────────────────────────────────────────────────
//  CALLBACK — commandes recues depuis l'app
// ─────────────────────────────────────────────────────────────
void MqttManager::_onMessage(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    Serial.println("[MQTT] Commande : " + msg);

    StaticJsonDocument<200> cmd;
    if (deserializeJson(cmd, msg)) { Serial.println("[MQTT] JSON invalide"); return; }

    String action = cmd["action"] | "";
    String target = cmd["target"] | "";
    bool   value  = cmd["value"]  | false;

    if (action == "SET_RELAY") {
        if      (target == "fan")        { climateCtrl.setFanMode(FanMode::MANUAL); climateCtrl.setFanManual(value); }
        else if (target == "heater")     digitalWrite(PIN_HEATER,      value ? RELAY_ON : RELAY_OFF);
        else if (target == "light")      digitalWrite(PIN_LIGHT,       value ? RELAY_ON : RELAY_OFF);
        else if (target == "padCooling") digitalWrite(PIN_PAD_COOLING, value ? RELAY_ON : RELAY_OFF);
        else if (target == "waterPump")  digitalWrite(PIN_WATER_PUMP,  value ? RELAY_ON : RELAY_OFF);
        else { Serial.println("[MQTT] Cible inconnue : " + target); return; }
        delay(50);
        if (_instance) _instance->publishActuatorsState(fan.isOn());
    }
    else if (action == "SET_MODE") {
        if (target == "fan") {
            String modeStr = cmd["value"] | "";
            climateCtrl.setFanMode(modeStr == "auto" ? FanMode::AUTO : FanMode::MANUAL);
        }
    }
    else if (action == "RESET") {
        Serial.println("[MQTT] Reset dans 3s...");
        delay(3000); ESP.restart();
    }
}

// ─────────────────────────────────────────────────────────────
void MqttManager::publishData(float temp, float humidity, float lux,
                               bool fanOn, bool sensorOk) {
    StaticJsonDocument<300> doc;
    doc["token"]       = _token;
    doc["mac"]         = _mac;
    doc["temperature"] = temp;
    doc["humidity"]    = humidity;
    doc["luminosity"]  = lux;
    doc["ventilation"] = fanOn ? 1.0f : 0.0f;
    doc["sensorOk"]    = sensorOk;
    doc["uptime"]      = millis() / 1000;
    doc["rssi"]        = WiFi.RSSI();
    String payload; serializeJson(doc, payload);
    if (!_mqtt.publish(_topicData.c_str(), payload.c_str(), false))
        Serial.println("[MQTT] Echec publication data");
    else
        Serial.printf("[MQTT] T=%.1fC H=%.1f%% Lux=%.0f Fan=%s\n",
                      temp, humidity, lux, fanOn ? "ON" : "OFF");
}

// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
void MqttManager::publishActuatorsState(bool fanOn) {
    StaticJsonDocument<200> doc;
    doc["mac"]        = _mac;
    doc["fan"]        = fanOn;
    doc["heater"]     = (digitalRead(PIN_HEATER)      == RELAY_ON);
    doc["light"]      = (digitalRead(PIN_LIGHT)       == RELAY_ON);
    doc["padCooling"] = (digitalRead(PIN_PAD_COOLING) == RELAY_ON);
    doc["waterPump"]  = (digitalRead(PIN_WATER_PUMP)  == RELAY_ON);
    String payload; serializeJson(doc, payload);
    if (_mqtt.publish(_topicActuators.c_str(), payload.c_str(), false))
        Serial.println("[MQTT] Actionneurs publies : " + payload);
}