# Quick Reference - Bytsea Statement Parser

## Common Tasks

### File Validation
```typescript
import { validateFile } from './utils';

const result = validateFile(file);
if (!result.isValid) {
  console.error(result.error);
}
```

### API Key Management
```typescript
import { getApiKey, setApiKey } from './utils';

// Get API key
const key = getApiKey('gemini');

// Save API key
setApiKey('gemini', 'AIza...');
```

### Export Data
```typescript
import { exportToCSV, exportToExcel } from './utils';

// Export to CSV
exportToCSV(transactions);

// Export to Excel with metadata
exportToExcel(transactions);
```

### Using Custom Hooks
```typescript
import { useFileUpload, useApiKey, useDocumentParser } from './hooks';

function MyComponent() {
  const { handleFileSelect, selectedFile } = useFileUpload();
  const { hasApiKey, validateAndSaveKey } = useApiKey();
  const { setLoading, setTransactions } = useDocumentParser();
  
  // Your component logic
}
```

### Logging
```typescript
import { logger } from './services/logger';

logger.debug('Debug message', data);
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Configuration Access
```typescript
import { APP_CONFIG, FILE_TYPES, LLM_PROVIDERS } from './config';

const appTitle = APP_CONFIG.title;
const geminiConfig = LLM_PROVIDERS.gemini;
```

## File Structure Quick Reference

```
components/     - React components
config/        - Configuration files
hooks/         - Custom React hooks
services/      - Business logic
utils/         - Utility functions
types.ts       - TypeScript types
```

## Import Patterns

### Old (scattered imports)
```typescript
import { validateFile } from './utils/fileUtils';
import { formatDate } from './utils/stringUtils';
import { getApiKey } from './utils/storageUtils';
```

### New (barrel exports)
```typescript
import { validateFile, formatDate, getApiKey } from './utils';
```

## Error Handling Pattern

```typescript
try {
  const result = await operation();
  logger.info('Success', result);
} catch (error) {
  logger.error('Failed', error);
  setError(error.message);
}
```

## Type Definitions

```typescript
// Transaction
interface ParsedTransaction {
  bankName: string;
  clientName: string;
  transactionDate: string;  // YYYY-MM-DD
  description: string;
  referenceNumber: string;
  amount: number;  // negative = debit, positive = credit
}

// LLM Config
interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}
```

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Key Constants

```typescript
MAX_FILE_SIZE = 10MB
SUPPORTED_FORMATS = PDF, DOCX, TXT, JPG, PNG, WEBP
DOCUMENT_TYPES = bank, creditcard, ledger
```

## Testing

```bash
npm test              # Run tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage
```

## Links

- [Developer Guide](./DEVELOPER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Contributing](./CONTRIBUTING.md)
- [Refactoring Summary](./REFACTORING_SUMMARY.md)
