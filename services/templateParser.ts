import { ParsedTransaction } from '../types';
import logger from './logger';
import {
  isStandardCharteredStatement,
  parseStandardCharteredStatement
} from './parsers/standardCharteredParser';

/**
 * Parse OCR text with template detection and smart extraction
 */
export function parseWithTemplateDetection(text: string): ParsedTransaction[] {
  logger.info('=== TEMPLATE-BASED PARSING START ===');
  logger.info('Text length:', text.length);

  // Step 1: Detect statement metadata
  const metadata = extractMetadata(text);
  logger.info('Metadata detected:', metadata);

  if (isStandardCharteredStatement(text)) {
  logger.info('Standard Chartered layout detected – switching to specialised parser');
    const specialisedResult = parseStandardCharteredStatement(text, metadata);
    if (specialisedResult.transactions.length > 0) {
  logger.info(`Standard Chartered parser extracted ${specialisedResult.transactions.length} transactions`);
      return specialisedResult.transactions;
    }
  logger.info('Specialised parser returned no transactions, continuing with generic flow');
  }

  // Step 2: Normalize and clean text for better pattern matching
  const normalizedText = normalizeText(text);

  // Step 3: Detect and extract transaction table
  const transactions = detectAndExtractTransactions(normalizedText, metadata);
  logger.info(`Extracted ${transactions.length} transactions`);

  if (transactions.length > 0) {
    logger.info('Sample transactions:', transactions.slice(0, 3));
  }

  return transactions;
}

/**
 * Extract metadata from statement
 */
function extractMetadata(text: string): {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  statementPeriod: string;
  currency: string;
} {
  const metadata = {
    bankName: 'Unknown Bank',
    accountHolder: 'Customer',
    accountNumber: '',
    statementPeriod: '',
    currency: 'USD'
  };

  const isStandardChartered = /Standard\s+Chartered/i.test(text);
  if (isStandardChartered) {
    metadata.bankName = 'Standard Chartered Bank';
    metadata.currency = 'INR';

    const scNameMatch = text.match(/(?:Account\s*(?:Name|Holder)|Customer Name)[:\s]+([A-Z&][A-Z&\s]{4,})/i)
      || text.match(/MR\.?\s+([A-Z&][A-Z&\s]{4,})/i)
      || text.match(/MS\.?\s+([A-Z&][A-Z&\s]{4,})/i);
    if (scNameMatch && scNameMatch[1]) {
      metadata.accountHolder = tidyName(fixOcrName(scNameMatch[1]));
    }

    const scAccountMatch = text.match(/(?:Account\s*(?:No\.?|Number)|Account\s*#)[:\s]+([0-9\s]{6,})/i);
    if (scAccountMatch && scAccountMatch[1]) {
      metadata.accountNumber = scAccountMatch[1].replace(/\s+/g, '');
    }

    const scPeriodMatch = text.match(/Statement\s+Period[:\s]+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s*(?:to|-|until)\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i);
    if (scPeriodMatch && scPeriodMatch[1] && scPeriodMatch[2]) {
      metadata.statementPeriod = `${scPeriodMatch[1]} - ${scPeriodMatch[2]}`;
    }

    const scCurrencyMatch = text.match(/Currency[:\s]+([A-Z]{3})/i);
    if (scCurrencyMatch && scCurrencyMatch[1]) {
      metadata.currency = scCurrencyMatch[1].toUpperCase();
    }
  }

  // Extract account holder - look for common patterns
  const holderPatterns = [
    /(?:Account.*?Holder|Customer Name|Name)[\s:]*([A-Z][A-Za-z\s]+)(?=\n|Account|$)/i,
    /^([A-Z][A-Za-z\s]{5,40})\n/m
  ];

  if (metadata.accountHolder === 'Customer') {
    for (const pattern of holderPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        metadata.accountHolder = tidyName(fixOcrName(match[1]));
        break;
      }
    }
  }

  // Extract account number
  const accountPatterns = [
    /Account Number[:\s]+([0-9\-]+)/i,
    /Account\s*#?\s*([0-9\-]{10,})/i,
    /[Xx]{6,}([0-9]{4})/
  ];

  if (!metadata.accountNumber) {
    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        metadata.accountNumber = match[1].trim();
        break;
      }
    }
  }

  // Extract statement period
  const periodPatterns = [
    /(?:Statement Period|Period|For the period|Statement Date)[\s:]*([A-Za-z]+ \d{1,2}, \d{4})\s*-\s*([A-Za-z]+ \d{1,2}, \d{4})/i,
    /([A-Za-z]+\s+\d{1,2})\s*(?:to|-)\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  ];

  if (!metadata.statementPeriod) {
    for (const pattern of periodPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.statementPeriod = `${match[1]} - ${match[2]}`;
        break;
      }
    }
  }

  return metadata;
}

