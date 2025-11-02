// Constants for backend service
// Production: Use environment variable or default to your dedicated backend Vercel deployment
// Development: Use local development server
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_OCR_API_URL || 'http://bytseabankparser.vercel.app/' // Updated Vercel backend deployment URL
  : 'http://localhost:8000'; // Changed to 8000 (Python Flask typical port)

// Avoid noisy logs in production; use logger for dev visibility
import logger from './logger';
logger.info('OCR API URL:', OCR_API_BASE_URL);

// Health check function to verify backend connectivity
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OCR_API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
