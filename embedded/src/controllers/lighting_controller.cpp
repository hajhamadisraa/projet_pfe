#include "lighting_controller.h"
#include "../actuators/light.h"

LightingController lightingCtrl;

void LightingController::begin() {
    light.begin();
    _mode = LightMode::AUTO;
}

void LightingController::setLightMode(LightMode mode) {
    _mode = mode;
}

void LightingController::setLightManual(bool on) {
    _mode = LightMode::MANUAL;
    on ? light.turnOn() : light.turnOff();
}

LightMode LightingController::getMode() const { return _mode; }
bool LightingController::isLightOn() const { return light.isOn(); }

void LightingController::update() {
    if (_mode != LightMode::AUTO) return;

    unsigned long now = millis();
    if (now - _lastCheck < 30000) return;  // vérifie toutes les 30s, pas à chaque loop()
    _lastCheck = now;

    time_t t = time(nullptr);
    struct tm* timeInfo = localtime(&t);
    int timeVal = timeInfo->tm_hour * 60 + timeInfo->tm_min;

    bool shouldBeOn = (timeVal >= 6 * 60) && (timeVal < 20 * 60);  // 06h00 → 20h00
    if (shouldBeOn != light.isOn()) {
        shouldBeOn ? light.turnOn() : light.turnOff();
    }
}