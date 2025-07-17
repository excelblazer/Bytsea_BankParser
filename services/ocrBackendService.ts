import { OCR_API_BASE_URL, checkBackendHealth } from './config';

// Service to check backend connectivity
export async function isBackendAvailable(): Promise<boolean> {
  return await checkBackendHealth();
}

// Service to send file to backend OCR API
export async function parseWithOcrBackend(file: File, parserType: 'statement' | 'creditcard' | 'ledger'): Promise<any> {
  // First check if backend is available
  const isAvailable = await isBackendAvailable();
  if (!isAvailable) {
    throw new Error('OCR Backend service is currently unavailable. Please try again later or use the AI API method.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('parserType', parserType);
  
  try {
    const response = await fetch(`${OCR_API_BASE_URL}/api/parse`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it for FormData
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Backend returned ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('OCR Backend Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process file with OCR backend');
  }
}
