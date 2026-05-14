// communication/wifi_manager.h
// ═══════════════════════════════════════════════════════════════
//  WiFiManager — Version 2
//  ✅ Portail web WiFi uniquement (plus de token)
//  ✅ Enregistrement MAC au backend
//  ✅ Polling jusqu'à assignation depuis l'app
// ═══════════════════════════════════════════════════════════════
#pragma once
#include <Arduino.h>

class WiFiManager {
public:
    void begin();
    void handle();

    bool    isConnected()    const;
    bool    isProvisioned()  const;
    String  getToken()       const;
    String  getMac()         const;
    String  getIP()          const;
    void    resetProvisionning();

private:
    void    startSetupPortal();
    String  buildSetupPage();
    String  buildSuccessPage();

    void    registerToBackend();
    void    pollForToken();

    bool    loadFromNVS();
    void    saveWiFiToNVS(const String& ssid, const String& password);
    void    saveTokenToNVS(const String& token);
    void    clearNVS();

    void    connectWiFi(const String& ssid, const String& password);
    void    reconnectIfNeeded();

    bool     _provisioned             = false;
    bool     _connected               = false;
    bool     _setupMode               = false;

    String   _ssid                    = "";
    String   _password                = "";
    String   _token                   = "";
    String   _mac                     = "";

    unsigned long _lastReconnectAttempt = 0;
    unsigned long _setupStartTime       = 0;
    unsigned long _lastPollTime         = 0;
};