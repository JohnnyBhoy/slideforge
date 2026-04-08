import api from './axios';
import { User } from '../types';

export const getMe = () => api.get<{ success: boolean; user: User }>('/auth/me');

export const adminLogin = (email: string, password: string) =>
  api.post('/auth/admin/login', { email, password });

export const logout = () => api.post('/auth/logout');

export const getGoogleAuthUrl = () =>
  `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;
