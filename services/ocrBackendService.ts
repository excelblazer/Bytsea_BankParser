import { OCR_API_BASE_URL } from './config';

// Service to send file to backend OCR API
export async function parseWithOcrBackend(file: File, parserType: 'statement' | 'creditcard' | 'ledger'): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parserType', parserType);
  
  const response = await fetch(`${OCR_API_BASE_URL}/api/parse`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process file with OCR backend');
  }
  
  return response.json();
}
