import api from './axios';
import { PaymentSettings } from '../types';

export const getPaymentSettings = () =>
  api.get<PaymentSettings>('/settings/payment');

export const notifyPayment = (months: number, amount: number, currency: 'PHP' | 'USD') =>
  api.post('/notify/payment', { months, amount, currency });

export const createLSCheckout = (months: 1 | 3) =>
  api.post<{ success: boolean; url: string }>('/ls/create-checkout', { months });

export const verifyLSOrder = (order_id: string, months: number) =>
  api.get<{ success: boolean; paid: boolean }>(`/ls/verify?order_id=${order_id}&months=${months}`);
