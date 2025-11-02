/**
 * useDocumentParser Hook
 * Custom hook for managing document parsing state and logic
 */

import { useState, useCallback } from 'react';
import { ParsedTransaction } from '../types';
import type { DocumentTypeId } from '../config/llm.config';
import type { LLMProviderId } from '../config/llm.config';

interface ParseProgress {
  status: string;
  progress: number;
}

type ParsingMethod = LLMProviderId | 'ocr' | null;

interface UseDocumentParserReturn {
  isLoading: boolean;
  error: string | null;
  transactions: ParsedTransaction[];
  progress: ParseProgress | null;
  parsingMethod: ParsingMethod;
  documentType: DocumentTypeId | null;
  setParsingMethod: (method: ParsingMethod) => void;
  setDocumentType: (type: DocumentTypeId | null) => void;
  setTransactions: (transactions: ParsedTransaction[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: ParseProgress | null) => void;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Hook for managing document parsing state
 */
export const useDocumentParser = (): UseDocumentParserReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [parsingMethod, setParsingMethod] = useState<ParsingMethod>(null);
  const [documentType, setDocumentType] = useState<DocumentTypeId | null>(null);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
    }
  }, []);

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setTransactions([]);
    setError(null);
    setProgress(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    transactions,
    progress,
    parsingMethod,
    documentType,
    setParsingMethod,
    setDocumentType,
    setTransactions,
    setError,
    setLoading,
    setProgress,
    clearResults,
    clearError,
  };
};
