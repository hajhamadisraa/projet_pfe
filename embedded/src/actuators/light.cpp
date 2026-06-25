#include "light.h"
#include "../config/config.h"
#include "driver/gpio.h"

Light light;

void Light::begin() {
    gpio_set_direction((gpio_num_t)PIN_LIGHT, GPIO_MODE_OUTPUT);
    turnOff();  // état sûr au démarrage, évite l'allumage intempestif au boot
}

void Light::turnOn() {
    _isOn = true;
    gpio_set_level((gpio_num_t)PIN_LIGHT, RELAY_ON);
}

void Light::turnOff() {
    _isOn = false;
    gpio_set_level((gpio_num_t)PIN_LIGHT, RELAY_OFF);
}

bool Light::isOn() const {
    return _isOn;
}