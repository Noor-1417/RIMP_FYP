import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../context/store';
import { authService } from '../services';

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const setUser = useAuthStore(state => state.setUser);
  const setLoading = useAuthStore(state => state.setLoading);
  const setError = useAuthStore(state => state.setError);
  const logout = useAuthStore(state => state.logout);
  const loadFromStorage = useAuthStore(state => state.loadFromStorage);

  useEffect(() => {
    if (!isInitialized) {
      loadFromStorage();
    }
  }, [isInitialized, loadFromStorage]);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      const { user, token, redirectTo } = response.data;

      if (!user || !token) throw new Error('Invalid response');

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user, token);
      return { success: true, user, redirectTo };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setError]);

  const register = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      const { user, token, redirectTo } = response.data;
      if (!user || !token) throw new Error('Invalid response');

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user, token);
      return { success: true, user, redirectTo };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setError]);

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    register,
    logout,
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
