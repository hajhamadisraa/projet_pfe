#include "climate_controller.h"
#include "../actuators/fan.h"

// ═══════════════════════════════════════════════════════════════
//  CONTRÔLEUR CLIMATIQUE — climate_controller.cpp
//
//  Seuils (définis dans config.h) :
//    TEMP_IDEAL_MAX = 27°C → ventilateur démarre
//    TEMP_HIGH      = 30°C → ventilateur prioritaire
//    TEMP_CRITICAL_HIGH = 35°C → ventilateur forcé
//    TEMP_IDEAL_MIN = 18°C → ventilateur s'arrête
//    FAN_HYSTERESIS = 1.5°C → anti-oscillation
// ═══════════════════════════════════════════════════════════════

ClimateController climateCtrl;

void ClimateController::begin() {
    _fanMode = FanMode::AUTO;
    _fanOn   = false;
    _reason  = "Démarrage";
    Serial.println("[CLIMATE] ✅ Contrôleur climatique initialisé (mode AUTO)");
}

// ─────────────────────────────────────────────────────────────
//  update() — à appeler après chaque lecture DHT22
//  Retourne true si l'état du ventilateur a changé
// ─────────────────────────────────────────────────────────────
bool ClimateController::update(float temperature) {
    if (_fanMode != FanMode::AUTO) return false;

    bool newState = _autoDecide(temperature);

    if (newState != _fanOn) {
        _fanOn = newState;
        fan.setOn(_fanOn);
        Serial.println("[CLIMATE] 🤖 AUTO → Ventilateur " +
                       String(_fanOn ? "ON" : "OFF") + " — " + _reason);
        return true;   // état changé → appelant doit publier
    }
    return false;
}

// ─────────────────────────────────────────────────────────────
//  Logique de décision automatique avec hystérésis
//  Hystérésis = évite que le ventilateur s'allume/s'éteigne
//  en boucle quand la température oscille autour du seuil
// ─────────────────────────────────────────────────────────────
bool ClimateController::_autoDecide(float t) {
    // Température critique → forcer ON sans hystérésis
    if (t >= TEMP_CRITICAL_HIGH) {
        _reason = "T=" + String(t, 1) + "°C — Critique ! Forcé ON";
        return true;
    }
    // Température haute → ON
    if (t >= TEMP_HIGH) {
        _reason = "T=" + String(t, 1) + "°C — Chaleur";
        return true;
    }
    // Au-dessus de l'idéal → ON
    if (t >= TEMP_IDEAL_MAX) {
        _reason = "T=" + String(t, 1) + "°C — Au-dessus idéal";
        return true;
    }

    // Zone froide → OFF
    if (t <= TEMP_IDEAL_MIN) {
        _reason = "T=" + String(t, 1) + "°C — Zone froide";
        return false;
    }

    // Zone intermédiaire (entre TEMP_IDEAL_MIN et TEMP_IDEAL_MAX)
    // → Hystérésis : on garde l'état actuel pour éviter les oscillations
    if (_fanOn) {
        // Ventilateur ON : l'éteindre seulement si T descend sous seuil - hystérésis
        if (t < TEMP_IDEAL_MAX - FAN_HYSTERESIS) {
            _reason = "T=" + String(t, 1) + "°C — Zone idéale ✓";
            return false;
        }
        _reason = "T=" + String(t, 1) + "°C — Maintien ON";
        return true;
    } else {
        // Ventilateur OFF : l'allumer seulement si T monte au-dessus du seuil
        _reason = "T=" + String(t, 1) + "°C — Zone idéale ✓";
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  Contrôle MANUEL depuis l'app (bouton DÉMARRER / ARRÊTER)
// ─────────────────────────────────────────────────────────────
void ClimateController::setFanManual(bool on) {
    if (_fanMode != FanMode::MANUAL) return;
    _fanOn = on;
    fan.setOn(on);
    _reason = "Commande manuelle";
    Serial.println("[CLIMATE] 🖐  MANUEL → Ventilateur " + String(on ? "ON" : "OFF"));
}

void ClimateController::setFanMode(FanMode mode) {
    _fanMode = mode;
    Serial.println("[CLIMATE] Mode → " + String(mode == FanMode::AUTO ? "AUTO" : "MANUEL"));
}

FanMode ClimateController::getFanMode()    const { return _fanMode; }
bool    ClimateController::isFanOn()       const { return _fanOn; }
String  ClimateController::getAutoReason() const { return _reason; }