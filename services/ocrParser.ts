import { ParsedTransaction } from '../types';
import { parseWithTemplateDetection } from './templateParser';
import logger from './logger';

/**
 * Parse OCR-extracted text into structured transaction data
 * Uses advanced template detection and machine-readable patterns
 */
export function parseOCRText(text: string, documentType: 'bank' | 'creditcard' | 'ledger' | null): ParsedTransaction[] {
  logger.info('=== OCR TEXT PARSING START ===');
  logger.info('Input text length:', text.length);
  logger.info('Document type:', documentType);
  logger.info('First 2000 characters of text:');
  logger.info(text.substring(0, 2000));
  logger.info('=== END TEXT SAMPLE ===');

  try {
    // Clean and normalize the text - preserve line breaks for template parser
    const cleanText = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Normalize line endings
      .replace(/[ \t]+/g, ' ') // Collapse spaces/tabs but preserve newlines
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters except newlines
      .trim();

  logger.info('Cleaned text length:', cleanText.length);

    // Use advanced template-based parser
    let transactions: ParsedTransaction[] = [];

    // Primary: Template-based detection
    transactions = parseWithTemplateDetection(cleanText);

    if (transactions.length > 0) {
      logger.info(`✓ Template parser found ${transactions.length} transactions`);
      return transactions;
    }

  logger.info('Template parser found no transactions, trying fallback methods');

    // Fallback: Traditional parsing based on document type
    const metadata = extractMetadata(cleanText);
  logger.info('Extracted metadata:', metadata);

    switch (documentType) {
      case 'bank':
        transactions = parseBankStatement(cleanText, metadata);
        break;
      case 'creditcard':
        transactions = parseCreditCardStatement(cleanText, metadata);
        break;
      case 'ledger':
        transactions = parseLedger(cleanText, metadata);
        break;
      default:
        // Try to auto-detect document type
        transactions = autoDetectAndParse(cleanText, metadata);
    }

  logger.info(`Parsed ${transactions.length} transactions from OCR text`);
  logger.info('Sample transactions:', transactions.slice(0, 3));
    return transactions;

  } catch (error) {
    console.error('OCR text parsing failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    
    // Return empty array instead of summary - let the app handle it
    return [];
  }
}

/**
 * Extract basic metadata from OCR text
 */
function extractMetadata(text: string): {
  bankName: string;
  clientName: string;
  statementPeriod: string;
  currency: string;
} {
  // Default metadata
  const metadata = {
    bankName: 'Unknown Bank',
    clientName: 'Unknown Client',
    statementPeriod: '',
    currency: 'USD'
  };

  // Try to extract bank name
  const bankPatterns = [
    /bank\s+of\s+america/i,
    /chase/i,
    /wells\s+fargo/i,
    /citibank/i,
    /bank\s+of\s+the\s+west/i,
    /us\s+bank/i,
    /pnc/i,
    /capital\s+one/i,
    /discover/i,
    /american\s+express/i
  ];

  for (const pattern of bankPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.bankName = match[0];
      break;
    }
  }

  // Try to extract client name (look for patterns after "Account Holder" or similar)
  const clientPatterns = [
    /account\s+holder:?\s*([^\n\r]+)/i,
    /customer:?\s*([^\n\r]+)/i,
    /client:?\s*([^\n\r]+)/i,
    /name:?\s*([^\n\r]+)/i
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      metadata.clientName = match[1].trim();
      break;
    }
  }

  // Try to extract statement period
  const periodPatterns = [
    /statement\s+(?:period|date):?\s*([^\n\r]+)/i,
    /from\s+([^\n\r]+?)\s+to\s+([^\n\r]+)/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[^\n\r]*/i
  ];

  for (const pattern of periodPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.statementPeriod = match[0].trim();
      break;
    }
  }

  // Try to extract currency
  const currencyPatterns = [
    /\b(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|KRW|TRY|RUB|INR|BRL|ZAR)\b/g
  ];

  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.currency = match[0];
      break;
    }
  }

  return metadata;
}

/**
 * Parse bank statement OCR text with grid-based detection
 */
