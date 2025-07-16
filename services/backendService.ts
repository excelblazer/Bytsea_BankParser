// Service to check backend OCR server availability
export async function checkOcrBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/ocr/health'); // Adjust endpoint as needed
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (e) {
    return false;
  }
}
