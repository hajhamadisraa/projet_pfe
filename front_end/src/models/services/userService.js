// src/models/services/userService.js
import api from './apiService';

// Adaptateur (conservé et amélioré)
export const adaptUser = (u) => {
  if (!u) return null;

  return {
    id:            u._id || u.id,
    name:          u.name,
    email:         u.email,
    role:          u.role === 'admin' ? 'Admin' : 'Eleveur',
    roleBadgeType: u.role === 'admin' ? 'ADMIN' : 'OPERATOR',
    status:        u.status || (u.isActive ? 'ACTIVE' : 'SUSPENDED'),
    isActive:      u.isActive ?? false,
    isOnline:      u.isOnline || false,
    avatar:        u.avatar || null,
    assignedCoops: (u.cooperatives || []).map((c) =>
      typeof c === 'object' && c !== null
        ? { id: String(c._id || c.id), name: c.name || c.nom || '' }
        : { id: String(c), name: String(c) }
    ),
    lastSeen: u.status === 'PENDING'
      ? `Demande le ${new Date(u.createdAt || Date.now()).toLocaleDateString('fr-FR')}`
      : u.updatedAt
        ? new Date(u.updatedAt).toLocaleDateString('fr-FR')
        : "En attente d'activation",
  };
};

// =============================================
export const userService = {

  getAll: async () => {
    const res = await api.get('/users');
    return (res.data || []).map(adaptUser);
  },

  create: async (userData) => {
    const { name, email, roleBadgeType, isActive, assignedCoops = [] } = userData;
    const res = await api.post('/users', {
      name,
      email,
      role: roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive: isActive ?? true,
      cooperatives: assignedCoops.map(c => c.id),
    });
    return { user: adaptUser(res.data), emailSent: false };
  },

  // ==================== APPROBATION (utilise PUT/:id) ====================
  approve: async (id, userData = {}) => {
    const coopIds = userData.cooperatives || [];

    const res = await api.put(`/users/${id}`, {
      status: 'ACTIVE',
      isActive: true,
      cooperatives: coopIds,
    });

    const approvedUser = adaptUser(res.data);

    // Affecter aux poulaillers sélectionnés
    if (coopIds.length > 0) {
      await Promise.allSettled(
        coopIds.map(coopId =>
          api.post(`/coops/${coopId}/assign`, { userId: id })
        )
      );
    }

    return approvedUser;
  },

  // ==================== REJET (suppression) ====================
  reject: async (id) => {
    await api.delete(`/users/${id}`);
    return true;
  },

  update: async (id, userData) => {
    const { name, roleBadgeType, isActive, assignedCoops = [] } = userData;
    const res = await api.put(`/users/${id}`, {
      name,
      role: roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive,
      cooperatives: assignedCoops.map(c => c.id),
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