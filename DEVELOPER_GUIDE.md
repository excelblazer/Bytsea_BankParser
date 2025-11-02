# Bytsea Statement Parser - Developer Guide

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Custom Hooks](#custom-hooks)
- [Services](#services)
- [Components](#components)
- [Utilities](#utilities)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Project Overview

Bytsea Statement Parser is a dual-parsing financial document processor with separated frontend/backend deployment. It allows users to extract transaction data from bank statements, credit card statements, and accounting ledgers using either AI (Google Gemini, OpenAI, Anthropic) or OCR technology.

### Key Features

- **AI-Powered Extraction**: Support for multiple AI providers (Gemini, OpenAI, Claude)
- **Client-Side OCR**: Tesseract.js integration for browser-based OCR
- **Multiple File Formats**: PDF, DOCX, TXT, images (JPEG, PNG, WEBP)
- **Smart Export**: CSV and Excel export with metadata
- **User Privacy**: All API keys stored client-side only

## Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4
- **AI Integration**: Google Gemini, OpenAI, Anthropic
- **OCR**: Tesseract.js
- **Document Processing**: PDF.js, Mammoth.js (DOCX)
- **Export**: SheetJS (xlsx)

### Data Flow

```
User uploads file → File validation → Parsing method selection →
AI/OCR processing → Transaction extraction → Display results →
Export to CSV/Excel
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/excelblazer/Bytsea_BankParser.git

# Navigate to project directory
cd Bytsea_BankParser

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
Bytsea_BankParser/
├── components/          # React components
│   ├── ErrorBoundary.tsx
│   ├── FileUpload.tsx
│   ├── TransactionDisplay.tsx
│   ├── ParsingOptions.tsx
│   └── ...
├── config/             # Configuration files
│   ├── app.config.ts   # App-level configuration
│   └── llm.config.ts   # LLM provider configuration
├── hooks/              # Custom React hooks
│   ├── useFileUpload.ts
│   ├── useApiKey.ts
│   ├── useDocumentParser.ts
│   └── usePrivacyPolicy.ts
├── services/           # Business logic services
│   ├── geminiService.ts
│   ├── llmService.ts
│   ├── ocrService.ts
│   ├── ocrParser.ts
│   └── logger.ts
├── utils/              # Utility functions
│   ├── fileUtils.ts
│   ├── stringUtils.ts
│   ├── storageUtils.ts
│   └── exportUtils.ts
├── types.ts            # TypeScript type definitions
├── constants.ts        # Legacy constants (being migrated)
└── App.tsx             # Main application component
```

## Configuration

### App Configuration (`config/app.config.ts`)

Centralized configuration for:
- Application metadata
- File type validation
- Error messages
- Storage keys
- Export settings

```typescript
import { APP_CONFIG, FILE_TYPES, ERROR_MESSAGES } from './config/app.config';
```

### LLM Configuration (`config/llm.config.ts`)

Provider-specific settings:
- Provider metadata (name, icon, color)
- Model configurations
- API key validation patterns
- Parsing prompts for different document types

```typescript
import { LLM_PROVIDERS, getProviderConfig } from './config/llm.config';
```

## Custom Hooks

### useFileUpload

Manages file upload state and validation.

```typescript
import { useFileUpload } from './hooks/useFileUpload';

const {
  selectedFile,
  fileName,
  error,
  isValid,
  handleFileSelect,
  clearFile,
} = useFileUpload();
```

### useApiKey

Manages API key state and validation.

```typescript
import { useApiKey } from './hooks/useApiKey';

const {
  apiKeyStatus,
  hasApiKey,
  validateAndSaveKey,
  removeKey,
  checkApiKey,
} = useApiKey();
```

### useDocumentParser

Manages document parsing state.

```typescript
import { useDocumentParser } from './hooks/useDocumentParser';

const {
  isLoading,
  error,
  transactions,
  setParsingMethod,
  setDocumentType,
} = useDocumentParser();
```

### usePrivacyPolicy

Manages privacy policy acceptance.

```typescript
import { usePrivacyPolicy } from './hooks/usePrivacyPolicy';

const {
  showModal,
  isAccepted,
  acceptPolicy,
  declinePolicy,
} = usePrivacyPolicy();
```

## Services

### geminiService.ts

Google Gemini AI integration for document parsing.

**Key Functions:**
- `parseStatementWithGemini(fileContent, mimeType, documentType)`

### llmService.ts

Multi-provider LLM service with support for Gemini, OpenAI, and Anthropic.

**Key Functions:**
- `parseStatementWithLLM(fileContent, mimeType, documentType, config)`
- `validateApiKey(provider, apiKey)`
- `testApiKey(config)`

### ocrService.ts

Client-side OCR processing using Tesseract.js.

**Key Functions:**
- `processFileWithOCR(file, onProgress)`

### logger.ts

Centralized logging service.

```typescript
import { logger } from './services/logger';

logger.info('Processing started');
logger.error('Processing failed', error);
```

## Utilities

### File Utilities (`utils/fileUtils.ts`)

```typescript
import { validateFile, readFileAsDataURL } from './utils/fileUtils';

const validation = validateFile(file);
const base64 = await readFileAsDataURL(file);
```

### String Utilities (`utils/stringUtils.ts`)

```typescript
import { formatCurrency, cleanForFilename } from './utils/stringUtils';

const formatted = formatCurrency(100.50, 'USD');
const clean = cleanForFilename('Client Name!');
```

### Storage Utilities (`utils/storageUtils.ts`)

```typescript
import { getApiKey, setApiKey } from './utils/storageUtils';

const key = getApiKey('gemini');
setApiKey('gemini', 'AIza...');
```

### Export Utilities (`utils/exportUtils.ts`)

```typescript
import { exportToCSV, exportToExcel } from './utils/exportUtils';

exportToCSV(transactions);
exportToExcel(transactions);
```

## Testing

### Unit Tests

Test individual utility functions:

```bash
npm test
```

### Integration Tests

Test service interactions and component behavior.

### E2E Tests

Test complete user workflows.

## Deployment

### Frontend (GitHub Pages)

Automatically deployed on push to `main` branch via GitHub Actions.

```bash
# Manual build
npm run build
```

### Backend (Vercel)

Python OCR services deployed separately to Vercel.

## Contributing

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write descriptive commit messages
- Add JSDoc comments to all functions

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Coding Standards

- **Components**: Functional components with TypeScript
- **State Management**: React hooks and context
- **Error Handling**: Try-catch blocks with proper error messages
- **Logging**: Use logger service for all logging
- **Validation**: Validate all user inputs
- **Accessibility**: Include ARIA labels and keyboard navigation

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/excelblazer/Bytsea_BankParser/issues
- Email: support@bytsea.com

## Acknowledgments

- Google Gemini API
- OpenAI API
- Anthropic Claude API
- Tesseract.js
- React and Vite communities
