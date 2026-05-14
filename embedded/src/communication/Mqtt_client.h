#pragma once
#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

// ═══════════════════════════════════════════════════════════════
//  CLIENT MQTT — mqtt_client.h
// ═══════════════════════════════════════════════════════════════

class MqttManager {
public:
    void begin(const String& mac, const String& token);
    void loop();

    // Publications
    void publishData(float temp, float humidity, float lux, bool fanOn, bool sensorOk);
    void publishHeartbeat(bool sensorOk);
    void publishActuatorsState(bool fanOn);

    bool          isConnected();   // ← plus de const (PubSubClient::connected n'est pas const)
    PubSubClient* client();

private:
    WiFiClient   _wifiClient;
    PubSubClient _mqtt{_wifiClient};

    String _mac;
    String _token;
    String _topicData;
    String _topicHeartbeat;
    String _topicCommands;
    String _topicStatus;
    String _topicActuators;

    unsigned long _lastReconnect = 0;

    void _connect();
    void _buildTopics();

    static void _onMessage(char* topic, byte* payload, unsigned int length);
};

extern MqttManager mqttMgr;