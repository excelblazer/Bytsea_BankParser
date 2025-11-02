# API Documentation

## Table of Contents

- [Configuration API](#configuration-api)
- [Hooks API](#hooks-api)
- [Services API](#services-api)
- [Utilities API](#utilities-api)
- [Type Definitions](#type-definitions)

## Configuration API

### App Configuration

Located in `config/app.config.ts`

#### Constants

**`APP_CONFIG`**
```typescript
const APP_CONFIG = {
  title: string;
  description: string;
  version: string;
  author: string;
  homepage: string;
}
```

**`FILE_TYPES`**
```typescript
const FILE_TYPES = {
  'application/pdf': { extension: string; label: string };
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ... };
  'text/plain': { ... };
  'image/jpeg': { ... };
  'image/png': { ... };
  'image/webp': { ... };
}
```

**`DOCUMENT_TYPES`**
```typescript
const DOCUMENT_TYPES = {
  bank: { id: 'bank'; label: 'Bank Statement' };
  creditcard: { id: 'creditcard'; label: 'Credit Card Statement' };
  ledger: { id: 'ledger'; label: 'Accounting Ledger' };
}
```

#### Functions

**`isValidFileType(mimeType: string): boolean`**

Validates if a file type is supported.

**`isValidFileSize(size: number): boolean`**

Validates if a file size is within limits (max 10MB).

### LLM Configuration

Located in `config/llm.config.ts`

#### Constants

**`LLM_PROVIDERS`**
```typescript
const LLM_PROVIDERS = {
  gemini: { id, name, models, defaultModel, apiKeyPrefix, ... };
  openai: { ... };
  anthropic: { ... };
}
```

#### Functions

**`getProviderConfig(providerId: LLMProviderId)`**

Returns configuration for a specific provider.

**`getProviderModels(providerId: LLMProviderId)`**

Returns available models for a provider.

**`validateApiKeyFormat(providerId: LLMProviderId, apiKey: string): boolean`**

Validates API key format for a specific provider.

**`getParsingPrompt(documentType: DocumentTypeId)`**

Returns parsing prompt configuration for a document type.

## Hooks API

### useFileUpload

Custom hook for file upload management.

```typescript
const {
  selectedFile,    // File | null
  fileName,        // string | null
  error,          // string | null
  isValid,        // boolean
  handleFileSelect, // (file: File) => void
  clearFile,      // () => void
  clearError      // () => void
} = useFileUpload();
```

**Example:**
```typescript
import { useFileUpload } from './hooks';

function MyComponent() {
  const { handleFileSelect, selectedFile, error } = useFileUpload();
  
  return (
    <input 
      type="file" 
      onChange={(e) => handleFileSelect(e.target.files[0])} 
    />
  );
}
```

### useApiKey

Custom hook for API key management.

```typescript
const {
  apiKeyStatus,        // 'checking' | 'valid' | 'invalid' | 'missing'
  hasApiKey,          // boolean
  validateAndSaveKey, // (provider, key) => boolean
  removeKey,          // (provider) => void
  checkApiKey        // (provider) => void
} = useApiKey();
```

### useDocumentParser

Custom hook for document parsing state.

```typescript
const {
  isLoading,         // boolean
  error,            // string | null
  transactions,     // ParsedTransaction[]
  progress,         // { status: string; progress: number } | null
  parsingMethod,    // LLMProviderId | 'ocr' | null
  documentType,     // DocumentTypeId | null
  setParsingMethod, // (method) => void
  setDocumentType,  // (type) => void
  setTransactions,  // (transactions) => void
  setError,         // (error) => void
  setLoading,       // (loading) => void
  setProgress,      // (progress) => void
  clearResults,     // () => void
  clearError        // () => void
} = useDocumentParser();
```

### usePrivacyPolicy

Custom hook for privacy policy management.

```typescript
const {
  showModal,      // boolean
  isAccepted,     // boolean
  acceptPolicy,   // () => void
  declinePolicy   // () => void
} = usePrivacyPolicy();
```

## Services API

### LLM Service

Located in `services/llmService.ts`

**`parseStatementWithLLM(fileContent, mimeType, documentType, config)`**

Parses a document using the specified LLM provider.

Parameters:
- `fileContent: string` - Base64 encoded file content
- `mimeType: string` - MIME type of the file
- `documentType: DocumentTypeId` - Type of document
- `config: LLMConfig` - Provider configuration

Returns: `Promise<ParsedTransaction[]>`

**`validateApiKey(provider, apiKey): boolean`**

Validates API key format.

**`testApiKey(config): Promise<boolean>`**

Tests API key by making a test request.

### Gemini Service

Located in `services/geminiService.ts`

**`parseStatementWithGemini(fileContent, mimeType, documentType)`**

Parses a document using Google Gemini.

Returns: `Promise<ParsedTransaction[]>`

### OCR Service

Located in `services/ocrService.ts`

**`processFileWithOCR(file, onProgress)`**

Processes a file using Tesseract.js OCR.

Parameters:
- `file: File` - File to process
- `onProgress: (progress) => void` - Progress callback

Returns: `Promise<{ text: string }>`

### Logger Service

Located in `services/logger.ts`

**Methods:**
- `logger.debug(message, data?)`
- `logger.info(message, data?)`
- `logger.warn(message, data?)`
- `logger.error(message, error?)`
- `logger.getLogs()`
- `logger.clearLogs()`
- `logger.exportLogs()`

## Utilities API

### File Utilities

**`validateFile(file: File): ValidationResult`**

Validates file type and size.

**`formatFileSize(bytes: number): string`**

Formats file size for display.

**`readFileAsText(file: File): Promise<string>`**

Reads file as text.

**`readFileAsDataURL(file: File): Promise<string>`**

Reads file as base64 data URL.

**`isImageFile(mimeType: string): boolean`**

Checks if file is an image.

**`isPdfFile(mimeType: string): boolean`**

Checks if file is a PDF.

### String Utilities

**`cleanForFilename(str: string): string`**

Removes special characters for safe filenames.

**`formatCurrency(amount: number, currency?: string): string`**

Formats amount as currency.

**`formatDate(date: Date): string`**

Formats date as YYYY-MM-DD.

**`isValidDateFormat(dateStr: string): boolean`**

Validates date string format.

**`escapeCsvField(field: string): string`**

Escapes CSV field for export.

### Storage Utilities

**`getApiKey(provider): string | null`**

Gets API key from localStorage.

**`setApiKey(provider, apiKey): boolean`**

Saves API key to localStorage.

**`removeApiKey(provider): boolean`**

Removes API key from localStorage.

**`getStatementPeriod(): string | null`**

Gets statement period from storage.

**`setStatementPeriod(period: string): boolean`**

Saves statement period to storage.

**`clearAppStorage(): void`**

Clears all app-related storage.

### Export Utilities

**`exportToCSV(transactions: ParsedTransaction[]): void`**

Exports transactions to CSV file.

**`exportToExcel(transactions: ParsedTransaction[]): void`**

Exports transactions to Excel file with metadata sheet.

**`calculateStats(transactions): TransactionStats`**

Calculates transaction statistics.

Returns:
```typescript
{
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  averageAmount: number;
  largestDebit: number;
  largestCredit: number;
}
```

## Type Definitions

### ParsedTransaction

```typescript
interface ParsedTransaction {
  bankName: string;
  clientName: string;
  transactionDate: string; // YYYY-MM-DD
  description: string;
  referenceNumber: string;
  amount: number; // Negative for debits, positive for credits
}
```

### LLMConfig

```typescript
interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

### TransactionStats

```typescript
interface TransactionStats {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  averageAmount: number;
  largestDebit: number;
  largestCredit: number;
}
```

## Error Handling

All services and utilities throw descriptive errors that can be caught and displayed to users:

```typescript
try {
  const transactions = await parseStatementWithLLM(content, mimeType, type, config);
} catch (error) {
  if (error instanceof Error) {
    // Display error.message to user
    logger.error('Parsing failed', error);
  }
}
```

## Best Practices

1. **Always validate inputs** before processing
2. **Use logger service** instead of console.log
3. **Handle errors gracefully** with user-friendly messages
4. **Check API key availability** before making requests
5. **Clear sensitive data** when appropriate
6. **Use TypeScript types** for better code safety

## Examples

### Complete Parsing Workflow

```typescript
import { useFileUpload, useApiKey, useDocumentParser } from './hooks';
import { parseStatementWithLLM } from './services/llmService';
import { logger } from './services/logger';

function DocumentParser() {
  const { selectedFile, handleFileSelect } = useFileUpload();
  const { hasApiKey, validateAndSaveKey } = useApiKey();
  const { setLoading, setTransactions, setError } = useDocumentParser();

  const processDocument = async () => {
    if (!selectedFile || !hasApiKey) return;

    setLoading(true);
    try {
      const fileContent = await readFileAsDataURL(selectedFile);
      const transactions = await parseStatementWithLLM(
        fileContent,
        selectedFile.type,
        'bank',
        { provider: 'gemini', model: 'gemini-1.5-flash', apiKey: '...' }
      );
      setTransactions(transactions);
      logger.info('Parsing completed', { count: transactions.length });
    } catch (error) {
      setError(error.message);
      logger.error('Parsing failed', error);
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={processDocument}>Process</button>;
}
```
