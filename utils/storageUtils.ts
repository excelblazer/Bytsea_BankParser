/**
 * Storage Utilities
 * Helper functions for localStorage operations
 */

import { STORAGE_KEYS } from '../config/app.config';

/**
 * Safely get item from localStorage
 */
export const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
};

/**
 * Safely set item in localStorage
 */
export const setStorageItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Safely remove item from localStorage
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get API key for a specific provider
 */
export const getApiKey = (provider: 'gemini' | 'openai' | 'anthropic'): string | null => {
  const keyMap = {
    gemini: STORAGE_KEYS.GEMINI_API_KEY,
    openai: STORAGE_KEYS.OPENAI_API_KEY,
    anthropic: STORAGE_KEYS.ANTHROPIC_API_KEY,
  };
  return getStorageItem(keyMap[provider]);
};

/**
 * Set API key for a specific provider
 */
export const setApiKey = (provider: 'gemini' | 'openai' | 'anthropic', apiKey: string): boolean => {
  const keyMap = {
    gemini: STORAGE_KEYS.GEMINI_API_KEY,
    openai: STORAGE_KEYS.OPENAI_API_KEY,
    anthropic: STORAGE_KEYS.ANTHROPIC_API_KEY,
  };
  return setStorageItem(keyMap[provider], apiKey);
};

/**
 * Remove API key for a specific provider
 */
export const removeApiKey = (provider: 'gemini' | 'openai' | 'anthropic'): boolean => {
  const keyMap = {
    gemini: STORAGE_KEYS.GEMINI_API_KEY,
    openai: STORAGE_KEYS.OPENAI_API_KEY,
    anthropic: STORAGE_KEYS.ANTHROPIC_API_KEY,
  };
  return removeStorageItem(keyMap[provider]);
};

/**
 * Get model preference for a specific provider
 */
export const getModelPreference = (provider: 'gemini' | 'openai' | 'anthropic'): string | null => {
  const keyMap = {
    gemini: STORAGE_KEYS.GEMINI_MODEL,
    openai: STORAGE_KEYS.OPENAI_MODEL,
    anthropic: STORAGE_KEYS.ANTHROPIC_MODEL,
  };
  return getStorageItem(keyMap[provider]);
};

/**
 * Set model preference for a specific provider
 */
export const setModelPreference = (
  provider: 'gemini' | 'openai' | 'anthropic',
  model: string
): boolean => {
  const keyMap = {
    gemini: STORAGE_KEYS.GEMINI_MODEL,
    openai: STORAGE_KEYS.OPENAI_MODEL,
    anthropic: STORAGE_KEYS.ANTHROPIC_MODEL,
  };
  return setStorageItem(keyMap[provider], model);
};

/**
 * Check if privacy policy has been accepted
 */
export const isPrivacyPolicyAccepted = (): boolean => {
  return getStorageItem(STORAGE_KEYS.PRIVACY_POLICY_ACCEPTED) === 'true';
};

/**
 * Set privacy policy acceptance status
 */
export const setPrivacyPolicyAccepted = (accepted: boolean): boolean => {
  return setStorageItem(STORAGE_KEYS.PRIVACY_POLICY_ACCEPTED, String(accepted));
};

/**
 * Get statement period from storage
 */
export const getStatementPeriod = (): string | null => {
  return getStorageItem(STORAGE_KEYS.STATEMENT_PERIOD);
};

/**
 * Set statement period in storage
 */
export const setStatementPeriod = (period: string): boolean => {
  return setStorageItem(STORAGE_KEYS.STATEMENT_PERIOD, period);
};

/**
 * Get statement currency from storage
 */
export const getStatementCurrency = (): string | null => {
  return getStorageItem(STORAGE_KEYS.STATEMENT_CURRENCY);
};

/**
 * Set statement currency in storage
 */
export const setStatementCurrency = (currency: string): boolean => {
  return setStorageItem(STORAGE_KEYS.STATEMENT_CURRENCY, currency);
};

/**
 * Clear all app-related storage
 */
export const clearAppStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStorageItem(key);
  });
};
