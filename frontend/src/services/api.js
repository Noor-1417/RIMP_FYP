import axios from 'axios';

let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Auto-fix protocol typos (e.g., 'ttps://' -> 'https://') and remove quotes/spaces
API_URL = API_URL.trim().replace(/^['"]|['"]$/g, '');
if (API_URL.startsWith('ttps:')) {
  API_URL = 'h' + API_URL;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // DO NOT use window.location.href here as it causes blinking loops
    }
    return Promise.reject(error);
  }
);

export default api;
