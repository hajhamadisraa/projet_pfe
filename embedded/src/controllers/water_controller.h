#pragma once
#include <Arduino.h>
#include "../config/config.h"
#include "../sensors/water_sensor.h"

// MANUAL est aussi une macro sur certains systèmes → préfixer avec PUMP_
enum class PumpMode { PUMP_AUTO, PUMP_MANUAL };

class WaterController {
public:
    void     begin();
    bool     update(WaterLevel level);
    void     setPumpManual(bool on);
    void     setPumpMode(PumpMode mode);
    PumpMode getPumpMode()   const;
    bool     isPumpOn()      const;
    String   getAutoReason() const;

private:
    PumpMode _mode   = PumpMode::PUMP_AUTO;
    bool     _pumpOn = false;
    String   _reason = "";
};

extern WaterController waterCtrl;