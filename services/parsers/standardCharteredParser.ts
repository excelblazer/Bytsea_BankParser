import { ParsedTransaction } from '../../types';

interface StatementMetadata {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  statementPeriod: string;
  currency: string;
}

interface StandardCharteredParseResult {
  transactions: ParsedTransaction[];
}

interface LeadingDateMatch {
  raw: string;
  isoDate: string;
}

const HEADER_PATTERN = /date\s+value\s*date\s+description/i;
const STOP_SECTION_PATTERN = /^(?:total|summary|closing balance|charges|thank you|interest)/i;
const PAGE_FOOTER_PATTERN = /^page\s+\d+\s+of\s+/i;
const TEXTUAL_DATE_PATTERN = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/;
const HYBRID_TEXTUAL_DATE_PATTERN = /^(\d{1,2})[-\s]?([A-Za-z]{3})[-\s]?(\d{2,4})/;
const NUMERIC_DATE_PATTERN = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/;
const NON_TRANSACTION_HINTS = /(statement\s+date|account\s+statement|page\s+\d|branch\s+address|account\s+type|account\s+no|nominee|ifsc|micr|currency\s*:|smart\s+banking\s+savings)/i;

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

const CLEAN_DESCRIPTION_PATTERNS: Array<[RegExp, string]> = [
  [/\s{2,}/g, ' '],
  [/\s+CR$/i, ''],
  [/\s+DR$/i, ''],
  [/\s+CRDIT$/i, ''],
  [/\s+DRDIT$/i, ''],
  [/\s+$/g, '']
];

const NEGATIVE_HINT_PATTERN = /(withdrawal|debit|purchase|fee|charge|ach debit|atm|bill payment|emi)/i;
const POSITIVE_HINT_PATTERN = /(deposit|credit|salary|refund|reversal|interest|cashback|remittance|neft in|imps in)/i;

/**
 * Basic signal to identify Standard Chartered statements before running the parser
 */
export function isStandardCharteredStatement(text: string): boolean {
  const upper = text.toUpperCase();
  return upper.includes('STANDARD CHARTERED') ||
    /SMART\s+BANKING\s+SAVINGS/i.test(text) ||
    /IFSC\s*[:.]?\s*SCBL/i.test(text) ||
    HEADER_PATTERN.test(text);
}

/**
 * Parse statements following the Standard Chartered layout (India retail banking)
 */
export function parseStandardCharteredStatement(
  rawText: string,
  metadata: StatementMetadata
): StandardCharteredParseResult {
  const sanitisedText = preCleanText(rawText);
  const lines = sanitisedText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !PAGE_FOOTER_PATTERN.test(line));

  const headerIndex = lines.findIndex(line => HEADER_PATTERN.test(line));
  const startIndex = headerIndex !== -1
    ? headerIndex + 1
    : findFirstTransactionIndex(lines);

  if (startIndex === -1) {
    console.log('[SC Parser] No obvious transaction region located – skipping specialised parser.');
    return { transactions: [] };
  }

  const transactions: ParsedTransaction[] = [];
  for (let i = startIndex; i < lines.length;) {
    let line = lines[i];

    if (!line || STOP_SECTION_PATTERN.test(line)) {
      i++;
      continue;
    }

    if (NON_TRANSACTION_HINTS.test(line)) {
      i++;
      continue;
    }

    const primaryDate = matchLeadingDate(line);
    if (!primaryDate) {
      i++;
      continue;
    }

    let compositeLine = line;
    let j = i + 1;
    while (j < lines.length) {
      const peek = lines[j];
      if (!peek || STOP_SECTION_PATTERN.test(peek) || matchLeadingDate(peek)) {
        break;
      }
      compositeLine += ' ' + peek;
      j++;
    }

    const transaction = buildTransaction(compositeLine, metadata, transactions.length);
    if (transaction) {
      transactions.push(transaction);
    } else {
      console.warn('[SC Parser] Failed to parse line', compositeLine);
    }

    i = j;
  }

  return { transactions };
}

function preCleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/([A-Z])0([A-Z])/g, '$1O$2')
    .replace(/([A-Z])5([A-Z])/g, '$1S$2')
    .replace(/([A-Z])1([A-Z])/g, '$1I$2')
    .replace(/([A-Z])8([A-Z])/g, '$1B$2')
    .replace(/([A-Z])6([A-Z])/g, '$1G$2');
}

