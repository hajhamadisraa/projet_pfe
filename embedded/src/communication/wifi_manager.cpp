// communication/wifi_manager.cpp — VERSION MISE À JOUR
// ═══════════════════════════════════════════════════════════════
//  Changements vs version précédente :
//  ✅ Portail web demande JUSTE le WiFi (plus de token à saisir)
//  ✅ Après connexion WiFi → enregistrement MAC au backend
//  ✅ Polling toutes les 10s jusqu'à assignation depuis l'app
// ═══════════════════════════════════════════════════════════════
#include "wifi_manager.h"
#include "../config/config.h"

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

static WebServer   server(80);
static Preferences prefs;

// ─────────────────────────────────────────────────────────────
//  begin()
// ─────────────────────────────────────────────────────────────
void WiFiManager::begin() {
    Serial.println("\n[WiFiMgr] Démarrage...");

    // Calculer la MAC une seule fois
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X%02X%02X%02X%02X%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    _mac = String(macStr);
    Serial.println("[WiFiMgr] MAC : " + _mac);

    if (loadFromNVS()) {
        Serial.println("[WiFiMgr] ✅ Credentials WiFi trouvés en NVS");
        connectWiFi(_ssid, _password);

        // Si token déjà en NVS → opérationnel directement
        if (!_token.isEmpty()) {
            Serial.println("[WiFiMgr] ✅ Token trouvé en NVS → opérationnel");
            _provisioned = true;
        } else {
            // WiFi OK mais pas encore de token → enregistrer et attendre assignation
            Serial.println("[WiFiMgr] ⏳ Pas de token → enregistrement et attente assignation...");
            registerToBackend();
        }
    } else {
        Serial.println("[WiFiMgr] ⚠️  Aucun credential → Mode Setup");
        startSetupPortal();
    }
}

// ─────────────────────────────────────────────────────────────
//  handle() — appelé dans loop()
// ─────────────────────────────────────────────────────────────
void WiFiManager::handle() {
    if (_setupMode) {
        server.handleClient();
        if (millis() - _setupStartTime > SETUP_PORTAL_TIMEOUT) {
            Serial.println("[WiFiMgr] ⏰ Timeout portail → Redémarrage");
            ESP.restart();
        }
        return;
    }

    reconnectIfNeeded();

    // Si connecté mais pas encore de token → polling
    if (_connected && !_provisioned) {
        if (millis() - _lastPollTime > 10000) {
            _lastPollTime = millis();
            pollForToken();
        }
    }
}

// ═════════════════════════════════════════════════════════════
//  Enregistrement MAC au backend
// ═════════════════════════════════════════════════════════════
void WiFiManager::registerToBackend() {
    if (!_connected) return;

    HTTPClient http;
    String url = String(API_BASE_URL) + "/esp32/register";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Envoyer MAC + version firmware + IP
    StaticJsonDocument<200> doc;
    doc["mac"]             = _mac;
    doc["firmwareVersion"] = FIRMWARE_VERSION;
    doc["ipAddress"]       = WiFi.localIP().toString();

    String body;
    serializeJson(doc, body);
    int code = http.POST(body);

    if (code == 200) {
        String resp = http.getString();
        StaticJsonDocument<200> res;
        deserializeJson(res, resp);

        Serial.println("[WiFiMgr] ✅ Enregistré au backend !");
        Serial.println("[WiFiMgr] En attente d'assignation depuis l'app...");

        // Si déjà assigné (ex: redémarrage après assignation)
        if (res["assigned"] == true && !res["token"].isNull()) {
            _token = res["token"].as<String>();
            saveTokenToNVS(_token);
            _provisioned = true;
            Serial.println("[WiFiMgr] ✅ Déjà assigné → Token récupéré !");
        }
    } else {
        Serial.println("[WiFiMgr] ⚠️  Erreur enregistrement : " + String(code));
    }
    http.end();
}

