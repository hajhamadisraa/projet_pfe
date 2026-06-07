// services/aiService.js
const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://192.168.1.112:8000';

// ─────────────────────────────────────────────────────────────
// Helper : construit un FormData depuis un Buffer OU un chemin
// ─────────────────────────────────────────────────────────────
function buildForm(imageInput) {
  const form = new FormData();
  if (Buffer.isBuffer(imageInput)) {
    // Buffer capturé depuis l'ESP32-CAM
    form.append('file', imageInput, {
      filename:    'frame.jpg',
      contentType: 'image/jpeg',
    });
  } else {
    // Chemin fichier (rétrocompatibilité)
    form.append('file', fs.createReadStream(imageInput));
  }
  return form;
}

// ─────────────────────────────────────────────────────────────
// detectChickens — accepte Buffer ou chemin fichier
// ─────────────────────────────────────────────────────────────
async function detectChickens(imageInput) {
  try {
    const form     = buildForm(imageInput);
    const response = await axios.post(
      `${AI_SERVER_URL}/detect`,
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.error('[AI] Erreur /detect :', error.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// analyzeBrightness — accepte Buffer ou chemin fichier
// ─────────────────────────────────────────────────────────────
async function analyzeBrightness(imageInput) {
  try {
    const form     = buildForm(imageInput);
    const response = await axios.post(
      `${AI_SERVER_URL}/brightness`,
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.error('[AI] Erreur /brightness :', error.message);
    return null;
  }
}

module.exports = { detectChickens, analyzeBrightness };