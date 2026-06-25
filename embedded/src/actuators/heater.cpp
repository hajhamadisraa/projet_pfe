#include "heater.h"
#include "driver/gpio.h"

// ═══════════════════════════════════════════════════════════════
//  ACTIONNEUR CHAUFFAGE — heater.cpp
// ═══════════════════════════════════════════════════════════════

Heater heater;

void Heater::begin() {
    // ⚠️  NE PAS appeler gpio_reset_pin() ici :
    //     initRelay() dans main.cpp a déjà configuré le GPIO.
    //     gpio_reset_pin() remettrait le pin en input flottant
    //     et casserait la config.
    gpio_set_direction((gpio_num_t)PIN_HEATER, GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t)PIN_HEATER, RELAY_OFF);
    _on = false;
    Serial.println("[HEATER] ✅ Actionneur chauffage initialisé (OFF)");
}

// Synchronise uniquement l'état interne — ne touche pas au GPIO
// À utiliser quand initRelay() a déjà configuré le pin
void Heater::syncState() {
    _on = false;
    Serial.println("[HEATER] ✅ syncState() — état interne = OFF");
}

void Heater::setOn(bool on) {
    _on = on;
    gpio_set_level((gpio_num_t)PIN_HEATER, on ? RELAY_ON : RELAY_OFF);
}

bool Heater::isOn() const { return _on; }