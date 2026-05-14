// config/config.h
// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION CENTRALE — Poulailler Intelligent ESP32
//  ✅  UN SEUL FIRMWARE pour tous vos ESP32
//  🔑  Token & WiFi provisionnés via portail web (NVS)
// ═══════════════════════════════════════════════════════════════
#pragma once
#include <Arduino.h>

// ───────────────────────────────────────────────────────────────
//  🌐 RÉSEAU WiFi  (ne pas hardcoder ici → stocké en NVS)
// ───────────────────────────────────────────────────────────────
#define WIFI_RECONNECT_DELAY   5000
#define WIFI_MAX_RETRIES       10

// ───────────────────────────────────────────────────────────────
//  🔗 API BACKEND  (commun à tous les ESP32)
// ───────────────────────────────────────────────────────────────
#define API_BASE_URL           "http://192.168.1.112:5000/api"

// Routes (ne pas modifier)
#define API_ROUTE_DATA         "/coops/sensors"
#define API_ROUTE_COMMANDS     "/esp/commands"
#define API_ROUTE_HEARTBEAT    "/esp/heartbeat"
#define HTTP_TIMEOUT           8000

// ───────────────────────────────────────────────────────────────
//  📡 MQTT  (commun à tous les ESP32)
// ───────────────────────────────────────────────────────────────
#define MQTT_ENABLED           true
#define MQTT_BROKER            "192.168.1.112"
#define MQTT_PORT              1883
#define MQTT_KEEPALIVE         60
#define MQTT_RECONNECT_DELAY   5000
#define MQTT_QOS               1

// ───────────────────────────────────────────────────────────────
//  🛠️  PORTAIL DE PROVISIONING (premier démarrage)
// ───────────────────────────────────────────────────────────────
#define SETUP_AP_SSID          "Poulailler-Setup"
#define SETUP_AP_PASSWORD      "12345678"
#define SETUP_PORTAL_TIMEOUT   300000

// ───────────────────────────────────────────────────────────────
//  🗄️  CLÉS NVS (stockage persistant ESP32)
// ───────────────────────────────────────────────────────────────
#define NVS_NAMESPACE          "poulailler"
#define NVS_KEY_WIFI_SSID      "wifi_ssid"
#define NVS_KEY_WIFI_PASS      "wifi_pass"
#define NVS_KEY_MQTT_TOKEN     "mqtt_token"
#define NVS_KEY_PROVISIONED    "provisioned"

// ───────────────────────────────────────────────────────────────
//  📌 PINS GPIO — Capteurs
// ───────────────────────────────────────────────────────────────
#define PIN_DHT                4
#define DHT_TYPE               DHT22
#define PIN_LIGHT_SENSOR       34
#define PIN_SDA                21
#define PIN_SCL                22

// ───────────────────────────────────────────────────────────────
//  📌 PINS GPIO — Actionneurs (relais)
// ───────────────────────────────────────────────────────────────
#define RELAY_ON               LOW
#define RELAY_OFF              HIGH
#define PIN_FAN                16
#define PIN_HEATER             17
#define PIN_LIGHT              18
#define PIN_PAD_COOLING        19
#define PIN_WATER_PUMP         23

// ───────────────────────────────────────────────────────────────
//  ⏱️  INTERVALLES (ms)
// ───────────────────────────────────────────────────────────────
#define INTERVAL_READ_SENSORS  5000
#define INTERVAL_SEND_DATA     10000
#define INTERVAL_GET_COMMANDS  5000
#define INTERVAL_HEARTBEAT     30000

// ───────────────────────────────────────────────────────────────
//  🌡️  SEUILS CLIMATIQUES
// ───────────────────────────────────────────────────────────────
#define TEMP_CRITICAL_HIGH     35.0f
#define TEMP_HIGH              30.0f
#define TEMP_IDEAL_MAX         27.0f
#define TEMP_IDEAL_MIN         18.0f
#define TEMP_LOW               15.0f
#define TEMP_CRITICAL_LOW      10.0f

#define HUMIDITY_HIGH          75.0f
#define HUMIDITY_IDEAL_MAX     65.0f
#define HUMIDITY_IDEAL_MIN     50.0f
#define HUMIDITY_LOW           40.0f

// ───────────────────────────────────────────────────────────────
//  💡 SEUILS ÉCLAIRAGE
// ───────────────────────────────────────────────────────────────
#define LIGHT_ON_HOUR          6
#define LIGHT_OFF_HOUR         20
#define LIGHT_MIN_LUX          20
#define LIGHT_TARGET_LUX       200

// ───────────────────────────────────────────────────────────────
//  💧 SEUILS EAU
// ───────────────────────────────────────────────────────────────
#define WATER_PUMP_DURATION    3000
#define WATER_PUMP_INTERVAL    3600000

// ───────────────────────────────────────────────────────────────
//  🐔 PROFIL ACTIF
// ───────────────────────────────────────────────────────────────
#define PROFILE_POULET_CHAIR   0
#define PROFILE_POULE_PONDEUSE 1
#define PROFILE_POUSSIN        2
#define ACTIVE_PROFILE         PROFILE_POULE_PONDEUSE

// ───────────────────────────────────────────────────────────────
//  🛠️  DEBUG
// ───────────────────────────────────────────────────────────────
#define DEBUG_MODE             true
#define SERIAL_BAUD            115200
#define FIRMWARE_VERSION       "2.0.0"

#if DEBUG_MODE
  #define LOG(x)    Serial.println(x)
  #define LOGF(...) Serial.printf(__VA_ARGS__)
#else
  #define LOG(x)
  #define LOGF(...)
#endif

// ───────────────────────────────────────────────────────────────
//  🌀 VENTILATEUR PWM  ← NOUVEAU (ajouté, rien modifié)
// ───────────────────────────────────────────────────────────────
#define FAN_PWM_CHANNEL        0        // canal LEDC 0
#define FAN_PWM_FREQ           25000    // 25 kHz (silencieux)
#define FAN_PWM_RESOLUTION     8        // 8 bits → 0-255

// Seuils de déclenchement ventilateur (utilise TEMP_IDEAL_MAX et TEMP_HIGH existants)
// Ventilateur démarre à TEMP_IDEAL_MAX (27°C) → max à TEMP_HIGH (30°C)
// Ces valeurs viennent des seuils climatiques déjà définis ci-dessus ↑
#define FAN_SPEED_MIN          80       // vitesse mini pour démarrer (0-255)
#define FAN_HYSTERESIS         1.5f     // anti-oscillation (°C)