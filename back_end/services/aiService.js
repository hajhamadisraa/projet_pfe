const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

async function detectChickens(imagePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));
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

async function analyzeBrightness(imagePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));
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