function buildTransaction(
  rawLine: string,
  metadata: StatementMetadata,
  index: number
): ParsedTransaction | null {
  const collapsed = rawLine.replace(/\s+/g, ' ').trim();

  if (NON_TRANSACTION_HINTS.test(collapsed)) {
    return null;
  }
  const dateMatch = matchLeadingDate(collapsed);
  if (!dateMatch) {
    return null;
  }

  const transactionDate = dateMatch.isoDate;
  if (!transactionDate) {
    return null;
  }

  let remainder = collapsed.slice(dateMatch.raw.length).trim();

  const valueDateMatch = matchLeadingDate(remainder);
  if (valueDateMatch) {
    remainder = remainder.slice(valueDateMatch.raw.length).trim();
  }

  const extraction = extractDescriptionAndAmounts(remainder);
  if (!extraction) {
    return null;
  }

  const { description, debit, credit } = extraction;
  if (!description || description.length < 3) {
    return null;
  }

  const amount = computeNetAmount({ debit, credit, description });
  if (amount === null || isNaN(amount)) {
    return null;
  }

  const referenceNumber = deriveReferenceNumber(description, index);

  const cleanedDescription = CLEAN_DESCRIPTION_PATTERNS.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    description
  ).trim();

  const bankName = metadata.bankName || 'Standard Chartered Bank';
  const clientName = metadata.accountHolder || metadata.accountNumber || 'Customer';

  return {
    bankName,
    clientName,
    transactionDate,
    description: cleanedDescription,
    referenceNumber,
    amount: roundToTwo(amount)
  };
}

function extractDescriptionAndAmounts(remainder: string): {
  description: string;
  debit: AmountToken | null;
  credit: AmountToken | null;
} | null {
  let working = remainder.trim();
  const amountTokens: AmountToken[] = [];

  const tailAmountPattern = /((?:INR|RS\.?|₹)?\s*\(?-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\)?(?:\s*(?:CR|DR))?)\s*$/i;

  for (let i = 0; i < 3; i++) {
    const match = working.match(tailAmountPattern);
    if (!match) {
      break;
    }

    const token = parseAmountToken(match[1]);
    if (token) {
      amountTokens.unshift(token);
    }
    working = working.slice(0, match.index).trim();
  }

  // Assign tokens: [maybeCredit, maybeDebit, balance]
  let credit: AmountToken | null = null;
  let debit: AmountToken | null = null;
  if (amountTokens.length === 3) {
    credit = amountTokens[0];
    debit = amountTokens[1];
  } else if (amountTokens.length === 2) {
    // Heuristic: pick the token with explicit negative sign / DR as debit
    const [first, second] = amountTokens;
    if (first.sign === -1 || /DR$/i.test(first.raw)) {
      debit = first;
      credit = second;
    } else if (second.sign === -1 || /DR$/i.test(second.raw)) {
      debit = second;
      credit = first;
    } else {
      // default: first = credit, second = debit (based on column order)
      credit = first;
      debit = second;
    }
  } else if (amountTokens.length === 1) {
    const [single] = amountTokens;
    if (single.sign === -1) {
      debit = single;
    } else {
      credit = single;
    }
  }

  const description = working.trim();
  if (!description || NON_TRANSACTION_HINTS.test(description)) {
    return null;
  }
  return { description, debit, credit };
}

function computeNetAmount({
  debit,
  credit,
  description
}: {
  debit: AmountToken | null;
  credit: AmountToken | null;
  description: string;
}): number | null {
  let amount = 0;
  const hasDebit = debit && debit.value !== 0;
  const hasCredit = credit && credit.value !== 0;

  if (hasCredit && hasDebit) {
    amount = credit!.value - debit!.value;
  } else if (hasCredit) {
    const sign = resolveSignFromContext(credit!, description, 1);
    amount = sign * credit!.value;
  } else if (hasDebit) {
    const sign = resolveSignFromContext(debit!, description, -1);
    amount = sign * debit!.value;
  } else {
    return null;
  }

  return amount;
}

