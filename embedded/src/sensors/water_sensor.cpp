#include "water_sensor.h"

WaterSensor waterSensor;

void WaterSensor::begin() {
    // PIN_WATER_POWER alimente le + du capteur
    // On l'éteint par défaut pour éviter l'oxydation
    pinMode(PIN_WATER_POWER, OUTPUT);
    digitalWrite(PIN_WATER_POWER, LOW);   // capteur éteint

    analogSetPinAttenuation(PIN_WATER_SENSOR, ADC_11db);
    analogReadResolution(12);

    read();   // Lecture initiale
    const char* lvl = _level == WaterLevel::WATER_FULL ? "PLEIN" :
                      _level == WaterLevel::WATER_LOW  ? "BAS"   : "SEC";
    Serial.println("[WATER] Capteur initialise GPIO " + String(PIN_WATER_SENSOR));
    Serial.printf("[WATER] Power GPIO %d | Signal GPIO %d\n", PIN_WATER_POWER, PIN_WATER_SENSOR);
    Serial.printf("[WATER] Valeur initiale : %d  Niveau : %s\n", _raw, lvl);
}

bool WaterSensor::read() {
    digitalWrite(PIN_WATER_POWER, HIGH);
    delay(80);                 // réduit

    long sum = 0;
    for (int i = 0; i < SAMPLES; i++) {
        sum += analogRead(PIN_WATER_SENSOR);
        delay(5);              // réduit
    }
    _raw = sum / SAMPLES;

    digitalWrite(PIN_WATER_POWER, LOW);

    _prevLevel = _level;

    // Seuils très sensibles pour détecter le premier contact avec l'eau
    if (_raw < 900) {
        _level = WaterLevel::WATER_DRY;
    } 
    else {
        _level = WaterLevel::WATER_LOW;   // Tout ce qui n'est pas sec = eau touchée
    }

    bool changed = (_level != _prevLevel);
    if (changed) {
        const char* lvlStr = (_level == WaterLevel::WATER_DRY) ? "SEC" : "EAU TOUCHÉE";
        Serial.printf("[WATER] Niveau change : %d → %s (%d%%)\n", _raw, lvlStr, getPercent());
    }
    return changed;
}

int WaterSensor::getPercent() const {
    if (_raw <= 0)    return 0;
    if (_raw >= 4095) return 100;
    return (_raw * 100) / 4095;
}

WaterLevel WaterSensor::getLevel() const { return _level; }
int        WaterSensor::getRaw()   const { return _raw; }

bool WaterSensor::isEmpty() const {
    return _level == WaterLevel::WATER_DRY || _level == WaterLevel::WATER_LOW;
}

bool WaterSensor::isFull() const {
    return _level == WaterLevel::WATER_FULL;
}