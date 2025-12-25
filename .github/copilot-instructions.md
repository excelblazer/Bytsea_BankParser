# Bytsea Statement Parser - AI Coding Guidelines

## Architecture Overview

This is a **100% client-side financial document processor** with dual-parsing capabilities:

- **Client**: React 19 + TypeScript SPA deployed on GitHub Pages
- **Primary Parsing**: Google Gemini AI (user-provided API keys, client-side)
- **Fallback Parsing**: Tesseract.js OCR (client-side, no backend required)
- **Multi-Provider Support**: Gemini, OpenAI, and Anthropic (configured via `config/llm.config.ts`)

## Core Data Flow

```
File Upload → Parsing Method Selection → AI/OCR Processing → Transaction Extraction → CSV/Excel Export
```

## Key Architectural Patterns

### Dual Parsing System
- **LLM Providers** (Primary): Gemini, OpenAI, Anthropic - all client-side with user API keys
- **OCR Fallback**: Tesseract.js (client-side, no backend) - uses `pdfjs-dist` for PDFs
- Provider abstraction in `services/llmService.ts` enables multi-provider support
- Configuration in `config/llm.config.ts` defines models, API key patterns, endpoints
- Use `services/geminiService.ts` (legacy) and `services/ocrService.ts` for parsing

### API Key Management
- **Never store API keys on servers** - client-side only in localStorage
- API keys are user-provided through UI modals (`GeminiApiModal`)
- Check key validity before enabling parsing features
- Use `localStorage.getItem('gemini_api_key')` for Gemini access

### Transaction Data Structure
```typescript
interface ParsedTransaction {
  bankName: string;
  clientName: string;
  transactionDate: string; // YYYY-MM-DD format
  description: string;
  referenceNumber: string;
  amount: number; // Negative for debits, positive for credits
}
```

### Amount Conventions
- **Debits**: Negative numbers (e.g., `-50.25`)
- **Credits**: Positive numbers (e.g., `100.00`)
- **Credit card charges**: Negative (same as debits)
- **Payments/credits**: Positive

## Critical Developer Workflows

### Local Development
```bash
npm install
npm run dev  # Frontend only (localhost:5173)
```

### Build Process
```bash
npm run build  # Includes asset injection via inject-assets.js
```

### Deployment Process
- **Single deployment**: GitHub Actions → GitHub Pages
- Triggers on pushes to `main` affecting source files
- Custom domain: `app.bytsea.com` (configured via `CNAME` file)
- Static assets, no backend infrastructure required

### Testing Parsing Logic
- Use `services/geminiService.ts` for AI parsing tests
- Backend OCR testing requires Vercel deployment
- Test files in `services/ocrParser.ts` for Python logic
- Validate JSON response formats match `types.ts` interfaces

## Project-Specific Conventions

### AI Prompt Engineering
- Use structured JSON responses with specific field names
- Include metadata extraction (bank name, client name, period, currency)
- Handle multiple document types: bank statements, credit cards, ledgers
- See `constants.ts` for exact prompt templates

### Error Handling Patterns
- Graceful fallback from Gemini to OCR when API unavailable
- User-friendly error messages for API failures
- Backend availability checks before offering OCR option
- CORS headers configured in Vercel for API endpoints

### File Processing
- Support: PDF, DOCX, TXT, images (JPEG, PNG, WEBP)
- **100% client-side** - no server uploads or storage
- PDF: `pdfjs-dist` for text extraction, Tesseract.js OCR fallback
- DOCX: `mammoth.js` (loaded via CDN)
- Images: LLM Vision APIs (Gemini, GPT-4V, Claude) or Tesseract.js OCR
- Worker files: `public/pdf.worker.mjs` for PDF.js processing

### Export Formats
- **CSV**: Simple transaction table
- **Excel**: Multi-sheet with metadata + transactions
- Filename pattern: `{ClientName}-{BankName}-{Period}.{extension}`
- Use `xlsx.js` library for Excel generation

## Component Architecture

### State Management
- Custom hooks pattern: `hooks/useDocumentParser.ts`, `hooks/useFileUpload.ts`, `hooks/useApiKey.ts`
- Context providers for shared state (`DocumentTypeContext`)
- Local storage for persistent user preferences (API keys, metadata)
- Hooks export barrel pattern: `hooks/index.ts` for clean imports

