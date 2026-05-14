// src/models/services/authService.js
import { API } from '../utils/constants';

const BASE = `${API.BASE_URL}/auth`;

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`);
  }
  return data;
};

export const authService = {

  // ─────────────────────────────────────────
  // 🔑 LOGIN
  // ─────────────────────────────────────────
  async login(email, password) {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);

    // Si le compte est en attente, le backend renvoie status: 'PENDING' sans token
    if (data.status === 'PENDING') {
      throw new Error('Votre compte est en attente de validation par un administrateur.');
    }

    // Si le compte est suspendu
    if (data.status === 'SUSPENDED' || data.user?.isActive === false) {
      throw new Error('Votre compte a été suspendu. Contactez un administrateur.');
    }

    return { user: data.user, token: data.token };
  },

  // ─────────────────────────────────────────
  // 📝 REGISTER — crée un compte PENDING
  // ─────────────────────────────────────────
  async register(name, email, password) {
    const res = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(res);

    // Le backend renvoie { user, status: 'PENDING' } sans token
    // ou { user, token, status: 'ACTIVE' } si l'admin a configuré l'approbation auto
    return {
      user:   data.user   || null,
      token:  data.token  || null,
      status: data.status || 'PENDING',
    };
  },

  // ─────────────────────────────────────────
  // 👤 PROFIL
  // ─────────────────────────────────────────
  async getProfile(token) {
    const res = await fetch(`${BASE}/me`, {
      method: 'GET',
      headers: headers(token),
    });
    const data = await handleResponse(res);
    return data.user;
  },

  // ─────────────────────────────────────────
  // ✏️ MISE À JOUR PROFIL
  // PUT /auth/updateprofile — champs: { name, email }
  // ─────────────────────────────────────────
  async updateProfile(token, fields) {
    const res = await fetch(`${BASE}/updateprofile`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(fields),
    });
    return handleResponse(res);
  },

  // ─────────────────────────────────────────
  // 🔐 MISE À JOUR MOT DE PASSE
  // PUT /auth/updatepassword — champs: { currentPassword, newPassword }
  // ─────────────────────────────────────────
  async updatePassword(token, currentPassword, newPassword) {
    const res = await fetch(`${BASE}/updatepassword`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  // ─────────────────────────────────────────
  // 🚪 LOGOUT
  // ─────────────────────────────────────────
  async logout(token) {
    try {
      await fetch(`${BASE}/logout`, {
        method: 'POST',
        headers: headers(token),
      });
    } catch {
      // Silencieux — déconnexion locale quoi qu'il arrive
    }
  },
};