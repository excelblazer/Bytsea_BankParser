export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const APP_TITLE = "Bytsea Statement Parser";

// Bank Statement prompt
export const BANK_STATEMENT_INSTRUCTION = `You are an expert financial data extraction AI. Your task is to parse bank statements from the provided text content.
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
}`;

// Credit Card Statement prompt
export const CREDIT_CARD_STATEMENT_INSTRUCTION = `You are an expert financial data extraction AI. Your task is to parse credit card statements from the provided text content.
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
}`;

// Ledger prompt
export const LEDGER_STATEMENT_INSTRUCTION = `You are an expert financial data extraction AI. Your task is to parse accounting ledgers from the provided text content.
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
}`;

// Select instruction based on document type
export const GEMINI_SYSTEM_INSTRUCTION_TEXT_INPUT = BANK_STATEMENT_INSTRUCTION;

// Generic prompt for file input that will be customized based on document type
export const GEMINI_PROMPT_FOR_FILE = `Please parse the provided financial document.
Follow the detailed instructions regarding data extraction and JSON output format previously provided.`;

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