function tidyName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function fixOcrName(name: string): string {
  return name
    .replace(/0/g, 'O')
    .replace(/5/g, 'S')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B');
}

/**
 * Normalize text for better parsing
 */
function normalizeText(text: string): string {
  return text
    // Normalize line breaks and whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Don't collapse all spaces - keep line structure for line-based parsing
    // but remove excessive spacing
    .replace(/[ \t]{2,}/g, ' ')
    // Fix common OCR errors
    .replace(/[Ll]0|[Òò0]/g, '0')
    .replace(/[Il1]/g, '1')
    .replace(/[Ss5]/g, '5')
    .replace(/[Oo0]/g, '0')
    .trim();
}

/**
 * Detect transaction table and extract data
 */
function detectAndExtractTransactions(
  text: string,
  metadata: any
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Split text into lines for analysis
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  console.log(`Processing ${lines.length} lines`);
  
  // Debug: Show first 30 lines
  console.log('First 30 lines of text:');
  lines.slice(0, 30).forEach((line, i) => {
    console.log(`${i}: "${line.substring(0, 100)}"`);
  });

  // Try direct date + amount pattern matching first (aggressive approach)
  const directTransactions = extractDirectTransactions(lines, metadata);
  if (directTransactions.length > 0) {
    console.log(`✓ Direct extraction found ${directTransactions.length} transactions`);
    return directTransactions;
  }

  console.log('Direct extraction found nothing, trying header-based approach');

  // Find transaction section headers
  const transactionHeaderIndex = findTransactionHeader(lines);
  console.log('Transaction header found at line:', transactionHeaderIndex);

  if (transactionHeaderIndex === -1) {
    console.log('No transaction header found, using fallback extraction');
    return extractTransactionsWithoutHeader(lines, metadata);
  }

  // Extract transactions from identified section
  const startIndex = transactionHeaderIndex + 1;
  const endIndex = findSectionEnd(lines, startIndex);

  console.log(`Extracting transactions from line ${startIndex} to ${endIndex}`);

  for (let i = startIndex; i < endIndex; i++) {
    const line = lines[i].trim();

    if (line.length === 0) continue;

    // Check if line looks like a transaction
    if (looksLikeTransaction(line)) {
      const transaction = parseTransactionLine(line, metadata);
      if (transaction) {
        transactions.push(transaction);
        console.log(`✓ Parsed: ${transaction.transactionDate} | ${transaction.description} | ${transaction.amount}`);
      }
    }
  }

  return transactions;
}

/**
 * Direct extraction: Aggressively look for any line with date + amount pattern
 * This function tries MULTIPLE extraction strategies with increasing flexibility
 */