// ─────────────────────────────────────────────────────────────
//  Polling : est-ce que l'app m'a assigné ?
// ─────────────────────────────────────────────────────────────
void WiFiManager::pollForToken() {
    HTTPClient http;
    String url = String(API_BASE_URL) + "/esp32/poll/" + _mac;
    http.begin(url);
    http.setTimeout(5000);

    int code = http.GET();
    if (code == 200) {
        String resp = http.getString();
        StaticJsonDocument<200> res;
        deserializeJson(res, resp);

        if (res["assigned"] == true && !res["token"].isNull()) {
            _token = res["token"].as<String>();
            saveTokenToNVS(_token);
            _provisioned = true;
            Serial.println("\n[WiFiMgr] 🎉 Token reçu depuis l'app !");
            Serial.println("[WiFiMgr] Poulailler opérationnel !");
        } else {
            Serial.print(".");  // Affiche un point pendant l'attente
        }
    }
    http.end();
}

// ═════════════════════════════════════════════════════════════
//  MODE SETUP — Portail (WiFi seulement, pas de token)
// ═════════════════════════════════════════════════════════════
void WiFiManager::startSetupPortal() {
    _setupMode      = true;
    _setupStartTime = millis();

    WiFi.mode(WIFI_AP);
    WiFi.softAP(SETUP_AP_SSID, SETUP_AP_PASSWORD);

    Serial.println("[WiFiMgr] 📡 Point d'accès créé !");
    Serial.println("[WiFiMgr] SSID : " + String(SETUP_AP_SSID));
    Serial.println("[WiFiMgr] IP   : " + WiFi.softAPIP().toString());

    server.on("/", HTTP_GET, [this]() {
        server.send(200, "text/html", buildSetupPage());
    });

    server.on("/save", HTTP_POST, [this]() {
        String ssid     = server.arg("ssid");
        String password = server.arg("password");

        if (ssid.isEmpty()) {
            server.send(400, "text/html", "<h2>❌ SSID obligatoire</h2><a href='/'>← Retour</a>");
            return;
        }

        // Sauvegarder WiFi en NVS (sans token — il viendra de l'app)
        saveWiFiToNVS(ssid, password);
        server.send(200, "text/html", buildSuccessPage());
        delay(2000);
        ESP.restart();
    });

    server.begin();
}

