import axios from 'axios';
import { getOrCreateGuestId } from '../utils/fingerprint';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Guest-ID'] = getOrCreateGuestId();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cg_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
