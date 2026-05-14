// ─────────────────────────────────────────────────────────────
//  IMPORTANT : inclure le .h AVANT tout le reste
//  C'est ce qui causait toutes les erreurs "identifier undefined"
//  et "declaration incompatible"
// ─────────────────────────────────────────────────────────────
#include "temperature_sensor.h"

// ═══════════════════════════════════════════════════════════════
//  CAPTEUR DHT22 — Dht22_integration.cpp
//  Implémente la classe TemperatureSensor declaree dans temperature_sensor.h
// ═══════════════════════════════════════════════════════════════

TemperatureSensor tempSensor;   // Instance globale (extern dans le .h)

void TemperatureSensor::begin() {
    _dht.begin();
    delay(2000);   // DHT22 necessite 2s de chauffe
    Serial.println("[DHT22] Capteur initialise GPIO " + String(PIN_DHT));

    float t = _dht.readTemperature();
    float h = _dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
        _temperature = t;
        _humidity    = h;
        _ok          = true;
        Serial.printf("[DHT22] Test OK : T=%.1fC  H=%.1f%%\n", t, h);
    } else {
        Serial.println("[DHT22] Capteur non detecte !");
        Serial.println("[DHT22] GPIO4=DATA  3.3V=VCC  GND=GND  R10k entre VCC et DATA");
    }
}

bool TemperatureSensor::read() {
    float t = _dht.readTemperature();
    float h = _dht.readHumidity();

    if (isnan(t) || isnan(h)) {
        _ok = false;
        Serial.println("[DHT22] Lecture invalide - valeur cache conservee");
        return false;
    }

    _temperature = roundf(t * 10) / 10.0f;
    _humidity    = roundf(h * 10) / 10.0f;
    _ok          = true;
    return true;
}

float TemperatureSensor::getTemperature() const { return _temperature; }
float TemperatureSensor::getHumidity()    const { return _humidity; }
bool  TemperatureSensor::isOk()          const { return _ok; }