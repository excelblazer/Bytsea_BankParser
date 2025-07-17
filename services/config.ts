// Constants for backend service
// Production: Use environment variable or default to your dedicated backend Vercel deployment
// Development: Use local development server
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_OCR_API_URL || 'https://bytseabankparser-c52nl88o2-bytseaparser-projects-c57bbfbe.vercel.app' // Your Vercel backend deployment URL
  : 'http://localhost:8000'; // Changed to 8000 (Python Flask typical port)

// Log the API URL to help with debugging
console.log('OCR API URL:', OCR_API_BASE_URL);

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
