// src/models/services/userService.js
import api from './apiService';

// ─────────────────────────────────────────
// 🔄 Adaptateur API → Frontend
// Normalise _id→id, role→roleBadgeType, status, cooperatives→assignedCoops
// ─────────────────────────────────────────
export const adaptUser = (u) => {
  if (!u) {
    console.warn('[adaptUser] reçu null/undefined');
    return null;
  }

  return {
    id:            u._id || u.id,
    name:          u.name,
    email:         u.email,
    role:          u.role === 'admin' ? 'Admin' : 'Eleveur',
    roleBadgeType: u.role === 'admin' ? 'ADMIN' : 'OPERATOR',
    status:        u.status || (u.isActive ? 'ACTIVE' : 'SUSPENDED'),
    isActive:      u.isActive  ?? false,
    isOnline:      u.isOnline  || false,
    avatar:        u.avatar    || null,
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

// ─────────────────────────────────────────
// 📡 USER SERVICE
// ─────────────────────────────────────────
export const userService = {

  // ── Récupérer tous les utilisateurs (tous statuts) ──
  getAll: async () => {
    const res = await api.get('/users');
    return (res.data || []).map(adaptUser);
  },

  // ── Créer un utilisateur (flux admin direct) ──
  create: async (userData) => {
    const { name, email, roleBadgeType, isActive, assignedCoops } = userData;

    const res = await api.post('/users', {
      name,
      email,
      role:         roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive:     isActive ?? true,
      cooperatives: (assignedCoops || []).map((c) => c.id),
    });

    const user = adaptUser(res.data);

    // Affecter l'éleveur à chaque poulailler sélectionné
    if (assignedCoops?.length > 0) {
      await Promise.allSettled(
        assignedCoops.map((coop) =>
          api.post(`/coops/${coop.id}/assign`, { userId: user.id })
        )
      );
    }

    return { user, emailSent: res.emailSent || false };
  },

  // ── Approuver un compte PENDING ──────────────────────
  // userData: { cooperatives: ['coopId1', 'coopId2'] }
  approve: async (id, userData = {}) => {
    const coopIds = userData.cooperatives || [];

    const res = await api.patch(`/users/${id}/approve`, {
      cooperatives: coopIds,
    });

    const approvedUser = adaptUser(res.data);

    // Affecter aux poulaillers si sélectionnés
    if (coopIds.length > 0) {
      await Promise.allSettled(
        coopIds.map((coopId) =>
          api.post(`/coops/${coopId}/assign`, { userId: id })
        )
      );
    }

    return approvedUser;
  },

  // ── Rejeter un compte PENDING ────────────────────────
  reject: async (id, reason) => {
    await api.patch(`/users/${id}/reject`, { reason: reason || '' });
    return true;
  },

  // ── Modifier un utilisateur ──────────────────────────
  update: async (id, userData) => {
    const { name, roleBadgeType, isActive, assignedCoops } = userData;

    const res = await api.put(`/users/${id}`, {
      name,
      role:         roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive,
      cooperatives: (assignedCoops || []).map((c) => c.id),
    });

    const updatedUser = adaptUser(res.data);

    // Récupérer tous les poulaillers pour gérer les affectations
    const allCoopsRes = await api.get('/coops');
    const allCoops = allCoopsRes.data || [];

    // Retirer l'éleveur de tous les poulaillers où il était
    const removePromises = allCoops
      .filter((coop) =>
        (coop.assignedUsers || []).some(
          (u) => String(u._id || u) === String(id)
        )
      )
      .map((coop) => api.delete(`/coops/${coop._id}/assign/${id}`));

    await Promise.allSettled(removePromises);

    // Affecter aux nouveaux poulaillers sélectionnés
    if (assignedCoops?.length > 0) {
      await Promise.allSettled(
        assignedCoops.map((coop) =>
          api.post(`/coops/${coop.id}/assign`, { userId: id })
        )
      );
    }

    return updatedUser;
  },

  // ── Toggle actif / suspendu ──────────────────────────
  toggleStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle`);
    return adaptUser(res.data);
  },

  // ── Supprimer un utilisateur ─────────────────────────
  remove: async (id) => {
    // Retirer l'éleveur de tous ses poulaillers avant suppression
    try {
      const allCoopsRes = await api.get('/coops');
      const allCoops = allCoopsRes.data || [];
      await Promise.allSettled(
        allCoops
          .filter((coop) =>
            (coop.assignedUsers || []).some(
              (u) => String(u._id || u) === String(id)
            )
          )
          .map((coop) => api.delete(`/coops/${coop._id}/assign/${id}`))
      );
    } catch (_) {}

    await api.delete(`/users/${id}`);
    return true;
  },
};