import api from './axios';

export const getStats = () => api.get('/admin/stats');
export const getDailyStats = () => api.get('/admin/daily-stats');
export const getPaymentStats = () => api.get('/admin/payment-stats');
export const getUsers = (params?: Record<string, unknown>) => api.get('/admin/users', { params });
export const getUserById = (id: string) => api.get(`/admin/users/${id}`);
export const updateUserStatus = (id: string, isActive: boolean) =>
  api.put(`/admin/users/${id}/status`, { isActive });
export const subscribeUser = (id: string, isSubscribed: boolean, months: number) =>
  api.put(`/admin/users/${id}/subscribe`, { isSubscribed, months });
export const resetQuota = (id: string) => api.put(`/admin/users/${id}/reset-quota`);
export const getUserGenerations = (id: string) => api.get(`/admin/users/${id}/generations`);
export const getAllGenerations = (params?: Record<string, unknown>) =>
  api.get('/admin/generations', { params });
export const getPayments = (status?: string) =>
  api.get('/admin/payments', { params: status ? { status } : {} });
export const activatePayment = (id: string, months: number) =>
  api.put(`/admin/payments/${id}/activate`, { months });
