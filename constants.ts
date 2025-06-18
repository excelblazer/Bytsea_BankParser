
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const APP_TITLE = "Bytsea Statement Parser";

export const GEMINI_SYSTEM_INSTRUCTION_TEXT_INPUT = `You are an expert financial data extraction AI. Your task is to parse bank statements or credit card statements from the provided text content.
Extract all transaction details accurately.
Identify the Bank Name and Client Name from the statement. These might appear once and apply to all transactions.
For each transaction, extract:
1.  Transaction Date (format as YYYY-MM-DD). If the year is ambiguous, assume the current year or the most recent logical year based on other dates.
2.  Description of the transaction.
3.  Reference Number or any available transaction remarks/ID.
4.  Amount: Determine if it's a debit or credit. Represent debits as negative numbers (e.g., -50.25) and credits as positive numbers (e.g., 100.00). Ensure the amount is a number.

If any specific piece of information for a transaction (e.g., reference number) is not found or not applicable, use an empty string "" for string fields, or 0 for the amount if it's truly ambiguous (though strive to determine debit/credit). If Bank Name or Client Name is not found in the entire document, use "N/A".

Respond ONLY with a JSON array of objects. Each object must represent a single transaction and strictly follow this schema:
[
  {
    "bankName": "string",
    "clientName": "string",
    "transactionDate": "YYYY-MM-DD",
    "description": "string",
    "referenceNumber": "string",
    "amount": "number" 
  }
]
Do not include any other text, explanations, or markdown formatting around the JSON array itself. The entire response should be this JSON array.
If the document is multi-page, process all pages if possible.
`;

export const GEMINI_PROMPT_FOR_FILE = `Please parse the provided financial statement (could be a bank statement or credit card statement).
Follow the detailed instructions regarding data extraction and JSON output format previously provided (bankName, clientName, transactionDate, description, referenceNumber, amount with debits as negative).
Extract all transactions.`;

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
    