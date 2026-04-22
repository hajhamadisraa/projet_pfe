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

  async login(email, password) {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    return { user: data.user, token: data.token };
  },

  async register(name, email, password) {
    const res = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(res);
    return { user: data.user, token: data.token };
  },

  async getProfile(token) {
    const res = await fetch(`${BASE}/me`, {
      method: 'GET',
      headers: headers(token),
    });
    const data = await handleResponse(res);
    return data.user;
  },

  async updateProfile(token, fields) {
    const res = await fetch(`${BASE}/updateprofile`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(fields),
    });
    return handleResponse(res);
  },

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