#pragma once
#include <Arduino.h>

#define API_BASE_URL           "http://192.168.1.112:5000/api"
#define MQTT_BROKER            "192.168.1.112"
#define MQTT_PORT              1883
#define MQTT_KEEPALIVE         60
#define MQTT_RECONNECT_DELAY   5000

#define SETUP_AP_SSID          "Poulailler-Setup"
#define SETUP_AP_PASSWORD      "12345678"
#define SETUP_PORTAL_TIMEOUT   300000

#define NVS_NAMESPACE          "poulailler"
#define NVS_KEY_WIFI_SSID      "wifi_ssid"
#define NVS_KEY_WIFI_PASS      "wifi_pass"
#define NVS_KEY_MQTT_TOKEN     "mqtt_token"
#define NVS_KEY_PROVISIONED    "provisioned"

// ── Capteurs ──────────────────────────────────────────────────
#define PIN_DHT                4
#define DHT_TYPE               DHT22
#define PIN_LIGHT_SENSOR       34
#define PIN_WATER_SENSOR       35   // GPIO35 → broche S du capteur
#define PIN_WATER_POWER        32   // ✅ GPIO32 → broche + du capteur (alimentation pulsée)

// ── Relais ────────────────────────────────────────────────────
#define RELAY_ON               LOW
#define RELAY_OFF              HIGH
#define PIN_FAN                16
#define PIN_HEATER             17
#define PIN_LIGHT              18
#define PIN_PAD_COOLING        19
#define PIN_WATER_PUMP         25

// ── Intervalles ───────────────────────────────────────────────
#define INTERVAL_SEND_DATA     10000
#define INTERVAL_HEARTBEAT     30000
#define INTERVAL_GET_COMMANDS  5000

// ── Seuils climatiques ────────────────────────────────────────
#define TEMP_CRITICAL_HIGH     35.0f
#define TEMP_HIGH              30.0f
#define TEMP_IDEAL_MAX         27.0f
#define TEMP_IDEAL_MIN         18.0f
#define FAN_HYSTERESIS         1.5f

// ── Debug ─────────────────────────────────────────────────────
#define SERIAL_BAUD            115200
#define FIRMWARE_VERSION       "4.0.0"