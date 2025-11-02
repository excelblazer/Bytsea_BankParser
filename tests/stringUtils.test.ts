/**
 * Unit Tests for String Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  cleanForFilename,
  capitalizeWords,
  truncate,
  formatCurrency,
  formatDate,
  parseDate,
  isValidDateFormat,
  escapeCsvField,
  normalizeWhitespace,
  extractNumbers,
  isEmpty,
} from '../utils/stringUtils';

describe('stringUtils', () => {
  describe('cleanForFilename', () => {
    it('should remove special characters', () => {
      expect(cleanForFilename('Hello World!')).toBe('HelloWorld');
      expect(cleanForFilename('Client@Name#123')).toBe('ClientName123');
      expect(cleanForFilename('test-file.pdf')).toBe('testfilepdf');
    });

    it('should preserve alphanumeric characters', () => {
      expect(cleanForFilename('ABC123xyz')).toBe('ABC123xyz');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('JOHN DOE')).toBe('John Doe');
      expect(capitalizeWords('test case')).toBe('Test Case');
    });

    it('should handle single words', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      expect(truncate(longString, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(100.5)).toBe('$100.50');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toContain('100');
      expect(formatCurrency(100, 'GBP')).toContain('100');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-50.25);
      expect(result).toContain('50.25');
      expect(result).toContain('-');
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('2025-01-15');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2025-03-05');
      expect(formatDate(date)).toBe('2025-03-05');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const date = parseDate('2025-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2025);
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('invalid-date')).toBeNull();
      expect(parseDate('2025-13-45')).toBeNull();
    });
  });

  describe('isValidDateFormat', () => {
    it('should validate YYYY-MM-DD format', () => {
      expect(isValidDateFormat('2025-01-15')).toBe(true);
      expect(isValidDateFormat('2025-12-31')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidDateFormat('15-01-2025')).toBe(false);
      expect(isValidDateFormat('2025/01/15')).toBe(false);
      expect(isValidDateFormat('invalid')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidDateFormat('2025-13-01')).toBe(false);
      expect(isValidDateFormat('2025-02-30')).toBe(false);
    });
  });

  describe('escapeCsvField', () => {
    it('should escape fields with commas', () => {
      expect(escapeCsvField('Hello, World')).toBe('"Hello, World"');
    });

    it('should escape fields with quotes', () => {
      expect(escapeCsvField('Say "Hello"')).toBe('"Say ""Hello"""');
    });

    it('should escape fields with newlines', () => {
      expect(escapeCsvField('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('should not escape simple fields', () => {
      expect(escapeCsvField('SimpleField')).toBe('SimpleField');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should remove extra whitespace', () => {
      expect(normalizeWhitespace('  Hello   World  ')).toBe('Hello World');
      expect(normalizeWhitespace('Multiple   Spaces')).toBe('Multiple Spaces');
    });

    it('should handle tabs and newlines', () => {
      expect(normalizeWhitespace('Hello\t\nWorld')).toBe('Hello World');
    });
  });

  describe('extractNumbers', () => {
    it('should extract positive numbers', () => {
      expect(extractNumbers('Price: 123.45')).toEqual([123.45]);
      expect(extractNumbers('Items: 10, 20, 30')).toEqual([10, 20, 30]);
    });

    it('should extract negative numbers', () => {
      expect(extractNumbers('Balance: -50.25')).toEqual([-50.25]);
    });

    it('should return empty array if no numbers', () => {
      expect(extractNumbers('No numbers here')).toEqual([]);
    });
  });

  describe('isEmpty', () => {
    it('should detect empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should detect non-empty strings', () => {
      expect(isEmpty('Hello')).toBe(false);
      expect(isEmpty('  text  ')).toBe(false);
    });
  });
});
