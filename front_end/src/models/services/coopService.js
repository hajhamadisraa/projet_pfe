// src/models/services/coopService.js
import api from './apiService';

export const coopService = {

  // Liste toutes les coops de l'utilisateur connecté
  getAll: () =>
    api.get('/coops'),

  // Détail d'une coop
  getById: (id) =>
    api.get(`/coops/${id}`),

  // Créer une coop
  create: (data) =>
    api.post('/coops', data),

  // Modifier une coop
  update: (id, data) =>
    api.put(`/coops/${id}`, data),

  // Supprimer une coop
  remove: (id) =>
    api.delete(`/coops/${id}`),
};