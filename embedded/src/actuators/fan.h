#pragma once
#include <Arduino.h>
#include "../config/config.h"

class Fan {
public:
    void begin();        // Init GPIO + pull-up interne (si seul)
    void syncState();    // Sync état interne si main a déjà fait initRelay()
    void setOn(bool on);
    bool isOn() const;
    void publishState(const String& mac, void* mqttClient);
private:
    bool _on = false;
};

extern Fan fan;