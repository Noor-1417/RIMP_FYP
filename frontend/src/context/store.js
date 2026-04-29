import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  
  setInitialized: (val) => set({ isInitialized: val }),

  setUser: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: !!token,
    }),

  logout: () => {
    sessionStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  loadFromStorage: () => {
    const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        set({
          user: JSON.parse(storedUser),
          token: storedToken,
          isAuthenticated: true,
        });
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    set({ isInitialized: true });
  },
}));

export const useThemeStore = create((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
