/**
 * useFileUpload Hook
 * Custom hook for managing file upload state and validation
 */

import { useState, useCallback } from 'react';
import { validateFile, ValidationResult } from '../utils/fileUtils';

interface UseFileUploadReturn {
  selectedFile: File | null;
  fileName: string | null;
  error: string | null;
  isValid: boolean;
  handleFileSelect: (file: File) => void;
  clearFile: () => void;
  clearError: () => void;
}

/**
 * Hook for managing file upload state
 */
export const useFileUpload = (): UseFileUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);

  /**
   * Handle file selection with validation
   */
  const handleFileSelect = useCallback((file: File) => {
    const validation: ValidationResult = validateFile(file);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      setIsValid(false);
      setSelectedFile(null);
      setFileName(null);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setError(null);
    setIsValid(true);
  }, []);

  /**
   * Clear selected file
   */
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFileName(null);
    setError(null);
    setIsValid(false);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectedFile,
    fileName,
    error,
    isValid,
    handleFileSelect,
    clearFile,
    clearError,
  };
};
