import { OCR_API_BASE_URL } from './config';

// Service to check backend OCR server availability
export async function checkOcrBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OCR_API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (e) {
    console.error('Error checking OCR backend:', e);
    return false;
  }
}
