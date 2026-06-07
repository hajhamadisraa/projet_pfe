const express = require('express');
const router  = express.Router();
const ChickenCount = require('../models/ChickenCount');
const axios = require('axios');

const ESP_CAM_IP  = process.env.ESP_CAM_IP  || '192.168.1.53';
const ESP_CAM_MAC = process.env.ESP_CAM_MAC || 'EC626084195C';

// US19 — Comptage actuel
router.get('/current', async (req, res) => {
    try {
        const latest = await ChickenCount
            .findOne()
            .sort({ timestamp: -1 });
        res.json(latest || { chicken_count: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// US23 — Historique des comptages
router.get('/history', async (req, res) => {
    try {
        const { limit = 50, days = 7 } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const history = await ChickenCount
            .find({ timestamp: { $gte: since } })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// US20 — Alertes prédateurs
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await ChickenCount
            .find({ predator_alert: true })
            .sort({ timestamp: -1 })
            .limit(20);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analyse manuelle — capture live depuis ESP32-CAM
router.post('/analyze', async (req, res) => {
    try {
        const { detectChickens, analyzeBrightness } = require('../services/aiService');

        // Capturer une frame live depuis l'ESP32-CAM
        let imageBuffer;
        try {
            // 3 captures préliminaires pour réveiller le capteur
            for (let i = 0; i < 3; i++) {
                await axios.get(`http://${ESP_CAM_IP}/capture`, {
                    responseType: 'arraybuffer', timeout: 5000
                }).catch(() => {});
            }
            const response = await axios.get(`http://${ESP_CAM_IP}/capture`, {
                responseType: 'arraybuffer', timeout: 8000
            });
            imageBuffer = Buffer.from(response.data);
        } catch (err) {
            return res.status(500).json({ error: 'ESP32-CAM inaccessible' });
        }

        const result     = await detectChickens(imageBuffer);
        const brightness = await analyzeBrightness(imageBuffer);

        if (!result) {
            return res.status(500).json({ error: 'Erreur analyse IA' });
        }

        // Sauvegarder en MongoDB
        const count = new ChickenCount({
            chicken_count:  result.chicken_count,
            abnormal_count: result.abnormal_count,
            predator_alert: result.predator_alert,
            predators:      result.predators || [],
            brightness:     brightness?.brightness || null,
            light_command:  brightness?.light_command || null,
            camera_id:      'cam_01',
        });
        await count.save();

        res.json({
            chicken_count:  result.chicken_count,
            abnormal_count: result.abnormal_count,
            predator_alert: result.predator_alert,
            predators:      result.predators,
            brightness:     brightness?.brightness,
            light_command:  brightness?.light_command,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;