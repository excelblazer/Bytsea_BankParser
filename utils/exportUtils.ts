/**
 * Export Utilities
 * Helper functions for exporting transactions to CSV and Excel formats
 */

import { ParsedTransaction } from '../types';
import { cleanForFilename } from './stringUtils';
import { getStatementPeriod, getStatementCurrency } from './storageUtils';

// For XLSX, we rely on the global XLSX object from the CDN script
declare var XLSX: any;

/**
 * Generate export filename based on transaction data
 */
export const generateExportFileName = (
  transactions: ParsedTransaction[],
  extension: 'csv' | 'xlsx'
): string => {
  if (transactions.length === 0) {
    return `statement.${extension}`;
  }

  const clientName = transactions[0]?.clientName || 'Client';
  const bankName = transactions[0]?.bankName || 'Bank';
  const period = getStatementPeriod() || 'Statement';
  const currency = getStatementCurrency() || '';

  // Clean up names for filename
  const cleanClientName = cleanForFilename(clientName);
  const cleanBankName = cleanForFilename(bankName);
  const cleanPeriod = cleanForFilename(period);

  // Include currency in the filename if available
  const currencyPart = currency ? `-${currency}` : '';

  return `${cleanClientName}-${cleanBankName}-${cleanPeriod}${currencyPart}.${extension}`;
};

/**
 * Export transactions to CSV format
 */
export const exportToCSV = (transactions: ParsedTransaction[]): void => {
  if (transactions.length === 0) {
    console.warn('No transactions to export');
    return;
  }

  const currency = getStatementCurrency();
  const amountHeader = currency ? `Amount (${currency})` : 'Amount';

  // Create CSV headers
  const headers = ['Transaction Date', 'Description', 'Reference Number', amountHeader];
  const csvHeader = headers.join(',') + '\n';

  // Create CSV rows
  const csvRows = transactions
    .map((t) => {
      const date = t.transactionDate;
      const description = `"${t.description.replace(/"/g, '""')}"`;
      const reference = `"${t.referenceNumber.replace(/"/g, '""')}"`;
      const amount = t.amount;
      return `${date},${description},${reference},${amount}`;
    })
    .join('\n');

  const csvContent = csvHeader + csvRows;

  // Create and download blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = generateExportFileName(transactions, 'csv');
  downloadBlob(blob, filename);
};

/**
 * Export transactions to Excel format
 */
export const exportToExcel = (transactions: ParsedTransaction[]): void => {
  if (transactions.length === 0) {
    console.warn('No transactions to export');
    return;
  }

  const currency = getStatementCurrency();
  const amountHeader = currency ? `Amount (${currency})` : 'Amount';

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create metadata sheet
  const bankName = transactions[0].bankName;
  const clientName = transactions[0].clientName;
  const period = getStatementPeriod() || 'N/A';
  const currencyValue = currency || 'Not detected';

  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['Statement Information'],
    ['Bank', bankName],
    ['Client', clientName],
    ['Period', period],
    ['Currency', currencyValue],
    ['Total Transactions', transactions.length],
  ]);

  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

  // Create transactions sheet
  const transactionData = transactions.map((t) => ({
    'Transaction Date': t.transactionDate,
    Description: t.description,
    'Reference Number': t.referenceNumber,
    [amountHeader]: t.amount,
  }));

  const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');

  // Download file
  const filename = generateExportFileName(transactions, 'xlsx');
  XLSX.writeFile(workbook, filename);
};

/**
 * Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Calculate transaction statistics
 */
export interface TransactionStats {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  averageAmount: number;
  largestDebit: number;
  largestCredit: number;
}

export const calculateStats = (transactions: ParsedTransaction[]): TransactionStats => {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalDebits: 0,
      totalCredits: 0,
      netAmount: 0,
      averageAmount: 0,
      largestDebit: 0,
      largestCredit: 0,
    };
  }

  const debits = transactions.filter((t) => t.amount < 0);
  const credits = transactions.filter((t) => t.amount > 0);

  const totalDebits = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalCredits - totalDebits;
  const averageAmount =
    transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;

  const largestDebit = debits.length > 0 ? Math.min(...debits.map((t) => t.amount)) : 0;
  const largestCredit = credits.length > 0 ? Math.max(...credits.map((t) => t.amount)) : 0;

  return {
    totalTransactions: transactions.length,
    totalDebits,
    totalCredits,
    netAmount,
    averageAmount,
    largestDebit,
    largestCredit,
  };
};
