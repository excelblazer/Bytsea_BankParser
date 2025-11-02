import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import logger from './logger';

// Configure PDF.js worker to use local file with fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
} catch (error) {
  console.warn('Failed to configure PDF.js worker:', error);
  // Fallback: try to use CDN if local fails
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  } catch (fallbackError) {
    console.error('PDF.js worker configuration failed completely:', fallbackError);
  }
}

export interface OCRProgressCallback {
  (progress: { status: string; progress: number }): void;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Check if PDF.js worker is properly configured
 */
function isPDFWorkerAvailable(): boolean {
  try {
    return !!(pdfjsLib.GlobalWorkerOptions.workerSrc);
  } catch (error) {
    console.warn('PDF.js worker check failed:', error);
    return false;
  }
}

/**
 * Extract text from PDF files using PDF.js
 */
async function extractTextFromPDF(file: File, onProgress?: OCRProgressCallback): Promise<string> {
  if (!isPDFWorkerAvailable()) {
    throw new Error('PDF.js worker is not properly configured. Please refresh the page and try again.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress({
          status: `Processing page ${pageNum} of ${totalPages}`,
          progress: (pageNum - 1) / totalPages
        });
      }

      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    if (onProgress) {
      onProgress({ status: 'PDF text extraction complete', progress: 1 });
    }

    return fullText;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}. This might be due to PDF complexity or format issues.`);
  }
}

/**
 * Perform OCR on image files using Tesseract.js
 */
async function performOCR(file: File, onProgress?: OCRProgressCallback): Promise<OCRResult> {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (onProgress && m.status) {
        onProgress({
          status: m.status,
          progress: m.progress || 0
        });
      }
    }
  });

  try {
    const { data: { text, confidence } } = await worker.recognize(file);
    return { text, confidence };
  } finally {
    await worker.terminate();
  }
}

/**
 * Convert PDF pages to images for OCR processing
 */
async function convertPDFToImages(file: File, onProgress?: OCRProgressCallback): Promise<File[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: File[] = [];
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({
        status: `Converting page ${pageNum} to image`,
        progress: (pageNum - 1) / totalPages
      });
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      canvas: canvas,
      viewport: viewport
    }).promise;

    canvas.toBlob((blob) => {
      if (blob) {
        const imageFile = new File([blob], `page-${pageNum}.png`, { type: 'image/png' });
        images.push(imageFile);
      }
    }, 'image/png');
  }

  if (onProgress) {
    onProgress({ status: 'PDF conversion complete', progress: 1 });
  }

  return images;
}

/**
 * Main OCR processing function that handles different file types
 */
export async function processFileWithOCR(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<{ text: string; confidence?: number }> {
  const fileType = file.type;

  logger.info('Starting OCR processing for file:', file.name, 'Size:', file.size, 'bytes');

  try {
    if (onProgress) {
      onProgress({ status: 'Starting OCR processing', progress: 0 });
    }

    let extractedText = '';

    // Handle PDF files
    if (fileType === 'application/pdf') {
      try {
  logger.info('Processing PDF file...');
        extractedText = await extractTextFromPDF(file, onProgress);
  logger.info('PDF text extraction complete. Length:', extractedText.length);
  logger.info('First 1000 characters:', extractedText.substring(0, 1000));

        // If PDF has little text content, fall back to OCR on images
        if (extractedText.trim().length < 100) {
          if (onProgress) {
            onProgress({ status: 'PDF has limited text, converting to images for OCR', progress: 0.5 });
          }

          const imageFiles = await convertPDFToImages(file, onProgress);
          let combinedText = '';
          let totalConfidence = 0;

          for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            if (onProgress) {
              onProgress({
                status: `OCR processing page ${i + 1} of ${imageFiles.length}`,
                progress: 0.5 + (i / imageFiles.length) * 0.5
              });
            }

            const ocrResult = await performOCR(imageFile, (progress) => {
              if (onProgress) {
                const baseProgress = 0.5 + (i / imageFiles.length) * 0.5;
                onProgress({
                  status: progress.status,
                  progress: baseProgress + (progress.progress * 0.5 / imageFiles.length)
                });
              }
            });

            combinedText += ocrResult.text + '\n';
            totalConfidence += ocrResult.confidence;
          }

          return {
            text: combinedText,
            confidence: totalConfidence / imageFiles.length
          };
        } else {
          return { text: extractedText };
        }
      } catch (pdfError) {
        console.warn('PDF text extraction failed, falling back to OCR:', pdfError);

        // Fallback: convert PDF to images and use OCR
        if (onProgress) {
          onProgress({ status: 'PDF processing failed, converting to images for OCR', progress: 0.3 });
        }

        const imageFiles = await convertPDFToImages(file, onProgress);
        let combinedText = '';
        let totalConfidence = 0;

        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          if (onProgress) {
            onProgress({
              status: `OCR processing page ${i + 1} of ${imageFiles.length}`,
              progress: 0.3 + (i / imageFiles.length) * 0.7
            });
          }

          const ocrResult = await performOCR(imageFile);
          combinedText += ocrResult.text + '\n';
          totalConfidence += ocrResult.confidence;
        }

        return {
          text: combinedText,
          confidence: totalConfidence / imageFiles.length
        };
      }
    }

    // Handle image files
    else if (fileType.startsWith('image/')) {
  logger.info('Processing image file...');
      const ocrResult = await performOCR(file, onProgress);
  logger.info('Image OCR complete. Length:', ocrResult.text.length);
      return ocrResult;
    }

    // Handle text-based files (DOCX, TXT)
    else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX, we rely on the existing mammoth.js processing in the main app
      throw new Error('DOCX files should be processed by the main application logic');
    }

    else if (fileType === 'text/plain') {
      // For TXT files, just read the text directly
      const text = await file.text();
      return { text };
    }

    else {
      throw new Error(`Unsupported file type for OCR: ${fileType}`);
    }

  } catch (error) {
    console.error('OCR processing error:', error);

    // Provide more specific error messages
    let errorMessage = 'OCR processing failed';

    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        errorMessage = 'PDF processing failed: Worker configuration issue. Please refresh the page and try again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error during OCR processing. Please check your internet connection and try again.';
      } else if (error.message.includes('PDF')) {
        errorMessage = 'PDF processing failed. The PDF might be corrupted or password-protected. Try converting it to an image first.';
      } else if (error.message.includes('Tesseract')) {
        errorMessage = 'OCR text recognition failed. The image quality might be too low or the text might be unclear.';
      } else {
        errorMessage = `OCR processing failed: ${error.message}`;
      }
    }

    throw new Error(errorMessage);
  }
}

/**
 * Check if OCR is supported for a given file type
 */
export function isOCRSupported(fileType: string): boolean {
  return [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp'
  ].includes(fileType);
}