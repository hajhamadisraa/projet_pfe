// src/controllers/hooks/useCoops.js
import { useCallback, useEffect, useState } from 'react';
import { coopService } from '../../models/services/coopService';

const useCoops = () => {
  const [coops,   setCoops]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchCoops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await coopService.getAll();
      const list = Array.isArray(res) ? res : (res.data ?? []);

      // ✅ Dédupliquer par _id pour éviter les duplicate key React
      const seen = new Set();
      const unique = list.filter((c) => {
        const id = c._id?.toString() || c.id?.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      setCoops(unique);
    } catch (err) {
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoops(); }, [fetchCoops]);

  const createCoop = async (coopData) => {
    try {
      const res     = await coopService.create(coopData);
      const created = res.data ?? res;
      // ✅ Eviter les doublons si fetchCoops est appelé juste après
      setCoops((prev) => {
        const id = created._id?.toString();
        if (prev.some((c) => c._id?.toString() === id)) return prev;
        return [created, ...prev];
      });
      return { success: true, data: res };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur création' };
    }
  };

  const updateCoop = async (id, coopData) => {
    try {
      const res     = await coopService.update(id, coopData);
      const updated = res.data ?? res;
      setCoops((prev) => prev.map((c) =>
        (c._id === id || c.id === id) ? updated : c
      ));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, message: err?.message || 'Erreur modification' };
    }
  };

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