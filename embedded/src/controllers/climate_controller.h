#pragma once
#include <Arduino.h>
#include "../config/config.h"

// ═══════════════════════════════════════════════════════════════
//  CONTRÔLEUR CLIMATIQUE — climate_controller.h
//  Décide si le ventilateur doit tourner selon la température
//  Gère les modes AUTO et MANUEL
// ═══════════════════════════════════════════════════════════════

enum class FanMode { AUTO, MANUAL };

class ClimateController {
public:
    void begin();

    // Appelé à chaque lecture capteur en mode AUTO
    // Retourne true si l'état du ventilateur a changé
    bool update(float temperature);

    // Contrôle manuel depuis l'app (SET_RELAY via MQTT)
    void setFanManual(bool on);
    void setFanMode(FanMode mode);

    FanMode getFanMode()    const;
    bool    isFanOn()       const;
    String  getAutoReason() const;

private:
    FanMode _fanMode   = FanMode::AUTO;
    bool    _fanOn     = false;
    String  _reason    = "";

    bool _autoDecide(float temperature);
};

extern ClimateController climateCtrl;