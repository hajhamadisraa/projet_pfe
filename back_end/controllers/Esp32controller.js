// controllers/esp32Controller.js
const crypto      = require('crypto');
const Esp32Device = require('../models/Esp32Device');
const Coop        = require('../models/Coop');

// POST /api/esp32/register
exports.register = async (req, res) => {
  try {
    const { mac, firmwareVersion, ipAddress } = req.body;
    if (!mac) return res.status(400).json({ success: false, message: 'MAC obligatoire.' });

    const device = await Esp32Device.findOneAndUpdate(
      { mac: mac.toUpperCase() },
      {
        firmwareVersion: firmwareVersion || null,
        ipAddress:       ipAddress       || null,
        lastSeenAt:      new Date(),
        isOnline:        true,
        $setOnInsert: { status: 'available', assignedCoop: null, token: null }
      },
      { upsert: true, new: true }
    );

    console.log(`[ESP32] Enregistré : ${mac} — statut: ${device.status}`);

    res.status(200).json({
      success:  true,
      status:   device.status,
      token:    device.token,
      assigned: device.status === 'assigned',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/esp32/poll/:mac
exports.poll = async (req, res) => {
  try {
    const device = await Esp32Device.findOne({ mac: req.params.mac.toUpperCase() });
    if (!device) return res.status(404).json({ success: false, message: 'ESP32 non enregistré.' });

    device.lastSeenAt = new Date();
    device.isOnline   = true;
    await device.save();
    

    if (device.status === 'assigned' && device.token) {
      device.tokenAcknowledged = true;
      await device.save();
      return res.status(200).json({ success: true, assigned: true, token: device.token });
    }

    res.status(200).json({ success: true, assigned: false, token: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/esp32/available
exports.getAvailable = async (req, res) => {
  try {
    const devices = await Esp32Device.find({ status: 'available' })
      .sort({ lastSeenAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/esp32/all
exports.getAll = async (req, res) => {
  try {
    const devices = await Esp32Device.find()
      .populate('assignedCoop', 'name sector')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/esp32/assign
exports.assign = async (req, res) => {
  try {
    const { mac, coopId } = req.body;

    // 1. Vérifier que le poulailler cible existe
    const coop = await Coop.findById(coopId);
    if (!coop) return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    if (coop.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    // 2. Vérifier que l'ESP32 existe
    const device = await Esp32Device.findOne({ mac: mac.toUpperCase() });
    if (!device) return res.status(404).json({ success: false, message: 'ESP32 introuvable.' });

    // ✅ 3. Si l'ESP32 était déjà assigné à une AUTRE coop
    //       → régénérer le token de l'ancienne coop pour couper la connexion
    if (device.status === 'assigned' && device.assignedCoop) {
      const oldCoopId = device.assignedCoop.toString();
      if (oldCoopId !== coopId.toString()) {
        const newToken = crypto.randomBytes(20).toString('hex');
        await Coop.findByIdAndUpdate(oldCoopId, {
          esp32Token: newToken,
          isOnline:   false,
        });
        console.log(`[ESP32] Token de l'ancienne coop ${oldCoopId} régénéré → ESP32 déconnecté`);
      }
    }

    // ✅ 4. Si une autre ESP32 est déjà assignée à la coop cible → la libérer
    //       et régénérer le token de la coop pour couper l'ancienne ESP32
    const existingDevice = await Esp32Device.findOne({
      assignedCoop: coopId,
      mac: { $ne: mac.toUpperCase() },
    });
    if (existingDevice) {
      existingDevice.status            = 'available';
      existingDevice.assignedCoop      = null;
      existingDevice.token             = null;
      existingDevice.tokenAcknowledged = false;
      await existingDevice.save();

      // Régénérer le token de la coop pour que l'ancienne ESP32 ne puisse plus envoyer
      const newToken = crypto.randomBytes(20).toString('hex');
      await Coop.findByIdAndUpdate(coopId, { esp32Token: newToken });
      // Recharger la coop avec le nouveau token
      const refreshedCoop = await Coop.findById(coopId);
      coop.esp32Token = refreshedCoop.esp32Token;

      console.log(`[ESP32] ${existingDevice.mac} libéré de la coop ${coopId} (remplacé par ${mac})`);
    }

    // 5. Assigner le nouvel ESP32 avec le token actuel de la coop
    device.status            = 'assigned';
    device.assignedCoop      = coopId;
    device.token             = coop.esp32Token;
    device.tokenAcknowledged = false;
    await device.save();
    // Sauvegarder la MAC dans la Coop pour que l'app puisse la récupérer
    await Coop.findByIdAndUpdate(coopId, { espMac: mac.toUpperCase() });
    console.log(`[ESP32] ${mac} assigné au poulailler "${coop.name}" avec token ${coop.esp32Token}`);

    res.status(200).json({
      success: true,
      message: `ESP32 assigné au poulailler "${coop.name}". Il sera opérationnel dans les 30 secondes.`,
      data:    device,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/esp32/unassign/:mac
exports.unassign = async (req, res) => {
  try {
    const device = await Esp32Device.findOne({ mac: req.params.mac.toUpperCase() });
    if (!device) return res.status(404).json({ success: false, message: 'ESP32 introuvable.' });

    // ✅ Régénérer le token de la coop pour couper définitivement la connexion
    if (device.assignedCoop) {
      const newToken = crypto.randomBytes(20).toString('hex');
      await Coop.findByIdAndUpdate(device.assignedCoop, {
        esp32Token: newToken,
        isOnline:   false,
      });
      console.log(`[ESP32] Token de la coop ${device.assignedCoop} régénéré après libération`);
    }

    device.status            = 'available';
    device.assignedCoop      = null;
    device.token             = null;
    device.tokenAcknowledged = false;
    await device.save();
    await Coop.findByIdAndUpdate(device.assignedCoop, { espMac: null });
    res.status(200).json({
      success: true,
      message: 'ESP32 libéré. Il repassera en mode configuration.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};