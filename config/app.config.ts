/**
 * Application Configuration
 * Centralized configuration for the Bytsea Statement Parser application
 */

/**
 * Application metadata and branding
 */
export const APP_CONFIG = {
  title: 'Bytsea Statement Parser',
  description: 'Parse financial documents with AI or OCR',
  version: '1.0.0',
  author: 'Bytsea',
  homepage: 'https://excelblazer.github.io/Bytsea_BankParser/',
} as const;

/**
 * Supported file types for upload
 */
export const FILE_TYPES = {
  'application/pdf': { extension: '.pdf', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: '.docx',
    label: 'Word Document',
  },
  'text/plain': { extension: '.txt', label: 'Text File' },
  'image/jpeg': { extension: '.jpg,.jpeg', label: 'JPEG Image' },
  'image/png': { extension: '.png', label: 'PNG Image' },
  'image/webp': { extension: '.webp', label: 'WebP Image' },
} as const;

/**
 * Get accepted file types as a comma-separated string for input element
 */
export const getAcceptedFileTypesString = (): string => {
  return Object.keys(FILE_TYPES).join(',');
};

/**
 * Get user-friendly file types string for display
 */
export const getFileTypesLabel = (): string => {
  return Object.values(FILE_TYPES)
    .map((type) => type.label)
    .join(', ');
};

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file type
 */
export const isValidFileType = (mimeType: string): boolean => {
  return mimeType in FILE_TYPES;
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number): boolean => {
  return size > 0 && size <= MAX_FILE_SIZE;
};

/**
 * Document types supported by the parser
 */
export const DOCUMENT_TYPES = {
  bank: { id: 'bank', label: 'Bank Statement' },
  creditcard: { id: 'creditcard', label: 'Credit Card Statement' },
  ledger: { id: 'ledger', label: 'Accounting Ledger' },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  GEMINI_API_KEY: 'gemini_api_key',
  OPENAI_API_KEY: 'openai_api_key',
  ANTHROPIC_API_KEY: 'anthropic_api_key',
  GEMINI_MODEL: 'gemini_model',
  OPENAI_MODEL: 'openai_model',
  ANTHROPIC_MODEL: 'anthropic_model',
  PRIVACY_POLICY_ACCEPTED: 'privacy_policy_accepted',
  STATEMENT_PERIOD: 'statement_period',
  STATEMENT_CURRENCY: 'statement_currency',
} as const;

/**
 * Export file naming pattern
 */
export const EXPORT_CONFIG = {
  fileNamePattern: '{clientName}-{bankName}-{period}-{currency}',
  dateFormat: 'YYYY-MM-DD',
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  animation: {
    duration: 300, // milliseconds
    easing: 'ease-in-out',
  },
  progressBar: {
    updateInterval: 100, // milliseconds
  },
  toast: {
    duration: 5000, // milliseconds
    position: 'top-right' as const,
  },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NO_FILE_SELECTED: 'Please select a file first.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP files.',
  FILE_TOO_LARGE: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
  NO_PARSING_METHOD: 'Please select a parsing method (AI API or OCR).',
  API_KEY_REQUIRED: 'Cannot process file: You need to provide your API key first.',
  API_KEY_NOT_FOUND: 'API key not found. Please enter your API key in the settings.',
  PROCESSING_FAILED: 'An unexpected error occurred during processing.',
  NO_TRANSACTIONS_FOUND: 'No transactions found in the document.',
  INVALID_RESPONSE: 'Invalid response format from the parser.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully.',
  PROCESSING_COMPLETE: 'Document processed successfully.',
  API_KEY_SAVED: 'API key saved successfully.',
  EXPORT_SUCCESS: 'File exported successfully.',
} as const;
