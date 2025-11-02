/**
 * useApiKey Hook
 * Custom hook for managing API key state and validation
 */

import { useState, useCallback } from 'react';
import { getApiKey, setApiKey as saveApiKey, removeApiKey } from '../utils/storageUtils';
import { validateApiKeyFormat } from '../config/llm.config';
import type { LLMProviderId } from '../config/llm.config';

type ApiKeyStatus = 'checking' | 'valid' | 'invalid' | 'missing';

interface UseApiKeyReturn {
  apiKeyStatus: ApiKeyStatus;
  hasApiKey: boolean;
  validateAndSaveKey: (provider: LLMProviderId, key: string) => boolean;
  removeKey: (provider: LLMProviderId) => void;
  checkApiKey: (provider: LLMProviderId) => void;
}

/**
 * Hook for managing API key state
 */
export const useApiKey = (): UseApiKeyReturn => {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('checking');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  /**
   * Check if API key exists for a provider
   */
  const checkApiKey = useCallback((provider: LLMProviderId) => {
    setApiKeyStatus('checking');
    const key = getApiKey(provider);

    if (key) {
      const isValid = validateApiKeyFormat(provider, key);
      setApiKeyStatus(isValid ? 'valid' : 'invalid');
      setHasApiKey(isValid);
    } else {
      setApiKeyStatus('missing');
      setHasApiKey(false);
    }
  }, []);

  /**
   * Validate and save API key
   */
  const validateAndSaveKey = useCallback((provider: LLMProviderId, key: string): boolean => {
    const isValid = validateApiKeyFormat(provider, key);

    if (isValid) {
      const saved = saveApiKey(provider, key);
      if (saved) {
        setApiKeyStatus('valid');
        setHasApiKey(true);
        return true;
      }
    }

    setApiKeyStatus('invalid');
    setHasApiKey(false);
    return false;
  }, []);

  /**
   * Remove API key
   */
  const removeKey = useCallback((provider: LLMProviderId) => {
    removeApiKey(provider);
    setApiKeyStatus('missing');
    setHasApiKey(false);
  }, []);

  return {
    apiKeyStatus,
    hasApiKey,
    validateAndSaveKey,
    removeKey,
    checkApiKey,
  };
};
