/**
 * Unit Tests for File Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFileType,
  validateFileSize,
  validateFile,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isPdfFile,
  isDocumentFile,
} from '../utils/fileUtils';
import { MAX_FILE_SIZE } from '../config/app.config';

describe('fileUtils', () => {
  describe('validateFileType', () => {
    it('should validate supported PDF files', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate supported DOCX files', () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
    });

    it('should validate supported image files', () => {
      const jpegFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['content'], 'test.webp', { type: 'image/webp' });

      expect(validateFileType(jpegFile).isValid).toBe(true);
      expect(validateFileType(pngFile).isValid).toBe(true);
      expect(validateFileType(webpFile).isValid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/exe' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFileSize', () => {
    it('should validate files within size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.txt', { type: 'text/plain' });
      const result = validateFileSize(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeContent = 'a'.repeat(MAX_FILE_SIZE + 1);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const result = validateFileSize(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFile', () => {
    it('should validate both type and size', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
    });

    it('should fail on invalid type', () => {
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' });
      const result = validateFile(invalidFile);
      expect(result.isValid).toBe(false);
    });

    it('should fail on invalid size', () => {
      const largeContent = 'a'.repeat(MAX_FILE_SIZE + 1);
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateFile(largeFile);
      expect(result.isValid).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('test.pdf')).toBe('pdf');
      expect(getFileExtension('document.docx')).toBe('docx');
      expect(getFileExtension('image.jpeg')).toBe('jpeg');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('my.file.name.txt')).toBe('txt');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('TEST.PDF')).toBe('pdf');
    });
  });

  describe('type checking functions', () => {
    it('isImageFile should detect image types', () => {
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('image/webp')).toBe(true);
      expect(isImageFile('application/pdf')).toBe(false);
    });

    it('isPdfFile should detect PDF type', () => {
      expect(isPdfFile('application/pdf')).toBe(true);
      expect(isPdfFile('image/jpeg')).toBe(false);
      expect(isPdfFile('text/plain')).toBe(false);
    });

    it('isDocumentFile should detect document types', () => {
      expect(isDocumentFile('text/plain')).toBe(true);
      expect(
        isDocumentFile('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).toBe(true);
      expect(isDocumentFile('application/pdf')).toBe(false);
      expect(isDocumentFile('image/jpeg')).toBe(false);
    });
  });
});
