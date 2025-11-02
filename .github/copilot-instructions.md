# Bytsea Statement Parser - AI Coding Guidelines

## Architecture Overview

This is a **dual-parsing financial document processor** with separated frontend/backend deployment:

- **Frontend**: React + TypeScript client-side application (GitHub Pages)
- **Backend**: Python OCR services (Vercel serverless functions)
- **Primary Parsing**: Google Gemini AI (client-side API calls)
- **Fallback Parsing**: Tesseract OCR + custom Python parsers

## Core Data Flow

```
File Upload → Parsing Method Selection → AI/OCR Processing → Transaction Extraction → CSV/Excel Export
```

## Key Architectural Patterns

### Dual Parsing System
- **Gemini AI** (Primary): Client-side processing with user-provided API keys
- **OCR Backend** (Fallback): Python serverless functions with Tesseract OCR
- Always check backend availability before offering OCR option
- Use `services/geminiService.ts` and `services/ocrService.ts` for parsing calls

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
- **Frontend**: GitHub Actions deploys to GitHub Pages on `main` branch pushes
- **Backend**: Manual Vercel deployment for Python OCR services
- Separated deployment for cost efficiency and scalability

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
- Client-side processing only - no server file storage
- Use `mammoth.js` for DOCX parsing (loaded via CDN)
- Gemini Vision API for image analysis

### Export Formats
- **CSV**: Simple transaction table
- **Excel**: Multi-sheet with metadata + transactions
- Filename pattern: `{ClientName}-{BankName}-{Period}.{extension}`
- Use `xlsx.js` library for Excel generation

## Component Architecture

### State Management
- React hooks for local component state
- Context providers for shared state (`DocumentTypeContext`)
- Local storage for persistent user preferences (API keys)

### Service Layer Pattern
```
services/
├── geminiService.ts      # Google Gemini AI integration
├── ocrService.ts         # Tesseract OCR processing
├── llmService.ts         # LLM provider abstraction
└── ocrParser.ts          # OCR text parsing logic
```

### Component Organization
- Feature-based components in `/components/`
- Shared UI components (Spinner, modals)
- Service separation for external API calls

## Build & Deployment

### Frontend Build (Vite)
- `npm run build` → `dist/` directory
- Asset injection via `inject-assets.js`
- GitHub Pages deployment with custom domain support

### Backend Build (Vercel)
- Python serverless functions in `/api/` (when deployed)
- Tesseract OCR dependency management
- Rate limiting and caching implemented
- CORS enabled for frontend communication

### CI/CD (GitHub Actions)
- Automated frontend deployment on `main` branch pushes
- Security audit and type checking before deployment
- Build security verification (no secrets in output)

## Testing Strategy

### Frontend Testing
- Component integration tests
- Service layer mocking for API calls
- E2E testing for complete parsing workflows

### Backend Testing
- Python unit tests in OCR parser logic
- OCR accuracy validation
- API endpoint testing with sample documents

## Security Considerations

- **No server-side data storage** - all processing client-side
- **User-provided API keys** - never transmitted to project servers
- **CORS restrictions** - backend only accepts frontend origin
- **Input validation** - file type and size restrictions
- **Rate limiting** - implemented on backend endpoints

## Common Pitfalls

1. **API Key Storage**: Never commit API keys or store server-side
2. **File Processing**: Always validate file types before processing
3. **Error Handling**: Provide fallbacks when primary parsing fails
4. **Date Formats**: Enforce YYYY-MM-DD for consistency
5. **Amount Signs**: Double-check debit/credit sign conventions
6. **Deployment Separation**: Frontend and backend deploy independently

## Key Files to Reference

- `constants.ts` - AI prompts and configuration
- `types.ts` - TypeScript interfaces
- `services/geminiService.ts` - Primary AI parsing logic
- `services/ocrService.ts` - OCR processing pipeline
- `App.tsx` - Main application component
- `vite.config.ts` - Build configuration
- `.github/workflows/deploy-combined.yml` - CI/CD pipeline