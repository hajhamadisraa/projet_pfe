#pragma once
#include <Arduino.h>
#include "../config/config.h"

// ═══════════════════════════════════════════════════════════════
//  ACTIONNEUR CHAUFFAGE — heater.h
//  Pilote le relais PIN_HEATER (logique inversée : RELAY_ON = LOW)
// ═══════════════════════════════════════════════════════════════

class Heater {
public:
    void begin();
    void syncState();   // ← AJOUT : sync état interne sans toucher GPIO
    void setOn(bool on);
    bool isOn() const;

private:
    bool _on = false;
};

extern Heater heater;