#include "fan.h"
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "driver/gpio.h"

Fan fan;

// ─────────────────────────────────────────────────────────────
//  begin() — version complète avec pull-up interne
//  À utiliser si fan est initialisé seul (sans initRelay dans main)
// ─────────────────────────────────────────────────────────────
void Fan::begin() {
    gpio_config_t cfg   = {};
    cfg.pin_bit_mask    = (1ULL << PIN_FAN);
    cfg.mode            = GPIO_MODE_OUTPUT;
    cfg.pull_up_en      = GPIO_PULLUP_ENABLE;
    cfg.pull_down_en    = GPIO_PULLDOWN_DISABLE;
    cfg.intr_type       = GPIO_INTR_DISABLE;
    gpio_config(&cfg);
    gpio_set_level((gpio_num_t)PIN_FAN, 1);  // HIGH = relais OFF
    _on = false;
    Serial.println("[FAN] GPIO " + String(PIN_FAN) + " OFF (pull-up interne)");
}

// ─────────────────────────────────────────────────────────────
//  syncState() — à appeler quand main.cpp a déjà fait initRelay()
//  Synchronise juste l'état interne _on sans retoucher le GPIO
// ─────────────────────────────────────────────────────────────
void Fan::syncState() {
    _on = false;   // relais déjà OFF grâce à initRelay() dans main.cpp
    Serial.println("[FAN] Etat synchronise : OFF");
}

void Fan::setOn(bool on) {
    _on = on;
    gpio_set_level((gpio_num_t)PIN_FAN, on ? 0 : 1);  // 0=LOW=ON, 1=HIGH=OFF
    Serial.println("[FAN] " + String(on ? "ON" : "OFF"));
}

bool Fan::isOn() const { return _on; }

void Fan::publishState(const String& mac, void* client) {
    PubSubClient* mqtt = static_cast<PubSubClient*>(client);
    if (!mqtt || !mqtt->connected()) return;
    String topic = "coop/" + mac + "/actuators";
    StaticJsonDocument<200> doc;
    doc["mac"]        = mac;
    doc["fan"]        = _on;
    doc["heater"]     = (gpio_get_level((gpio_num_t)PIN_HEATER)      == 0);
    doc["light"]      = (gpio_get_level((gpio_num_t)PIN_LIGHT)       == 0);
    doc["padCooling"] = (gpio_get_level((gpio_num_t)PIN_PAD_COOLING) == 0);
    doc["waterPump"]  = (gpio_get_level((gpio_num_t)PIN_WATER_PUMP)  == 0);
    String payload; serializeJson(doc, payload);
    mqtt->publish(topic.c_str(), payload.c_str(), false);
}