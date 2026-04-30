// src/controllers/hooks/useCoops.js
import { useCallback, useEffect, useState } from 'react';
import { coopService } from '../../models/services/coopService';

const useCoops = () => {
  const [coops,   setCoops]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Charger tous les poulaillers
  const fetchCoops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await coopService.getAll();
      setCoops(res.data ?? res);
    } catch (err) {
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoops(); }, [fetchCoops]);

  // ── Créer un poulailler
  const createCoop = async (coopData) => {
    try {
      const res = await coopService.create(coopData);
      const created = res.data ?? res;
      setCoops((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur création' };
    }
  };

  // ── Modifier un poulailler
  const updateCoop = async (id, coopData) => {
    try {
      const res = await coopService.update(id, coopData);
      const updated = res.data ?? res;
      setCoops((prev) => prev.map((c) => (c._id === id || c.id === id) ? updated : c));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur modification' };
    }
  };

  // ── Supprimer un poulailler
  const deleteCoop = async (id) => {
    try {
      await coopService.remove(id);
      setCoops((prev) => prev.filter((c) => c._id !== id && c.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur suppression' };
    }
  };

  return {
    coops, loading, error,
    fetchCoops,
    createCoop,
    updateCoop,
    deleteCoop,
  };
};

export default useCoops;