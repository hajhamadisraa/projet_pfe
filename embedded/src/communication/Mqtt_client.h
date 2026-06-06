#pragma once
#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

class MqttManager {
public:
    void begin(const String& mac, const String& token);
    void loop();
    bool isConnected();

    // ✅ publishData avec int waterPct (pas bool waterPresent)
    void publishData(float temp, float humidity, float lux,
                     bool fanOn, bool sensorOk,
                     int waterPct = 0, bool pumpOn = false);

    void publishHeartbeat(bool sensorOk);

    // ✅ publishActuatorsState avec bool pumpOn
    void publishActuatorsState(bool fanOn, bool pumpOn = false);

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