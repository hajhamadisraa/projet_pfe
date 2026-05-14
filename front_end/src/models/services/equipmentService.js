// src/models/services/equipmentService.js
import api from './apiService';

export const equipmentService = {

  // Tous les équipements (filtrable par coop)
  // params ex: { coopId: '64abc...' }
  getAll: (params = {}) =>
    api.get('/equipment', params),

  // Détail d'un équipement
  getById: (id) =>
    api.get(`/equipment/${id}`),

  // Créer un équipement
  create: (data) =>
    api.post('/equipment', data),

  // Toggle ON/OFF
  toggle: (id) =>
    api.put(`/equipment/${id}/toggle`),

  // Modifier un équipement
  update: (id, data) =>
    api.put(`/equipment/${id}`, data),
};