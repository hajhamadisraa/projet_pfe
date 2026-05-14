const express = require('express');
const router  = express.Router();
const ChickenCount = require('../models/ChickenCount');

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

// Analyse manuelle — déclencher une analyse maintenant
router.post('/analyze', async (req, res) => {
    try {
        const { detectChickens, analyzeBrightness } = require('../services/aiService');
        const TEST_IMAGE = 'C:/Users/Israa/Desktop/projet_pfe_Poulailler/back_end/test_image.jpg';

        const result     = await detectChickens(TEST_IMAGE);
        const brightness = await analyzeBrightness(TEST_IMAGE);

        if (!result) {
            return res.status(500).json({ error: 'Erreur analyse IA' });
        }

        res.json({
            chicken_count:  result.chicken_count,
            abnormal_count: result.abnormal_count,
            predator_alert: result.predator_alert,
            predators:      result.predators,
            brightness:     brightness?.brightness,
            light_command:  brightness?.light_command
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;