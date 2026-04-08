import api from './axios';
import { PaymentSettings } from '../types';

export const getPaymentSettings = () =>
  api.get<PaymentSettings>('/settings/payment');

export const notifyPayment = () => api.post('/notify/payment');