### Service Layer Pattern
```
services/
├── geminiService.ts      # Google Gemini AI integration (legacy)
├── llmService.ts         # Multi-provider LLM abstraction layer
├── ocrService.ts         # Tesseract.js OCR + PDF.js integration
├── ocrParser.ts          # OCR text parsing logic
├── templateParser.ts     # Template-based parsing utilities
├── logger.ts             # Logging utility
└── parsers/
    └── standardCharteredParser.ts  # Bank-specific parsers
```

### Import Patterns
- Barrel exports: `utils/index.ts`, `hooks/index.ts`, `config/index.ts`
- Path aliases (via Vite): `@components/`, `@services/`, `@utils/`, `@hooks/`, `@config/`
- CDN dependencies: `mammoth.js`, `xlsx.js` loaded via `<script>` tags in `index.html`

### Component Organization
- Feature-based components in `/components/`
- Shared UI components (Spinner, modals)
- Service separation for external API calls

## Build & Deployment

### Frontend Build (Vite)
- `npm run build` → runs `vite build && node inject-assets.js`
- Asset injection script post-processes `dist/index.html` to add hashed assets
- Path aliases configured in `vite.config.ts`: `@/`, `@components/`, `@services/`, etc.
- Code splitting: vendor chunks (Gemini SDK), optimized for caching
- GitHub Pages deployment with custom domain (`app.bytsea.com` via CNAME)

### CI/CD (GitHub Actions)
- Workflow: `.github/workflows/deploy-combined.yml`
- Pre-deployment: security audit (`npm audit`) and type checking
- Automated GitHub Pages deployment on `main` branch pushes
- Build security verification (no secrets in output)

## Testing Strategy

### Test Framework (Vitest)
- Config: `vitest.config.ts` with jsdom environment
- Run tests: `npm test` (watch mode) or `npm run test:coverage`
- Test files in `tests/` directory: `fileUtils.test.ts`, `useFileUpload.test.ts`, etc.
- Setup file: `tests/setup.ts` for global test configuration
- UI mode: `npm run test:ui` for interactive test viewer

## Security Considerations

- **Zero server-side processing** - all operations in browser
- **User-provided API keys** - stored in localStorage only, never transmitted to project servers
- **Direct API calls** - browser connects to Gemini/OpenAI/Anthropic APIs directly
- **Input validation** - file type and size restrictions before processing
- **No data persistence** - files and results only exist in memory during session

## Common Pitfalls

1. **API Key Storage**: Never commit API keys - they're user-provided via UI only
2. **File Processing**: Always validate file types before processing
3. **CDN Dependencies**: `mammoth.js`, `xlsx.js` loaded via CDN - check global objects exist
4. **PDF.js Worker**: Must configure `workerSrc` in `ocrService.ts` - uses local `pdf.worker.mjs`
5. **Date Formats**: Enforce YYYY-MM-DD in AI prompts and validation
6. **Amount Signs**: Debits negative, credits positive (see `constants.ts` prompts)
7. **Path Aliases**: Use `@` imports configured in `vite.config.ts`, not relative paths
8. **LocalStorage Metadata**: `statement_period`, `statement_currency` stored for export filenames

## Key Files to Reference

- `constants.ts` - AI prompts (bank, credit card, ledger) and app config
- `types.ts` - Core TypeScript interfaces (`ParsedTransaction`, `ParsedStatement`)
- `config/llm.config.ts` - Multi-provider LLM configuration (Gemini, OpenAI, Anthropic)
- `services/llmService.ts` - Provider abstraction layer
- `services/ocrService.ts` - Client-side OCR with Tesseract.js + PDF.js
- `hooks/useDocumentParser.ts` - Main parsing state management hook
- `utils/exportUtils.ts` - CSV/Excel export with metadata
- `App.tsx` - Main application component
- `vite.config.ts` - Build config with path aliases and code splitting
- `inject-assets.js` - Post-build script for asset injection
- `.github/workflows/deploy-combined.yml` - CI/CD pipeline