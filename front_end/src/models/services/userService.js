// src/models/services/userService.js
import api from './apiService';

export const adaptUser = (u) => ({
  id:            u._id || u.id,
  name:          u.name,
  email:         u.email,
  roleBadgeType: u.role === 'admin' ? 'ADMIN' : 'OPERATOR',
  role:          u.role === 'admin' ? 'Admin' : 'Eleveur',
  isActive:      u.isActive,
  isOnline:      false,
  assignedCoops: (u.cooperatives || []).map((c) =>
    typeof c === 'object' && c !== null
      ? { id: String(c._id || c.id), name: c.name || c.nom || '' }
      : { id: String(c), name: String(c) }
  ),
  avatar:   u.avatar || null,
  lastSeen: u.updatedAt
    ? new Date(u.updatedAt).toLocaleDateString('fr-FR')
    : "En attente d'activation",
});

export const userService = {

  getAll: async () => {
    const res = await api.get('/users');
    return (res.data || []).map(adaptUser);
  },

  create: async (userData) => {
    const { name, email, roleBadgeType, isActive, assignedCoops } = userData;
    const res = await api.post('/users', {
      name,
      email,
      role:         roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive:     isActive ?? true,
      cooperatives: (assignedCoops || []).map((c) => c.id),
    });
    // backend → { success, emailSent, data: {...} }
    return {
      user:      adaptUser(res.data),
      emailSent: res.emailSent || false,
    };
  },

  update: async (id, userData) => {
    const { name, roleBadgeType, isActive, assignedCoops } = userData;
    const res = await api.put(`/users/${id}`, {
      name,
      role:         roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive,
      cooperatives: (assignedCoops || []).map((c) => c.id),
    });
    return adaptUser(res.data);
  },

  toggleStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle`);
    return adaptUser(res.data);
  },

  remove: async (id) => {
    await api.delete(`/users/${id}`);
    return true;
  },
};