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

// ✅ Helper — exécute les appels d'assignation/désassignation de poulaillers
// et log clairement les échecs au lieu de les avaler silencieusement
// (Promise.allSettled masquait totalement les erreurs 403/404/500).
const syncCoopAssignments = async (userId, toAdd = [], toRemove = []) => {
  const results = await Promise.allSettled([
    ...toAdd.map((coopId) => api.post(`/coops/${coopId}/assign`, { userId })),
    ...toRemove.map((coopId) => api.delete(`/coops/${coopId}/assign/${userId}`)),
  ]);

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    failures.forEach((f) => {
      console.error('[userService] Échec synchronisation poulailler:', f.reason?.response?.data || f.reason?.message || f.reason);
    });
  }

  return { succeeded: results.length - failures.length, failed: failures.length };
};

// =============================================
export const userService = {

  getAll: async () => {
    const res = await api.get('/users');
    return (res.data?.data || res.data || []).map(adaptUser);
  },

  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return adaptUser(res.data?.data || res.data);
  },

  // ==================== CREATION ====================
  // ✅ CORRIGÉ — synchronise aussi Coop.assignedUsers via /coops/:id/assign
  create: async (userData) => {
    const { name, email, roleBadgeType, isActive, assignedCoops = [] } = userData;

    const res = await api.post('/users', {
      name,
      email,
      role: roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive: isActive ?? true,
      cooperatives: assignedCoops.map((c) => c.id),
    });

    const newUser = adaptUser(res.data?.data || res.data);

    if (!newUser?.id) {
      console.error('[userService.create] Réponse inattendue, pas d\'id utilisateur:', res.data);
      return { user: newUser, emailSent: false };
    }

    // ✅ Affecter le nouvel utilisateur aux poulaillers sélectionnés
    if (assignedCoops.length > 0) {
      const coopIds = assignedCoops.map((c) => c.id);
      const sync = await syncCoopAssignments(newUser.id, coopIds, []);
      if (sync.failed > 0) {
        console.warn(`[userService.create] ${sync.failed}/${coopIds.length} affectation(s) de poulailler ont échoué.`);
      }
    }

    return { user: newUser, emailSent: false };
  },

  // ==================== APPROBATION (utilise PUT/:id) ====================
  approve: async (id, userData = {}) => {
    const coopIds = userData.cooperatives || [];

    const res = await api.put(`/users/${id}`, {
      status: 'ACTIVE',
      isActive: true,
      cooperatives: coopIds,
    });

    const approvedUser = adaptUser(res.data?.data || res.data);

    // Affecter aux poulaillers sélectionnés
    if (coopIds.length > 0) {
      const sync = await syncCoopAssignments(id, coopIds, []);
      if (sync.failed > 0) {
        console.warn(`[userService.approve] ${sync.failed}/${coopIds.length} affectation(s) de poulailler ont échoué.`);
      }
    }

    return approvedUser;
  },

  // ==================== REJET (suppression) ====================
  reject: async (id) => {
    await api.delete(`/users/${id}`);
    return true;
  },

  // ==================== MODIFICATION ====================
  // ✅ CORRIGÉ — calcule le diff des poulaillers assignés et synchronise
  // Coop.assignedUsers via /coops/:id/assign (ajout) et
  // /coops/:id/assign/:userId (retrait), en plus de User.cooperatives.
  update: async (id, userData) => {
    const { name, roleBadgeType, isActive, assignedCoops = [] } = userData;

    // 1. Récupérer l'état actuel de l'utilisateur pour calculer le diff
    let previousCoopIds = [];
    try {
      const before = await api.get(`/users/${id}`);
      const beforeData = before.data?.data || before.data;
      previousCoopIds = (beforeData?.cooperatives || []).map((c) =>
        String(typeof c === 'object' && c !== null ? (c._id || c.id) : c)
      );
    } catch (err) {
      console.warn('[userService.update] Impossible de lire l\'état précédent:', err?.message);
    }

    const newCoopIds = assignedCoops.map((c) => String(c.id));

    // 2. Mettre à jour les champs simples + User.cooperatives
    const res = await api.put(`/users/${id}`, {
      name,
      role: roleBadgeType === 'ADMIN' ? 'admin' : 'eleveur',
      isActive,
      cooperatives: newCoopIds,
    });

    // 3. Synchroniser Coop.assignedUsers (ajouts et retraits)
    const toAdd    = newCoopIds.filter((cid) => !previousCoopIds.includes(cid));
    const toRemove = previousCoopIds.filter((cid) => !newCoopIds.includes(cid));

    if (toAdd.length || toRemove.length) {
      const sync = await syncCoopAssignments(id, toAdd, toRemove);
      if (sync.failed > 0) {
        console.warn(`[userService.update] ${sync.failed} synchronisation(s) de poulailler ont échoué (voir logs ci-dessus pour le détail).`);
      }
    }

    return adaptUser(res.data?.data || res.data);
  },

  toggleStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle`);
    return adaptUser(res.data?.data || res.data);
  },

  remove: async (id) => {
    await api.delete(`/users/${id}`);
    return true;
  },
};