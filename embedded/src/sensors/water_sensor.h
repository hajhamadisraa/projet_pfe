#pragma once
#include <Arduino.h>
#include "../config/config.h"

// LOW est une macro Arduino (#define LOW 0) → conflit avec enum
// On utilise WATER_DRY, WATER_LOW, WATER_FULL
enum class WaterLevel { WATER_DRY, WATER_LOW, WATER_FULL };

class WaterSensor {
public:
    void       begin();
    bool       read();
    WaterLevel getLevel()   const;
    int        getRaw()     const;
    int        getPercent() const;
    bool       isEmpty()    const;
    bool       isFull()     const;

private:
    int        _raw       = 0;
    WaterLevel _level     = WaterLevel::WATER_DRY;
    WaterLevel _prevLevel = WaterLevel::WATER_DRY;

    static const int THRESHOLD_LOW  = 500;
    static const int THRESHOLD_FULL = 2000;
    static const int SAMPLES        = 5;
};

extern WaterSensor waterSensor;