const cron = require('node-cron');
const { detectChickens, analyzeBrightness } = require('./aiService');
const ChickenCount = require('../models/ChickenCount');

const TEST_IMAGE = './test_image.jpg';
let io = null;

async function runAnalysis() {
    console.log(`[MONITOR] Analyse — ${new Date().toLocaleTimeString()}`);

    // 1. Détecter les poules
    const result = await detectChickens(TEST_IMAGE);
    if (!result) return;

    // 2. Analyser la luminosité
    const brightness = await analyzeBrightness(TEST_IMAGE);

    // 3. Sauvegarder en MongoDB
    const count = new ChickenCount({
        chicken_count:  result.chicken_count,
        abnormal_count: result.abnormal_count,
        predator_alert: result.predator_alert,
        predators:      result.predators,
        brightness:     brightness?.brightness || null,
        light_command:  brightness?.light_command || null,
        camera_id:      'cam_01'
    });
    await count.save();

    console.log(`[MONITOR] Poules: ${result.chicken_count} | Anormales: ${result.abnormal_count}`);

    // 4. Envoyer en temps réel via Socket.IO à l'app mobile
    if (io) {
        io.to('coop_cam_01').emit('chicken_update', {
            chicken_count:  result.chicken_count,
            abnormal_count: result.abnormal_count,
            predator_alert: result.predator_alert,
            brightness:     brightness?.brightness,
            light_command:  brightness?.light_command,
            timestamp:      new Date()
        });
    }

    // 5. Alerte prédateur — Socket.IO urgent
    if (result.predator_alert && io) {
        console.log('[MONITOR] ALERTE PREDATEUR :', result.predators);
        io.to('coop_cam_01').emit('predator_alert', {
            predators: result.predators,
            timestamp: new Date(),
            message:   'Prédateur détecté dans le poulailler !'
        });
    }

    // 6. Commande éclairage via MQTT
    if (brightness?.light_command) {
        const mqttService = require('./mqttService');
        mqttService.publish(
            'poulailler/lighting/command',
            brightness.light_command
        );
        console.log(`[MONITOR] Eclairage → ${brightness.light_command}`);
    }
}

function startMonitoring(socketIo) {
    io = socketIo;
    console.log('[MONITOR] Surveillance démarrée — toutes les 30 secondes');
    cron.schedule('*/30 * * * * *', runAnalysis);
}

module.exports = { startMonitoring };