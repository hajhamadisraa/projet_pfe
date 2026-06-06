// src/controllers/hooks/useUsers.js
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { userService } from '../../models/services/userService';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      setUsers(data.filter(Boolean));
    } catch (err) {
      console.error('[useUsers] fetchUsers erreur:', err);
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── APPROBATION (corrigé) ─────────────────────────────
  const approveUser = async (id, payload = {}) => {
    try {
      // On essaie plusieurs patterns courants
      const approved = await userService.approve(id, payload);
      
      setUsers((prev) =>
        prev.map((u) => (u?._id === id || u?.id === id ? approved : u)).filter(Boolean)
      );
      return { success: true, data: approved };
    } catch (err) {
      console.error('[approveUser] Erreur:', err);
      return { success: false, message: err?.message || 'Erreur approbation' };
    }
  };

  const rejectUser = async (id) => {
    try {
      await userService.reject(id);
      setUsers((prev) => prev.filter((u) => u?._id !== id && u?.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur rejet' };
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const updated = await userService.update(id, userData);
      setUsers((prev) =>
        prev.map((u) => (u?._id === id || u?.id === id ? updated : u)).filter(Boolean)
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur modification' };
    }
  };

  const toggleUser = async (id) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u?._id === id || u?.id === id ? { ...u, isActive: !u.isActive } : u))
    );

    try {
      const updated = await userService.toggleStatus(id);
      setUsers((prev) =>
        prev.map((u) => (u?._id === id || u?.id === id ? updated : u)).filter(Boolean)
      );
    } catch (err) {
      fetchUsers(); // rollback
      Alert.alert('Erreur', err?.message || 'Impossible de modifier le statut');
    }
  };

  const deleteUser = async (id) => {
    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((u) => u?._id !== id && u?.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur suppression' };
    }
  };

  const createUser = async (userData) => {
    try {
      const result = await userService.create(userData);
      if (result?.user) {
        setUsers((prev) => [result.user, ...prev]);
      }
      return { success: true, data: result?.user };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur création' };
    }
  };

  return {
    users,
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