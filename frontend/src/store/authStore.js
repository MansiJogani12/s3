import { create } from 'zustand';
import API from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('teamsync_user') || 'null'),
  token: localStorage.getItem('teamsync_token') || null,
  isAuthenticated: !!localStorage.getItem('teamsync_token'),
  isLoading: false,
  error: null,

  login: async (loginId, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await API.post('/auth/login', { loginId, password });
      const { token, user } = response.data;

      localStorage.setItem('teamsync_token', token);
      localStorage.setItem('teamsync_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  fetchMe: async () => {
    if (!localStorage.getItem('teamsync_token')) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await API.get('/auth/me');
      const { user } = response.data;

      localStorage.setItem('teamsync_user', JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      localStorage.removeItem('teamsync_token');
      localStorage.removeItem('teamsync_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      // Ignore logout request errors, proceed to clear local state
    } finally {
      localStorage.removeItem('teamsync_token');
      localStorage.removeItem('teamsync_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