// ─────────────────────────────────────────────────────────────
//  HTML — Page du portail (WiFi seulement)
// ─────────────────────────────────────────────────────────────
String WiFiManager::buildSetupPage() {
    return R"rawhtml(
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>⚙️ Configuration WiFi</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Arial, sans-serif;
      background: #f0f4f8;
      display: flex; justify-content: center;
      align-items: center; min-height: 100vh; padding: 20px;
    }
    .card {
      background: white; border-radius: 16px;
      padding: 32px 24px; max-width: 420px; width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .icon { font-size: 48px; text-align: center; margin-bottom: 8px; }
    h1 { font-size: 22px; text-align: center; color: #1a202c; margin-bottom: 6px; }
    .subtitle { text-align: center; color: #718096; font-size: 14px; margin-bottom: 24px; }
    .info-box {
      background: #f0fdf4; border-left: 3px solid #1B4332;
      border-radius: 8px; padding: 12px 14px;
      font-size: 13px; color: #1B4332; margin-bottom: 20px;
      line-height: 1.6;
    }
    label { display: block; font-size: 13px; font-weight: 600; color: #4a5568; margin-bottom: 6px; margin-top: 16px; }
    input {
      width: 100%; padding: 12px 14px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 15px; outline: none;
    }
    .hint { font-size: 12px; color: #a0aec0; margin-top: 4px; }
    button {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #1B4332, #2d6a4f);
      color: white; border: none; border-radius: 10px;
      font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Configuration WiFi</h1>
    <p class="subtitle">Étape 1 sur 2</p>
    <div class="info-box">
      ✅ <strong>Plus besoin de token !</strong><br>
      Entrez juste votre WiFi. Ensuite, assignez cet ESP32 à un poulailler depuis l'application mobile.
    </div>
    <form method="POST" action="/save">
      <label>Nom du réseau WiFi (SSID)</label>
      <input type="text" name="ssid" placeholder="Ex: MonWiFi" required autocomplete="off">
      <p class="hint">⚠️ Réseau 2.4 GHz uniquement (pas de _5G)</p>
      <label>Mot de passe WiFi</label>
      <input type="password" name="password" placeholder="Mot de passe">
      <button type="submit">🔌 Connecter</button>
    </form>
  </div>
</body>
</html>)rawhtml";
}

String WiFiManager::buildSuccessPage() {
    return R"rawhtml(
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex;
         justify-content: center; align-items: center; min-height: 100vh; }
  .card { background: white; border-radius: 16px; padding: 40px 32px;
          text-align: center; max-width: 360px; width: 90%; }
  .icon { font-size: 64px; margin-bottom: 16px; }
  h1 { color: #1B4332; margin-bottom: 12px; }
  p  { color: #718096; font-size: 15px; line-height: 1.6; }
  .step { background: #f0fdf4; border-radius: 12px; padding: 16px; margin-top: 20px;
          font-size: 14px; color: #1B4332; text-align: left; }
</style></head><body>
<div class="card">
  <div class="icon">✅</div>
  <h1>WiFi configuré !</h1>
  <p>L'ESP32 redémarre et se connecte à votre réseau.</p>
  <div class="step">
    📱 <strong>Étape suivante :</strong><br>
    Ouvrez l'application mobile → sélectionnez un poulailler → assignez cet ESP32.
  </div>
</div></body></html>)rawhtml";
}

// ═════════════════════════════════════════════════════════════
//  NVS
// ═════════════════════════════════════════════════════════════
bool WiFiManager::loadFromNVS() {
    prefs.begin(NVS_NAMESPACE, true);
    bool ok = prefs.getBool(NVS_KEY_PROVISIONED, false);
    if (ok) {
        _ssid     = prefs.getString(NVS_KEY_WIFI_SSID, "");
        _password = prefs.getString(NVS_KEY_WIFI_PASS, "");
        _token    = prefs.getString(NVS_KEY_MQTT_TOKEN, "");
    }
    prefs.end();
    return ok && !_ssid.isEmpty();
}

void WiFiManager::saveWiFiToNVS(const String& ssid, const String& password) {
    prefs.begin(NVS_NAMESPACE, false);
    prefs.putBool(NVS_KEY_PROVISIONED, true);
    prefs.putString(NVS_KEY_WIFI_SSID, ssid);
    prefs.putString(NVS_KEY_WIFI_PASS, password);
    prefs.putString(NVS_KEY_MQTT_TOKEN, "");  // token vide au départ
    prefs.end();
    _ssid = ssid; _password = password; _token = "";
    Serial.println("[NVS] ✅ WiFi sauvegardé (token en attente)");
}

void WiFiManager::saveTokenToNVS(const String& token) {
    prefs.begin(NVS_NAMESPACE, false);
    prefs.putString(NVS_KEY_MQTT_TOKEN, token);
    prefs.end();
    Serial.println("[NVS] ✅ Token sauvegardé !");
}

void WiFiManager::clearNVS() {
    prefs.begin(NVS_NAMESPACE, false);
    prefs.clear();
    prefs.end();
    _provisioned = false;
    _ssid = _password = _token = "";
    Serial.println("[NVS] 🗑️  Credentials effacés");
}

// ═════════════════════════════════════════════════════════════
//  WiFi
// ═════════════════════════════════════════════════════════════
void WiFiManager::connectWiFi(const String& ssid, const String& password) {
    Serial.println("[WiFi] Connexion à " + ssid + "...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        delay(500); Serial.print(".");
        if (millis() - start > 15000) {
            Serial.println("\n[WiFi] ⚠️  Timeout"); _connected = false; return;
        }
    }
    _connected = true;
    Serial.println("\n[WiFi] ✅ IP : " + WiFi.localIP().toString());
}

void WiFiManager::reconnectIfNeeded() {
    if (WiFi.status() == WL_CONNECTED) { _connected = true; return; }
    if (millis() - _lastReconnectAttempt > 10000) {
        _lastReconnectAttempt = millis();
        _connected = false;
        connectWiFi(_ssid, _password);
    }
}

// Getters
bool   WiFiManager::isConnected()   const { return _connected; }
bool   WiFiManager::isProvisioned() const { return _provisioned; }
String WiFiManager::getToken()      const { return _token; }
String WiFiManager::getMac()        const { return _mac; }
String WiFiManager::getIP()         const { return WiFi.localIP().toString(); }
void   WiFiManager::resetProvisionning()  { clearNVS(); ESP.restart(); }