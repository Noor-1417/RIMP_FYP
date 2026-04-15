import { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { authService } from '../services';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, logout, setUser, setLoading, setError } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Prefer sessionStorage so data clears on tab close; fall back to localStorage
        const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser), storedToken);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [setUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      const { user, token, redirectTo } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      // Persist auth in sessionStorage (cleared on browser/tab close)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      // keep localStorage for backward compatibility (optional)
      try { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}

      setUser(user, token);
      return { success: true, user, redirectTo };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      setError(message);
      console.error('Login error details:', error);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      const { user, token, redirectTo } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      // Persist auth in sessionStorage (cleared on browser/tab close)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      // keep localStorage for backward compatibility (optional)
      try { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}

      setUser(user, token);
      return { success: true, user, redirectTo };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      setError(message);
      console.error('Register error details:', error);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    // Clear both sessionStorage and localStorage to be safe
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
    logout();
  };

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    register,
    logout: logoutUser,
  };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};