function resolveSignFromContext(token: AmountToken, description: string, defaultSign: number): number {
  if (token.sign !== 0) {
    return token.sign;
  }

  if (NEGATIVE_HINT_PATTERN.test(description)) {
    return -1;
  }

  if (POSITIVE_HINT_PATTERN.test(description)) {
    return 1;
  }

  return defaultSign;
}

function deriveReferenceNumber(description: string, index: number): string {
  const cleaned = description.replace(/[,|]/g, ' ');
  const match = cleaned.match(/\b\d{9,}\b(?!\s*(?:AM|PM))/);
  if (match) {
    return match[0];
  }
  return `SC-${index + 1}`;
}

function parseAmountToken(rawToken: string): AmountToken | null {
  const raw = rawToken.trim();
  const cleaned = raw
    .replace(/^(?:INR|RS\.?|₹)\s*/i, '')
    .replace(/CR$/i, '')
    .replace(/DR$/i, '')
    .trim();

  let token = cleaned.replace(/[,\s]/g, '');
  let sign = 0;
  if (/^\(.+\)$/.test(token)) {
    sign = -1;
    token = token.slice(1, -1);
  }
  if (token.startsWith('-')) {
    sign = -1;
    token = token.slice(1);
  }
  if (token === '' || token === '-' || token === '--') {
    return null;
  }

  const numeric = parseFloat(token);
  if (Number.isNaN(numeric)) {
    return null;
  }

  if (/DR$/i.test(rawToken)) {
    sign = -1;
  }
  if (/CR$/i.test(rawToken)) {
    sign = 1;
  }

  return {
    raw: rawToken,
    value: numeric,
    sign
  };
}

function isValidIsoDate(iso: string): boolean {
  const date = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const [year, month, day] = iso.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

interface AmountToken {
  raw: string;
  value: number;
  sign: number; // -1, 0, +1 (0 = unknown)
}

function matchLeadingDate(text: string): LeadingDateMatch | null {
  const prefixMatch = text.match(/^(?:\*|\d+|[ivxlcdm]+|\([^)]+\))[\.)-]?\s+/i);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const candidate = prefix ? text.slice(prefix.length) : text;

  const textual = candidate.match(TEXTUAL_DATE_PATTERN);
  if (textual) {
    const iso = textualMatchToIso(textual);
    if (iso) {
      return { raw: prefix + textual[0], isoDate: iso };
    }
  }

  const hybrid = candidate.match(HYBRID_TEXTUAL_DATE_PATTERN);
  if (hybrid) {
    const iso = textualMatchToIso(hybrid);
    if (iso) {
      return { raw: prefix + hybrid[0], isoDate: iso };
    }
  }

  const numeric = candidate.match(NUMERIC_DATE_PATTERN);
  if (numeric) {
    const iso = numericMatchToIso(numeric);
    if (iso) {
      return { raw: prefix + numeric[0], isoDate: iso };
    }
  }

  return null;
}

function textualMatchToIso(match: RegExpMatchArray): string | null {
  const day = match[1];
  const monthName = capitalise(match[2]);
  const yearRaw = match[3];
  const month = MONTH_MAP[monthName];
  if (!month) {
    return null;
  }

  const numericYear = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  const dayPadded = day.padStart(2, '0');
  const iso = `${numericYear}-${month}-${dayPadded}`;
  return isValidIsoDate(iso) ? iso : null;
}

function numericMatchToIso(match: RegExpMatchArray): string | null {
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const yearRaw = match[3];
  const numericYear = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  const iso = `${numericYear}-${month}-${day}`;
  return isValidIsoDate(iso) ? iso : null;
}

function capitalise(token: string): string {
  if (!token) {
    return token;
  }
  return token.charAt(0).toUpperCase() + token.substring(1, 3).toLowerCase();
}

function findFirstTransactionIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || PAGE_FOOTER_PATTERN.test(line) || NON_TRANSACTION_HINTS.test(line)) {
      continue;
    }
    if (matchLeadingDate(line)) {
      return i;
    }
    if (i < lines.length - 1) {
      const combined = `${line} ${lines[i + 1]}`;
      if (matchLeadingDate(combined)) {
        return i;
      }
    }
  }
  return -1;
}