function parseBankStatement(text: string, metadata: any): ParsedTransaction[] {
  console.log('=== BANK STATEMENT PARSING ===');

  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log(`Processing ${lines.length} lines of text`);

  // First, try grid-based parsing (most reliable for structured statements)
  const gridTransactions = parseGridBased(text, metadata);
  if (gridTransactions.length > 0) {
    console.log(`Grid-based parsing found ${gridTransactions.length} transactions`);
    return gridTransactions;
  }

  console.log('Grid-based parsing failed, falling back to pattern matching');

  // Fallback: Look for transaction patterns (original logic)
  const transactionPatterns = [
    // MM/DD/YYYY or MM/DD/YY followed by description and amount
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*\.\d{2}|\$?\d+\.\d{2})$/,
    // YYYY-MM-DD followed by description and amount
    /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*\.\d{2}|\$?\d+\.\d{2})$/,
    // Date, description, amount (more flexible)
    /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\$?\d+(?:\.\d{2})?|\$?\d+\.\d{2})/
  ];

  for (const line of lines) {
    for (const pattern of transactionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, description, amountStr] = match;

        // Parse date
        let transactionDate = '';
        try {
          if (dateStr.includes('/')) {
            // MM/DD/YYYY or MM/DD/YY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              transactionDate = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          } else {
            // YYYY-MM-DD format
            transactionDate = dateStr;
          }
        } catch (error) {
          console.warn('Failed to parse date:', dateStr);
          transactionDate = new Date().toISOString().split('T')[0];
        }

        // Parse amount
        let amount = 0;
        try {
          const cleanAmount = amountStr.replace(/[$,]/g, '');
          amount = parseFloat(cleanAmount);
        } catch (error) {
          console.warn('Failed to parse amount:', amountStr);
        }

        transactions.push({
          bankName: metadata.bankName,
          clientName: metadata.clientName,
          transactionDate,
          description: description.trim(),
          referenceNumber: `OCR-${transactions.length + 1}`,
          amount
        });

        break; // Found a match, move to next line
      }
    }
  }

  // If no transactions found with patterns, create a summary transaction
  if (transactions.length === 0) {
    console.log('No transactions found with any method, creating summary');
    transactions.push({
      bankName: metadata.bankName,
      clientName: metadata.clientName,
      transactionDate: new Date().toISOString().split('T')[0],
      description: `OCR Text Summary (${text.length} characters)`,
      referenceNumber: 'OCR-SUMMARY',
      amount: 0
    });
  }

  return transactions;
}

/**
 * Parse credit card statement OCR text
 */
function parseCreditCardStatement(text: string, metadata: any): ParsedTransaction[] {
  // For now, use similar logic to bank statements
  // Credit card statements often have similar transaction formats
  return parseBankStatement(text, metadata);
}

/**
 * Parse ledger OCR text
 */
function parseLedger(text: string, metadata: any): ParsedTransaction[] {
  // For now, use similar logic to bank statements
  // Ledgers might have different formats, but this is a starting point
  return parseBankStatement(text, metadata);
}

/**
 * Auto-detect document type and parse accordingly
 */
function autoDetectAndParse(text: string, metadata: any): ParsedTransaction[] {
  const lowerText = text.toLowerCase();

  // Simple heuristics for document type detection
  if (lowerText.includes('credit card') || lowerText.includes('card ending')) {
    return parseCreditCardStatement(text, metadata);
  } else if (lowerText.includes('ledger') || lowerText.includes('general ledger')) {
    return parseLedger(text, metadata);
  } else {
    // Default to bank statement
    return parseBankStatement(text, metadata);
  }
}

/**
 * Utility function to clean and normalize amounts
 */
export function normalizeAmount(amountStr: string): number {
  if (!amountStr) return 0;

  // Remove currency symbols and commas
  const cleanStr = amountStr.replace(/[$,£€¥]/g, '').replace(/,/g, '');

  // Handle parentheses for negative amounts (common in accounting)
  const isNegative = cleanStr.includes('(') && cleanStr.includes(')');
  const finalStr = cleanStr.replace(/[()]/g, '');

  const amount = parseFloat(finalStr);
  return isNaN(amount) ? 0 : (isNegative ? -amount : amount);
}

/**
 * Utility function to parse various date formats
 */
export function parseTransactionDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  try {
    // Handle MM/DD/YYYY or MM/DD/YY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }

    // Handle YYYY-MM-DD
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }

    // Try to parse as Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

  } catch (error) {
    console.warn('Failed to parse date:', dateStr);
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parse grid-based transaction data
 */
function parseGridBased(text: string, metadata: any): ParsedTransaction[] {
  console.log('=== GRID-BASED PARSING ===');

  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Look for table headers to identify column positions
  const headerPatterns = [
    /date\s+description\s+amount/i,
    /date\s+transaction\s+amount/i,
    /date\s+memo\s+amount/i,
    /posted\s+description\s+amount/i,
    /trans\s+date\s+description\s+amount/i
  ];

  let headerLineIndex = -1;
  let columnPositions: { date: number; description: number; amount: number } | null = null;

  // Find header line
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    for (const pattern of headerPatterns) {
      if (pattern.test(lines[i])) {
        headerLineIndex = i;
        console.log(`Found header at line ${i}: "${lines[i]}"`);
        break;
      }
    }
    if (headerLineIndex !== -1) break;
  }

  if (headerLineIndex === -1) {
    console.log('No table header found, trying alternative detection');
    // Try to detect columns by analyzing spacing patterns
    columnPositions = detectColumnsBySpacing(lines);
  } else {
    // Parse header to determine column positions
    columnPositions = parseHeaderColumns(lines[headerLineIndex]);
  }

  if (!columnPositions) {
    console.log('Could not determine column positions');
    return transactions;
  }

  console.log('Detected column positions:', columnPositions);

  // Process transaction lines (skip header and any summary lines)
  const startLine = headerLineIndex + 1;
  const endLine = findTransactionEnd(lines, startLine);

  console.log(`Processing transaction lines from ${startLine} to ${endLine}`);

  for (let i = startLine; i < endLine && i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 10) continue; // Skip very short lines

    const transaction = parseTransactionLine(line, columnPositions, metadata);
    if (transaction) {
      transactions.push(transaction);
      console.log(`Parsed transaction: ${transaction.transactionDate} - ${transaction.description} - ${transaction.amount}`);
    }
  }

  console.log(`Grid-based parsing completed: ${transactions.length} transactions found`);
  return transactions;
}

