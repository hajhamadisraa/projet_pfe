#pragma once
#include <Arduino.h>

// ═══════════════════════════════════════════════════════════════
//  CONTRÔLEUR CHAUFFAGE — heating_controller.h
//
//  Logique symétrique au ClimateController (ventilateur) :
//    T <= TEMP_CRITICAL_LOW  → chauffage forcé ON (urgence froid)
//    T <= TEMP_LOW           → chauffage ON (froid)
//    T <  TEMP_IDEAL_MIN     → chauffage ON (sous idéal)
//    T >= TEMP_IDEAL_MAX     → chauffage OFF
//    Zone intermédiaire      → hystérésis HEATER_HYSTERESIS
// ═══════════════════════════════════════════════════════════════

enum class HeaterMode { AUTO, MANUAL };

class HeatingController {
public:
    void   begin();
    bool   update(float temperature);   // retourne true si état changé
    void   setHeaterManual(bool on);
    void   setHeaterMode(HeaterMode mode);

    HeaterMode getHeaterMode()   const;
    bool       isHeaterOn()      const;
    String     getAutoReason()   const;

private:
    bool        _autoDecide(float t);

    HeaterMode  _heaterMode = HeaterMode::AUTO;
    bool        _heaterOn   = false;
    String      _reason     = "";
};

extern HeatingController heatingCtrl;