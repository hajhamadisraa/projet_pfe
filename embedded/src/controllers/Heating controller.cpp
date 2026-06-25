#include "heating controller.h"
#include "../actuators/heater.h"

// ═══════════════════════════════════════════════════════════════
//  CONTRÔLEUR CHAUFFAGE — heating_controller.cpp
//
//  Seuils (définis dans config.h) :
//    TEMP_CRITICAL_LOW  = 10°C → chauffage forcé ON (urgence)
//    TEMP_LOW           = 14°C → chauffage ON (froid)
//    TEMP_IDEAL_MIN     = 18°C → seuil bas de la zone idéale
//    TEMP_IDEAL_MAX     = 27°C → chauffage s'éteint
//    HEATER_HYSTERESIS  = 1.5°C → anti-oscillation
// ═══════════════════════════════════════════════════════════════

HeatingController heatingCtrl;

void HeatingController::begin() {
    _heaterMode = HeaterMode::AUTO;
    _heaterOn   = false;
    _reason     = "Démarrage";
    Serial.println("[HEATING] ✅ Contrôleur chauffage initialisé (mode AUTO)");
}

bool HeatingController::update(float temperature) {
    if (_heaterMode != HeaterMode::AUTO) return false;

    bool newState = _autoDecide(temperature);

    if (newState != _heaterOn) {
        _heaterOn = newState;
        heater.setOn(_heaterOn);
        Serial.println("[HEATING] 🤖 AUTO → Chauffage " +
                       String(_heaterOn ? "ON" : "OFF") + " — " + _reason);
        return true;
    }
    return false;
}

bool HeatingController::_autoDecide(float t) {
    if (t <= TEMP_CRITICAL_LOW) {
        _reason = "T=" + String(t, 1) + "°C — Critique ! Forcé ON";
        return true;
    }
    if (t <= TEMP_LOW) {
        _reason = "T=" + String(t, 1) + "°C — Froid";
        return true;
    }
    if (t < TEMP_IDEAL_MIN) {
        _reason = "T=" + String(t, 1) + "°C — Sous idéal";
        return true;
    }
    if (t >= TEMP_IDEAL_MAX) {
        _reason = "T=" + String(t, 1) + "°C — Zone chaude";
        return false;
    }
    if (_heaterOn) {
        if (t > TEMP_IDEAL_MIN + HEATER_HYSTERESIS) {
            _reason = "T=" + String(t, 1) + "°C — Zone idéale ✓";
            return false;
        }
        _reason = "T=" + String(t, 1) + "°C — Maintien ON";
        return true;
    } else {
        _reason = "T=" + String(t, 1) + "°C — Zone idéale ✓";
        return false;
    }
}

void HeatingController::setHeaterManual(bool on) {
    if (_heaterMode != HeaterMode::MANUAL) return;
    _heaterOn = on;
    heater.setOn(on);
    _reason = "Commande manuelle";
    Serial.println("[HEATING] 🖐  MANUEL → Chauffage " + String(on ? "ON" : "OFF"));
}

void HeatingController::setHeaterMode(HeaterMode mode) {
    _heaterMode = mode;
    Serial.println("[HEATING] Mode → " + String(mode == HeaterMode::AUTO ? "AUTO" : "MANUEL"));
}

HeaterMode HeatingController::getHeaterMode() const { return _heaterMode; }
bool       HeatingController::isHeaterOn()    const { return _heaterOn; }
String     HeatingController::getAutoReason() const { return _reason; }