#include "water_controller.h"
#include "../sensors/water_sensor.h"
#include "driver/gpio.h"

WaterController waterCtrl;

void WaterController::begin() {
    _mode   = PumpMode::PUMP_AUTO;
    _pumpOn = false;
    _reason = "Demarrage";
    gpio_set_level((gpio_num_t)PIN_WATER_PUMP, 1);
    Serial.println("[PUMP] Controleur initialise (AUTO, OFF)");
}

// ─────────────────────────────────────────────────────────────
//  Logique AUTO :
//    WATER_DRY  → pompe ON  (réservoir vide, Raw < 500)
//    WATER_LOW  → pompe ON  (réservoir bas, Raw 500-2000)
//    WATER_FULL → pompe OFF (réservoir plein, Raw > 2000)
// ─────────────────────────────────────────────────────────────
bool WaterController::update(WaterLevel level) {
    if (_mode != PumpMode::PUMP_AUTO) 
        return false;

    bool shouldBeOn = (level == WaterLevel::WATER_DRY);

    Serial.printf("[PUMP DEBUG] Raw=%d | Level=%s | shouldOn=%d | isOn=%d\n",
                  waterSensor.getRaw(),
                  (level == WaterLevel::WATER_DRY ? "SEC" : "EAU"),
                  shouldBeOn, _pumpOn);

    // Réduction maximale de l'anti-battement pour plus de réactivité
    static unsigned long lastAction = 0;
    if (millis() - lastAction < 800) {        // Réduit à 800ms
        return false;
    }

    if (shouldBeOn == _pumpOn) 
        return false;

    _pumpOn = shouldBeOn;
    
    // Commande forcée multiple pour être sûr
    gpio_set_level((gpio_num_t)PIN_WATER_PUMP, _pumpOn ? 0 : 1);
    delay(10);
    gpio_set_level((gpio_num_t)PIN_WATER_PUMP, _pumpOn ? 0 : 1);
    delay(10);
    gpio_set_level((gpio_num_t)PIN_WATER_PUMP, _pumpOn ? 0 : 1);

    lastAction = millis();

    if (_pumpOn) {
        Serial.println("[PUMP] 🔥 AUTO → ON (SEC)");
    } else {
        Serial.println("[PUMP] 🔥 AUTO → OFF (EAU DÉTECTÉE - Commande immédiate)");
    }
    
    return true;
}

void WaterController::setPumpManual(bool on) {
    if (_mode != PumpMode::PUMP_MANUAL) return;
    _pumpOn = on;
    gpio_set_level((gpio_num_t)PIN_WATER_PUMP, on ? 0 : 1);
    _reason = "Commande manuelle";
    Serial.println("[PUMP] MANUEL → " + String(on ? "ON" : "OFF"));
}

void WaterController::setPumpMode(PumpMode mode) {
    _mode = mode;
    if (mode == PumpMode::PUMP_AUTO && _pumpOn) {
        _pumpOn = false;
        gpio_set_level((gpio_num_t)PIN_WATER_PUMP, 1);
    }
    Serial.println("[PUMP] Mode → " +
                   String(mode == PumpMode::PUMP_AUTO ? "AUTO" : "MANUEL"));
}

PumpMode WaterController::getPumpMode()   const { return _mode; }
bool     WaterController::isPumpOn()      const { return _pumpOn; }
String   WaterController::getAutoReason() const { return _reason; }