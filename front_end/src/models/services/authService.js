// src/models/services/authService.js
import { API } from '../utils/constants';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? `Erreur ${response.status}`);
    }

    const data = await response.json();
    return { user: data.user, token: data.token };
  },

  async logout(token) {
    try {
      await fetch(`${API.BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Silencieux — déconnexion locale quoi qu'il arrive
    }
  },

  async refreshToken(token) {
    const response = await fetch(`${API.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Session expirée, veuillez vous reconnecter.');
    return response.json();
  },
};