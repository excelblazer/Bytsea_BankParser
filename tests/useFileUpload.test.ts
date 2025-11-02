/**
 * Unit Tests for useFileUpload Hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../hooks/useFileUpload';

describe('useFileUpload', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it('should handle valid file selection', () => {
    const { result } = renderHook(() => useFileUpload());
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.handleFileSelect(validFile);
    });

    expect(result.current.selectedFile).toBe(validFile);
    expect(result.current.fileName).toBe('test.pdf');
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(true);
  });

  it('should reject invalid file type', () => {
    const { result } = renderHook(() => useFileUpload());
    const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' });

    act(() => {
      result.current.handleFileSelect(invalidFile);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.error).toBeDefined();
    expect(result.current.isValid).toBe(false);
  });

  it('should clear file', () => {
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.handleFileSelect(file);
    });

    expect(result.current.selectedFile).toBe(file);

    act(() => {
      result.current.clearFile();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useFileUpload());
    const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' });

    act(() => {
      result.current.handleFileSelect(invalidFile);
    });

    expect(result.current.error).toBeDefined();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