function extractDirectTransactions(
  lines: string[],
  metadata: any
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Strategy 1: Look for date at start, amount at end (most precise)
  console.log('Strategy 1: Date at start, amount at end...');
  const s1Pattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(.+?)\s+([\-\$]?\d{1,3}(?:,\d{3})*\.\d{2})$/;
  for (const line of lines) {
    const trimmed = line.trim();
    const match = s1Pattern.exec(trimmed);
    if (match) {
      const txn = parseTransactionFromMatch(match, metadata, transactions.length);
      if (txn) {
        transactions.push(txn);
        console.log(`✓ S1: ${txn.transactionDate} | ${txn.description} | ${txn.amount}`);
      }
    }
  }
  if (transactions.length > 0) return transactions;

  // Strategy 2: Date + amount with flexible whitespace/separators
  console.log('Strategy 2: Date + amount with flexible patterns...');
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const amountRegex = /([\-\$]?\d{1,3}(?:,\d{3})*\.\d{2})/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    
    const dateMatch = dateRegex.exec(trimmed);
    const amountMatch = amountRegex.exec(trimmed);
    
    if (dateMatch && amountMatch) {
      try {
        const month = dateMatch[1].padStart(2, '0');
        const day = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        const transactionDate = `${year}-${month}-${day}`;
        
        const amountStr = amountMatch[1]
          .replace(/[\$\-]/g, '') // Remove $ and leading - for now
          .replace(/,/g, '');
        let amount = parseFloat(amountStr);
        
        // Check if it should be negative (various indicators)
        const lowerLine = trimmed.toLowerCase();
        if (amountMatch[1].startsWith('-') || 
            lowerLine.includes('debit') || 
            lowerLine.includes('withdrawal') ||
            lowerLine.includes('charge') ||
            lowerLine.includes('payment out')) {
          amount = -amount;
        }
        
        // Extract description: remove date and amount
        let description = trimmed
          .replace(dateRegex, '')
          .replace(amountRegex, '')
          .trim()
          .replace(/[\-–—]/g, '') // Remove various dash types
          .replace(/\s+/g, ' ')
          .substring(0, 100);
        
        if (description.length < 3) continue;
        
        transactions.push({
          bankName: metadata.bankName,
          clientName: metadata.accountHolder,
          transactionDate,
          description,
          referenceNumber: `TXN-${transactions.length + 1}`,
          amount
        });
        
        console.log(`✓ S2: ${transactionDate} | ${description} | ${amount}`);
      } catch (error) {
        console.warn('S2 parse error:', error);
      }
    }
  }
  if (transactions.length > 0) return transactions;

  // Strategy 3: Multi-line transactions
  console.log('Strategy 3: Multi-line transactions...');
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i].trim();
    const next = lines[i + 1].trim();
    
    const dateMatch = dateRegex.exec(current);
    const amountMatch = amountRegex.exec(next);
    
    if (dateMatch && amountMatch && current.length > 5 && next.length > 5) {
      try {
        const month = dateMatch[1].padStart(2, '0');
        const day = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        const transactionDate = `${year}-${month}-${day}`;
        
        const amountStr = next
          .replace(amountRegex, '$1')
          .replace(/[\$\-]/g, '')
          .replace(/,/g, '');
        let amount = parseFloat(amountStr);
        
        if (next.includes('-') || next.toLowerCase().includes('debit')) {
          amount = -amount;
        }
        
        const description = current
          .replace(dateRegex, '')
          .trim()
          .substring(0, 100);
        
        if (description.length < 3) continue;
        
        transactions.push({
          bankName: metadata.bankName,
          clientName: metadata.accountHolder,
          transactionDate,
          description,
          referenceNumber: `TXN-${transactions.length + 1}`,
          amount
        });
        
        console.log(`✓ S3: ${transactionDate} | ${description} | ${amount}`);
        i++; // Skip next line as we used it
      } catch (error) {
        console.warn('S3 parse error:', error);
      }
    }
  }

  // Strategy 4: Detect any date and any amount even if not adjacent (last resort)
  console.log('Strategy 4: Non-adjacent date + amount detection...');
  const dateMatches: Array<{line: number; match: RegExpExecArray}> = [];
  const amountMatches: Array<{line: number; match: RegExpExecArray}> = [];
  
  lines.forEach((line, idx) => {
    const dm = dateRegex.exec(line);
    const am = amountRegex.exec(line);
    if (dm) dateMatches.push({ line: idx, match: dm });
    if (am) amountMatches.push({ line: idx, match: am });
  });
  
  console.log(`Found ${dateMatches.length} dates and ${amountMatches.length} amounts`);
  
  // Match dates with nearby amounts
  for (const dateItem of dateMatches) {
    // Find closest amount (preferring ones on same or next line)
    const closest = amountMatches.reduce((best: any, amt: any) => {
      const dist = Math.abs(amt.line - dateItem.line);
      if (!best || dist < Math.abs(best.line - dateItem.line)) {
        // Make sure it's not too far (within 3 lines)
        if (dist <= 3) return amt;
      }
      return best;
    }, null);
    
    if (closest && transactions.length < 100) { // Limit to prevent spam
      try {
        const dm = dateItem.match;
        const am = closest.match;
        const month = dm[1].padStart(2, '0');
        const day = dm[2].padStart(2, '0');
        const year = dm[3].length === 2 ? `20${dm[3]}` : dm[3];
        const transactionDate = `${year}-${month}-${day}`;
        
        const amountStr = am[1]
          .replace(/[\$\-]/g, '')
          .replace(/,/g, '');
        let amount = parseFloat(amountStr);
        
        if (am[1].startsWith('-')) amount = -amount;
        
        const description = `Transaction on line ${dateItem.line}`;
        
        transactions.push({
          bankName: metadata.bankName,
          clientName: metadata.accountHolder,
          transactionDate,
          description,
          referenceNumber: `TXN-${transactions.length + 1}`,
          amount
        });
        
        console.log(`✓ S4: ${transactionDate} | ${description} | ${amount}`);
      } catch (error) {
        console.warn('S4 parse error:', error);
      }
    }
  }

  return transactions;
}

/**
 * Helper to parse transaction from regex match
 */
