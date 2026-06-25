const Coop        = require('../models/Coop');
const User        = require('../models/User');
const Esp32Device = require('../models/Esp32Device');
const createAlert = require('../utils/createAlert');

// GET /api/coops
exports.getAll = async (req, res) => {
  try {
    const coops = await Coop.find({ owner: req.user.id })
      .populate('assignedUsers', 'name avatar role')
      .lean();

    // Ajouter espMac à chaque coop
    const coopsWithMac = await Promise.all(coops.map(async (coop) => {
      const device = await Esp32Device.findOne({ assignedCoop: coop._id, status: 'assigned' }).lean();
      return { ...coop, espMac: device ? device.mac : null };
    }));

    res.status(200).json({ success: true, count: coopsWithMac.length, data: coopsWithMac });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/coops/my
// ✅ DEBUG — logs temporaires ajoutés pour diagnostiquer le problème
// d'affectation éleveur ↔ poulailler. À retirer une fois le bug confirmé/résolu.
exports.getMy = async (req, res) => {
  try {
    console.log('========================================');
    console.log('[DEBUG getMy] req.user.id =', req.user.id, '(type:', typeof req.user.id, ')');

    const coops = await Coop.find({ assignedUsers: req.user.id })
      .populate('assignedUsers', 'name avatar role')
      .lean();

    console.log('[DEBUG getMy] coops trouvées pour cet utilisateur:', coops.length);

    // ✅ Affiche TOUTES les coops et leur champ assignedUsers brut,
    // sans la troncature [Array] de React Native, pour voir exactement
    // ce qui est stocké en base.
    const allCoops = await Coop.find({}).select('name assignedUsers').lean();
    console.log('[DEBUG getMy] Toutes les coops en base et leurs assignedUsers:');
    allCoops.forEach((c) => {
      console.log(
        `  - "${c.name}" (${c._id}) → assignedUsers:`,
        c.assignedUsers.map((u) => u.toString())
      );
    });
    console.log('========================================');

    // Pour chaque coop, chercher l'ESP32 assigné et récupérer sa MAC
    const coopsWithMac = await Promise.all(coops.map(async (coop) => {
      const device = await Esp32Device.findOne({
        assignedCoop: coop._id,
        status: 'assigned',
      }).lean();
      return {
        ...coop,
        espMac: device ? device.mac : null,  // ← ce que l'app utilise pour MQTT
      };
    }));

    res.status(200).json({ success: true, count: coopsWithMac.length, data: coopsWithMac });
  } catch (err) {
    console.error('[DEBUG getMy] ERREUR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/coops/:id
exports.getById = async (req, res) => {
  try {
    const coop = await Coop.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('assignedUsers', 'name avatar role');
    if (!coop) return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    if (coop.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }
    res.status(200).json({ success: true, data: coop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/coops
exports.create = async (req, res) => {
  try {
    req.body.owner = req.user.id;
    const coop = await Coop.create(req.body);
    await createAlert('COOP_CREATED', { name: coop.name, sector: coop.sector || 'N/A' });
    res.status(201).json({ success: true, data: coop, esp32Token: coop.esp32Token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/coops/sensors
exports.receiveSensorData = async (req, res) => {
  try {
    const { esp32Token, temperature, humidity, luminosity, ventilation } = req.body;
    const coop = await Coop.findOne({ esp32Token });
    if (!coop) return res.status(404).json({ success: false, message: 'Token ESP32 invalide.' });

    coop.sensors.temperature.value = temperature ?? coop.sensors.temperature.value;
    coop.sensors.humidity.value    = humidity    ?? coop.sensors.humidity.value;
    coop.sensors.luminosity.value  = luminosity  ?? coop.sensors.luminosity.value;
    coop.sensors.ventilation.value = ventilation ?? coop.sensors.ventilation.value;
    coop.isOnline   = true;
    coop.lastSeenAt = new Date();

    if (temperature > 30) {
      const Alert = require('../models/Alert');
      await Alert.create({
        title: 'Température critique',
        description: `Température de ${temperature}°C détectée.`,
        severity: 'critical', category: 'environment',
        location: coop.name, coop: coop._id,
      });
    }
    await coop.save();
    res.status(200).json({ success: true, message: 'Données reçues.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/coops/:id
exports.update = async (req, res) => {
  try {
    let coop = await Coop.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }
    coop = await Coop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedUsers', 'name avatar role');
    await createAlert('COOP_UPDATED', { name: coop.name, sector: coop.sector || 'N/A' });
    res.status(200).json({ success: true, data: coop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/coops/:id
exports.remove = async (req, res) => {
  try {
    const coop = await Coop.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse.' });
    }

    const freedDevice = await Esp32Device.findOneAndUpdate(
      { assignedCoop: coop._id },
      { $set: { status: 'available', assignedCoop: null, token: null, tokenAcknowledged: false } },
      { new: true }
    );
    if (freedDevice) {
      console.log(`[COOP] ESP32 ${freedDevice.mac} libéré suite à suppression de "${coop.name}"`);
    }

    await createAlert('COOP_DELETED', { name: coop.name, sector: coop.sector || 'N/A' });
    await coop.deleteOne();
    res.status(200).json({ success: true, message: 'Poulailler supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/coops/:id/assign
// ✅ DEBUG — logs temporaires ajoutés
exports.assignUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('[DEBUG assignUser] coopId =', req.params.id, '| userId =', userId, '| req.user =', req.user.id, req.user.role);

    const coop = await Coop.findById(req.params.id);
    if (!coop) {
      console.log('[DEBUG assignUser] Poulailler introuvable !');
      return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    }

    console.log('[DEBUG assignUser] coop.owner =', coop.owner.toString(), '| match req.user.id ?', coop.owner.toString() === req.user.id);

    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('[DEBUG assignUser] ACCÈS REFUSÉ — ni owner, ni admin');
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const result = await Coop.findByIdAndUpdate(req.params.id, { $addToSet: { assignedUsers: userId } }, { new: true });
    console.log('[DEBUG assignUser] assignedUsers après update:', result.assignedUsers.map(String));

    const user = await User.findById(userId).select('name');
    const wasAlreadyAssigned = coop.assignedUsers.map(String).includes(String(userId));
    if (!wasAlreadyAssigned) {
      await createAlert('USER_ASSIGNED', {
        userName: user?.name || 'Éleveur inconnu',
        coopName: coop.name,
        userId,
        coopId: coop._id,
      });
    }

    const updated = await Coop.findById(coop._id).populate('assignedUsers', 'name avatar role');
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('[DEBUG assignUser] ERREUR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/coops/:id/assign/:userId
exports.unassignUser = async (req, res) => {
  try {
    const coop = await Coop.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, message: 'Poulailler introuvable.' });
    if (coop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const wasAssigned = coop.assignedUsers.map(String).includes(String(req.params.userId));
    await Coop.findByIdAndUpdate(req.params.id, { $pull: { assignedUsers: req.params.userId } }, { new: true });

    if (wasAssigned) {
      const user = await User.findById(req.params.userId).select('name');
      await createAlert('USER_UNASSIGNED', {
        userName: user?.name || 'Éleveur inconnu',
        coopName: coop.name,
        userId:   req.params.userId,
        coopId:   coop._id,
      });
    }

    const updated = await Coop.findById(coop._id).populate('assignedUsers', 'name avatar role');
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};