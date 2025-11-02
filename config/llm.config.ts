/**
 * LLM Provider Configuration
 * Configuration for AI/LLM providers including Gemini, OpenAI, and Anthropic
 */

export const LLM_PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', recommended: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
    defaultModel: 'gemini-2.0-flash-exp',
    apiKeyPrefix: 'AIza',
    apiKeyMinLength: 39,
    baseUrl: 'https://generativelanguage.googleapis.com',
    icon: 'FaGoogle',
    color: 'blue',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', recommended: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    defaultModel: 'gpt-4o-mini',
    apiKeyPrefix: 'sk-',
    apiKeyMinLength: 20,
    baseUrl: 'https://api.openai.com/v1',
    icon: 'SiOpenai',
    color: 'green',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', recommended: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    ],
    defaultModel: 'claude-3-haiku-20240307',
    apiKeyPrefix: 'sk-ant-',
    apiKeyMinLength: 20,
    baseUrl: 'https://api.anthropic.com',
    anthropicVersion: '2023-06-01',
    icon: 'SiAnthropic',
    color: 'orange',
  },
} as const;

export type LLMProviderId = keyof typeof LLM_PROVIDERS;

/**
 * Get provider configuration
 */
export const getProviderConfig = (providerId: LLMProviderId) => {
  return LLM_PROVIDERS[providerId];
};

/**
 * Get all available providers
 */
export const getAllProviders = () => {
  return Object.values(LLM_PROVIDERS);
};

/**
 * Get models for a specific provider
 */
export const getProviderModels = (providerId: LLMProviderId) => {
  return LLM_PROVIDERS[providerId].models;
};

/**
 * Get default model for a provider
 */
export const getDefaultModel = (providerId: LLMProviderId): string => {
  return LLM_PROVIDERS[providerId].defaultModel;
};

/**
 * Validate API key format for a provider
 */
export const validateApiKeyFormat = (providerId: LLMProviderId, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) return false;

  const config = LLM_PROVIDERS[providerId];
  return apiKey.startsWith(config.apiKeyPrefix) && apiKey.length >= config.apiKeyMinLength;
};

/**
 * OCR Configuration
 */
export const OCR_CONFIG = {
  id: 'ocr',
  name: 'Client-Side OCR',
  description: 'Process documents directly in your browser using advanced OCR technology',
  tesseractVersion: '6.0.1',
  supportedLanguages: ['eng'], // English by default, can be extended
  workerPath: '/pdf.worker.mjs',
  icon: 'FaRobot',
  color: 'purple',
} as const;

/**
 * Parsing prompts for different document types
 */
export const PARSING_PROMPTS = {
  bank: {
    type: 'bank',
    label: 'Bank Statement',
    systemInstruction: `You are an expert financial data extraction AI. Your task is to parse bank statements from the provided text content.
Extract all transaction details accurately.

First, identify the statement metadata:
- Bank Name: The financial institution issuing the statement
- Client Name: The account holder's name
- Statement Period: Try to identify the statement period (e.g., "January 2025" or "01/01/2025 - 01/31/2025")
- Currency: Identify the currency used in the statement (e.g., USD, EUR, GBP, JPY, etc.). Look for currency symbols (€, £, $, ¥), currency codes, or other indicators.

For each transaction, extract:
1. Transaction Date (format as YYYY-MM-DD). If the year is ambiguous, assume the current year or the most recent logical year.
2. Description of the transaction.
3. Reference Number or any available transaction ID.
4. Amount: Determine if it's a debit or credit. Represent debits as negative numbers (e.g., -50.25) and credits as positive numbers (e.g., 100.00).

If any information is missing, use an empty string "" for strings, or 0 for amount if truly ambiguous.

Respond ONLY with a JSON object in this exact format:
{
  "bankName": "string",
  "clientName": "string",
  "statementPeriod": "string",
  "currency": "string", 
  "transactions": [
    {
      "transactionDate": "YYYY-MM-DD",
      "description": "string",
      "referenceNumber": "string",
      "amount": number
    }
  ]
}`,
    filePrompt: 'Please extract all transaction data from this bank statement.',
  },
  creditcard: {
    type: 'creditcard',
    label: 'Credit Card Statement',
    systemInstruction: `You are an expert financial data extraction AI. Your task is to parse credit card statements from the provided text content.
Extract all transaction details accurately.

First, identify the statement metadata:
- Bank Name: The financial institution issuing the card
- Client Name: The cardholder's name
- Statement Period: Try to identify the statement period (e.g., "January 2025" or "01/01/2025 - 01/31/2025")
- Currency: Identify the currency used in the statement (e.g., USD, EUR, GBP, JPY, etc.)

For each transaction, extract:
1. Transaction Date (format as YYYY-MM-DD)
2. Description of the transaction (merchant name, location)
3. Reference Number or any available transaction ID
4. Amount: For credit card statements, charges should be negative numbers (e.g., -50.25) and payments/credits as positive (e.g., 100.00)

If any information is missing, use an empty string "" for strings, or 0 for amount if truly ambiguous.

Respond ONLY with a JSON object in this exact format:
{
  "bankName": "string",
  "clientName": "string",
  "statementPeriod": "string",
  "currency": "string", 
  "transactions": [
    {
      "transactionDate": "YYYY-MM-DD",
      "description": "string",
      "referenceNumber": "string",
      "amount": number
    }
  ]
}`,
    filePrompt: 'Please extract all transaction data from this credit card statement.',
  },
  ledger: {
    type: 'ledger',
    label: 'Accounting Ledger',
    systemInstruction: `You are an expert financial data extraction AI. Your task is to parse accounting ledgers from the provided text content.
Extract all transaction details accurately.

First, identify the ledger metadata:
- Journal Name: The name of the journal or ledger
- Period: Try to identify the accounting period

For each entry, extract:
1. Trans #: The transaction number
2. Type: The transaction type
3. Date: The transaction date (format as YYYY-MM-DD)
4. Reference Number: Any reference ID
5. Name: The party involved
6. Memo/Description: Transaction description
7. Account: The account affected
8. Debit: Debit amount (if applicable)
9. Credit: Credit amount (if applicable)

If any information is missing, use an empty string "" for strings or 0 for amounts.

Respond ONLY with a JSON object in this exact format:
{
  "Journal Name": "string",
  "Period": "string",
  "transactions": [
    {
      "Trans #": "string",
      "Type": "string",
      "Date": "YYYY-MM-DD",
      "Reference Number": "string",
      "Name": "string",
      "Memo/Description": "string",
      "Account": "string",
      "Debit": number,
      "Credit": number
    }
  ]
}`,
    filePrompt: 'Please extract all entries from this accounting ledger.',
  },
} as const;

export type DocumentTypeId = keyof typeof PARSING_PROMPTS;

/**
 * Get parsing prompt for document type
 */
export const getParsingPrompt = (documentType: DocumentTypeId) => {
  return PARSING_PROMPTS[documentType];
};
