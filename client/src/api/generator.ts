import api from './axios';
import { GenerationResult, QuotaData, Generation } from '../types';

export const generateGuest = (topic: string, gradeLevel: string) =>
  api.post<{ success: boolean } & GenerationResult>('/generate', { topic, gradeLevel });

export const generateAuth = (topic: string, gradeLevel: string) =>
  api.post<{ success: boolean } & GenerationResult>('/generate/auth', { topic, gradeLevel });

export const getHistory = () =>
  api.get<{ success: boolean; generations: Generation[] }>('/generate/history');

export const getQuota = () =>
  api.get<{ success: boolean } & QuotaData>('/generate/quota');

export const getGuestQuota = () =>
  api.get<{ success: boolean } & QuotaData>('/generate/guest-quota');
