// Constants for backend service
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.VITE_OCR_API_URL || 'https://bytsea-bank-parser-api.vercel.app' // Will be overridden by environment variable
  : 'http://localhost:3000'; // For local development
