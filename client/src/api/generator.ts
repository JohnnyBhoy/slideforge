import api from './axios';
import { GenerationResult, QuotaData, Generation } from '../types';

/**
 * Generate endpoints now stream the PPTX binary directly.
 * We receive a Blob, trigger a browser download, and read metadata from response headers.
 */
async function generateAndDownload(
  endpoint: string,
  topic: string,
  gradeLevel: string
): Promise<GenerationResult> {
  const response = await api.post(endpoint, { topic, gradeLevel }, { responseType: 'blob' });

  const fileName = response.headers['x-file-name'] || `${topic}-presentation.pptx`;
  const slidesGenerated = parseInt(response.headers['x-slides-generated'] || '0', 10);
  const rawRemaining = response.headers['x-remaining-tries'];
  const remainingTries = rawRemaining === '-1' ? null : parseInt(rawRemaining || '0', 10);

  // Trigger browser download
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return { fileUrl: url, fileName, slidesGenerated, remainingTries };
}

export const generateGuest = (topic: string, gradeLevel: string) =>
  generateAndDownload('/generate', topic, gradeLevel);

export const generateAuth = (topic: string, gradeLevel: string) =>
  generateAndDownload('/generate/auth', topic, gradeLevel);

export const getHistory = () =>
  api.get<{ success: boolean; generations: Generation[] }>('/generate/history');

export const getQuota = () =>
  api.get<{ success: boolean } & QuotaData>('/generate/quota');

export const getGuestQuota = () =>
  api.get<{ success: boolean } & QuotaData>('/generate/guest-quota');
