/**
 * String Formatting Utilities
 * Helper functions for string manipulation and formatting
 */

/**
 * Clean string for use in filenames (remove special characters)
 */
export const cleanForFilename = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateStr: string): Date | null => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // Verify the date components match (to catch invalid dates like Feb 30)
    const [year, month, day] = dateStr.split('-').map(Number);
    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
};

/**
 * Validate date string format (YYYY-MM-DD)
 */
export const isValidDateFormat = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = parseDate(dateStr);
  return date !== null;
};

/**
 * Escape CSV field
 */
export const escapeCsvField = (field: string): string => {
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

/**
 * Remove extra whitespace
 */
export const normalizeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Extract numbers from string
 */
export const extractNumbers = (str: string): number[] => {
  const matches = str.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};
