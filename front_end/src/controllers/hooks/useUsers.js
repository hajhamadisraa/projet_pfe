// src/controllers/hooks/useUsers.js
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { userService } from '../../models/services/userService';

const useUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Charger tous les utilisateurs ────────────────────
  // ✅ userService.getAll() appelle déjà adaptUser() sur chaque entrée
  //    → NE PAS re-mapper, utiliser le résultat directement
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      // ✅ filter(Boolean) pour retirer toute entrée null/undefined
      setUsers(data.filter(Boolean));
    } catch (err) {
      console.error('[useUsers] fetchUsers erreur:', err);
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Dérivés utiles ────────────────────────────────────
  const pendingUsers = users.filter((u) => u?.status === 'PENDING');
  const activeUsers  = users.filter((u) => u && u.status !== 'PENDING');

  // ── Créer un utilisateur (flux admin direct) ──────────
  const createUser = async (userData) => {
    try {
      const { user, emailSent } = await userService.create(userData);
      if (user) setUsers((prev) => [user, ...prev]);

      if (emailSent) {
        Alert.alert(
          '✉️ Invitation envoyée',
          `Un email d'activation a été envoyé à ${user.email}.\n\nL'utilisateur doit cliquer sur le lien pour choisir son mot de passe.`,
          [{ text: 'OK' }]
        );
      }

      return { success: true, data: user };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur création' };
    }
  };

  // ── Approuver un compte PENDING ───────────────────────
  const approveUser = async (id, userData = {}) => {
    try {
      const approved = await userService.approve(id, userData);
      setUsers((prev) => prev.map((u) => u?.id === id ? approved : u).filter(Boolean));
      return { success: true, data: approved };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur approbation' };
    }
  };

  // ── Rejeter un compte PENDING ─────────────────────────
  const rejectUser = async (id, reason) => {
    try {
      await userService.reject(id, reason);
      setUsers((prev) => prev.filter((u) => u?.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur rejet' };
    }
  };

  // ── Modifier un utilisateur ───────────────────────────
  const updateUser = async (id, userData) => {
    try {
      const updated = await userService.update(id, userData);
      setUsers((prev) => prev.map((u) => u?.id === id ? updated : u).filter(Boolean));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur modification' };
    }
  };

  // ── Toggle actif / suspendu (optimistic) ─────────────
  const toggleUser = async (id) => {
    setUsers((prev) =>
      prev.map((u) => u?.id === id ? { ...u, isActive: !u.isActive } : u)
    );
    try {
      const updated = await userService.toggleStatus(id);
      setUsers((prev) => prev.map((u) => u?.id === id ? updated : u).filter(Boolean));
    } catch (err) {
      fetchUsers();
      Alert.alert('Erreur', err?.message || 'Impossible de modifier le statut.');
    }
  };

  // ── Supprimer un utilisateur ──────────────────────────
  const deleteUser = async (id) => {
    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((u) => u?.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur suppression' };
    }
  };

  return {
    users,
    pendingUsers,
    activeUsers,
    loading,
    error,
    fetchUsers,
    createUser,
    approveUser,
    rejectUser,
    updateUser,
    toggleUser,
    deleteUser,
  };
};

export default useUsers;