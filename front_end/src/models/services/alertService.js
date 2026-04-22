// src/models/services/alertService.js
import api from './apiService';

export const alertService = {

  // Toutes les alertes non-dismissées
  // params ex: { category: 'health' } ou { severity: 'critical' }
  getAll: (params = {}) =>
    api.get('/alerts', params),

  // Détail d'une alerte
  getById: (id) =>
    api.get(`/alerts/${id}`),

  // Créer une alerte
  create: (data) =>
    api.post('/alerts', data),

  // Ignorer (dismiss) une alerte
  dismiss: (id) =>
    api.delete(`/alerts/${id}`),
};