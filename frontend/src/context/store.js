import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: !!token,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  loadFromStorage: () => {
    // Prefer sessionStorage (cleared when tab/browser is closed), fall back to localStorage
    const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (storedToken && storedUser) {
      set({
        user: JSON.parse(storedUser),
        token: storedToken,
        isAuthenticated: true,
      });
    }
  },
}));

export const useThemeStore = create((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