/**
 * Detect column positions by analyzing text spacing patterns
 */
function detectColumnsBySpacing(lines: string[]): { date: number; description: number; amount: number } | null {
  // Look for lines that contain dates, descriptions, and amounts
  const sampleLines = lines.slice(0, Math.min(lines.length, 50));

  // Find lines with dates
  const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/;
  const amountPattern = /[\$]?\d+\.\d{2}\b/;

  let datePositions: number[] = [];
  let amountPositions: number[] = [];

  for (const line of sampleLines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      datePositions.push(dateMatch.index!);
    }

    const amountMatches = [...line.matchAll(amountPattern)];
    if (amountMatches.length > 0) {
      amountPositions.push(amountMatches[amountMatches.length - 1].index!);
    }
  }

  if (datePositions.length === 0 || amountPositions.length === 0) {
    return null;
  }

  // Calculate average positions
  const avgDatePos = Math.round(datePositions.reduce((a, b) => a + b, 0) / datePositions.length);
  const avgAmountPos = Math.round(amountPositions.reduce((a, b) => a + b, 0) / amountPositions.length);

  // Description starts after date and goes until amount
  const descriptionPos = avgDatePos + 15; // Rough estimate

  return {
    date: avgDatePos,
    description: descriptionPos,
    amount: avgAmountPos
  };
}

/**
 * Parse header line to determine column positions
 */
function parseHeaderColumns(headerLine: string): { date: number; description: number; amount: number } | null {
  const lowerHeader = headerLine.toLowerCase();

  // Find positions of key column headers
  const datePos = lowerHeader.indexOf('date');
  const descriptionPos = lowerHeader.search(/\b(description|memo|transaction|details)\b/);
  const amountPos = lowerHeader.search(/\b(amount|debit|credit|balance)\b/);

  if (datePos === -1 || descriptionPos === -1 || amountPos === -1) {
    return null;
  }

  return {
    date: datePos,
    description: descriptionPos,
    amount: amountPos
  };
}

/**
 * Find where transaction data ends (before totals/summaries)
 */
function findTransactionEnd(lines: string[], startIndex: number): number {
  const summaryPatterns = [
    /total/i,
    /balance/i,
    /summary/i,
    /ending balance/i,
    /beginning balance/i,
    /deposits/i,
    /withdrawals/i
  ];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryPatterns.some(pattern => pattern.test(line))) {
      return i;
    }
  }

  return lines.length;
}

/**
 * Parse a single transaction line using column positions
 */
function parseTransactionLine(
  line: string,
  columns: { date: number; description: number; amount: number },
  metadata: any
): ParsedTransaction | null {
  try {
    // Extract date (first column)
    const dateText = extractColumnText(line, columns.date, columns.description - columns.date);
    const dateMatch = dateText.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
    if (!dateMatch) return null;

    let transactionDate = '';
    const dateStr = dateMatch[1];
    try {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        transactionDate = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateStr);
      return null;
    }

    // Extract description (middle column)
    const descStart = columns.description;
    const descEnd = columns.amount;
    const description = extractColumnText(line, descStart, descEnd - descStart).trim();
    if (!description) return null;

    // Extract amount (last column)
    const amountText = extractColumnText(line, columns.amount, line.length - columns.amount);
    const amountMatch = amountText.match(/[\$]?([+-]?\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})/);
    if (!amountMatch) return null;

    let amount = 0;
    try {
      const cleanAmount = amountMatch[1].replace(/[$,]/g, '');
      amount = parseFloat(cleanAmount);
    } catch (error) {
      console.warn('Failed to parse amount:', amountMatch[1]);
      return null;
    }

    return {
      bankName: metadata.bankName,
      clientName: metadata.clientName,
      transactionDate,
      description,
      referenceNumber: `GRID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount
    };

  } catch (error) {
    console.warn('Failed to parse transaction line:', line, error);
    return null;
  }
}

/**
 * Extract text from a specific column position
 */
function extractColumnText(line: string, startPos: number, length: number): string {
  if (startPos >= line.length) return '';

  const endPos = Math.min(startPos + length, line.length);
  return line.substring(startPos, endPos).trim();
}