#pragma once
#include <Arduino.h>

class Light {
public:
    void begin();
    void turnOn();
    void turnOff();
    bool isOn() const;

private:
    bool _isOn = false;
};

extern Light light;