function parseTransactionFromMatch(
  match: RegExpExecArray,
  metadata: any,
  index: number
): ParsedTransaction | null {
  try {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const transactionDate = `${year}-${month}-${day}`;
    
    const description = match[4].trim().substring(0, 100);
    if (description.length < 3) return null;
    
    const amountStr = match[5]
      .replace(/[\$\-]/g, '')
      .replace(/,/g, '');
    let amount = parseFloat(amountStr);
    
    // Check if should be negative
    if (match[5].startsWith('-')) {
      amount = -amount;
    }
    
    return {
      bankName: metadata.bankName,
      clientName: metadata.accountHolder,
      transactionDate,
      description,
      referenceNumber: `TXN-${index + 1}`,
      amount
    };
  } catch (error) {
    console.warn('Match parse error:', error);
    return null;
  }
}

/**
 * Find where the transaction table begins
 */
function findTransactionHeader(lines: string[]): number {
  const headerPatterns = [
    /date|transaction|amount/i,
    /posted|description|debit|credit/i,
    /^\s*(\d{1,2}\/\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  ];

  // Look in first 20 lines for header
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const matchCount = headerPatterns.filter(p => p.test(lines[i])).length;

    if (matchCount >= 2) {
      return i;
    }
  }

  // Fallback: look for first date pattern
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}|^\d{1,2}\s+[A-Z][a-z]{2}/.test(lines[i])) {
      return i - 1;
    }
  }

  return -1;
}

/**
 * Find where transaction section ends
 */
function findSectionEnd(lines: string[], startIndex: number): number {
  const endPatterns = [
    /^total|^balance|^summary|^ending|^fees|^interest|^average|^thank you/i,
    /^[A-Z][A-Za-z]+\s+[A-Z]/  // Likely a new section header
  ];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    if (endPatterns.some(pattern => pattern.test(line))) {
      return i;
    }

    // If we've gone 100 lines without dates, probably past transactions
    if (i - startIndex > 100 && !/\d{1,2}\/\d{1,2}/.test(line)) {
      return i;
    }
  }

  return lines.length;
}

/**
 * Check if a line looks like it contains a transaction
 */
function looksLikeTransaction(line: string): boolean {
  // Must have a date
  const hasDate = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{1,2}\s+[A-Z][a-z]{2}\b/.test(line);

  // Must have an amount (number with 2 decimal places)
  const hasAmount = /\d+\.\d{2}|\$\d+/.test(line);

  // Should have some description text
  const hasDescription = /[A-Z]{2,}/.test(line);

  return hasDate && hasAmount && hasDescription;
}

/**
 * Parse a transaction line
 */
function parseTransactionLine(line: string, metadata: any): ParsedTransaction | null {
  try {
    // Extract date
    const dateMatch = line.match(
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b|\b(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})\b/
    );

    if (!dateMatch) return null;

    let transactionDate = '';
    if (dateMatch[1]) {
      // MM/DD/YYYY format
      const month = dateMatch[1].padStart(2, '0');
      const day = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      transactionDate = `${year}-${month}-${day}`;
    } else if (dateMatch[4]) {
      // DD MMM YYYY format
      const day = dateMatch[4].padStart(2, '0');
      const month = getMonthNumber(dateMatch[5]);
      const year = dateMatch[6];
      transactionDate = `${year}-${month}-${day}`;
    }

    // Extract amount (last number with decimals)
    const amountMatches = [...line.matchAll(/([+-]?\$?)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)];
    if (amountMatches.length === 0) return null;

    const lastAmount = amountMatches[amountMatches.length - 1];
    const amountStr = lastAmount[2].replace(/,/g, '');
    let amount = parseFloat(amountStr);

    // Determine debit/credit based on position or text
    if (line.includes('DEBIT') || line.includes('-')) {
      amount = Math.abs(amount) * -1;
    }

    // Extract description (text between date and amount)
    const dateEndPos = line.indexOf(dateMatch[0]) + dateMatch[0].length;
    const amountStartPos = line.lastIndexOf(lastAmount[0]);
    const description = line
      .substring(dateEndPos, amountStartPos)
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 100);

    if (!description) return null;

    return {
      bankName: metadata.bankName,
      clientName: metadata.accountHolder,
      transactionDate,
      description,
      referenceNumber: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount
    };

  } catch (error) {
    console.warn('Failed to parse line:', line, error);
    return null;
  }
}

/**
 * Convert month abbreviation to number
 */
function getMonthNumber(monthStr: string): string {
  const months: { [key: string]: string } = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  return months[monthStr.toLowerCase()] || '01';
}

/**
 * Fallback extraction without header detection
 */
function extractTransactionsWithoutHeader(
  lines: string[],
  metadata: any
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    if (looksLikeTransaction(line)) {
      const transaction = parseTransactionLine(line, metadata);
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }

  return transactions;
}
