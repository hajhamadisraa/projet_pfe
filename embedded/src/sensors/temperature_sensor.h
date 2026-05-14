#pragma once
#include <Arduino.h>
#include <DHT.h>
#include "../config/config.h"

// ═══════════════════════════════════════════════════════════════
//  CAPTEUR TEMPERATURE / HUMIDITE — temperature_sensor.h
// ═══════════════════════════════════════════════════════════════

class TemperatureSensor {
public:
    void  begin();
    bool  read();
    float getTemperature() const;
    float getHumidity()    const;
    bool  isOk()           const;

private:
    DHT   _dht{PIN_DHT, DHT_TYPE};
    float _temperature = 24.0f;
    float _humidity    = 60.0f;
    bool  _ok          = false;
};

extern TemperatureSensor tempSensor;