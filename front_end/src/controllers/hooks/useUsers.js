// src/controllers/hooks/useUsers.js
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { userService } from '../../models/services/userService';

const useUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Charger tous les utilisateurs ─────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Créer un utilisateur ───────────────
  const createUser = async (userData) => {
    try {
      const { user, emailSent } = await userService.create(userData);

      // Le compte est inactif jusqu'à l'activation par email
      // On l'ajoute quand même à la liste pour qu'il soit visible
      setUsers((prev) => [user, ...prev]);

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

  // ── Modifier un utilisateur ────────────
  const updateUser = async (id, userData) => {
    try {
      const updated = await userService.update(id, userData);
      setUsers((prev) => prev.map((u) => u.id === id ? updated : u));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur modification' };
    }
  };

  // ── Toggle actif / suspendu (optimistic) ─
  const toggleUser = async (id) => {
    // 1. Mise à jour immédiate dans l'UI
    setUsers((prev) =>
      prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u)
    );
    try {
      // 2. Appel API
      const updated = await userService.toggleStatus(id);
      // 3. Sync avec la vraie valeur backend
      setUsers((prev) => prev.map((u) => u.id === id ? updated : u));
    } catch (err) {
      // 4. Rollback si erreur
      fetchUsers();
      Alert.alert('Erreur', err?.message || 'Impossible de modifier le statut.');
    }
  };

  // ── Supprimer un utilisateur ───────────
  const deleteUser = async (id) => {
    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur suppression' };
    }
  };

  return {
    users, loading, error,
    fetchUsers,
    createUser,
    updateUser,
    toggleUser,
    deleteUser,
  };
};

export default useUsers;