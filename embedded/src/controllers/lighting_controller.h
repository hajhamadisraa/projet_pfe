#pragma once
#include <Arduino.h>

enum class LightMode { AUTO, MANUAL };

class LightingController {
public:
    void begin();
    void update();              // appelé en boucle, applique le programme horaire si AUTO
    void setLightMode(LightMode mode);
    void setLightManual(bool on);
    LightMode getMode() const;
    bool isLightOn() const;

private:
    LightMode _mode = LightMode::AUTO;
    unsigned long _lastCheck = 0;
};

extern LightingController lightingCtrl;