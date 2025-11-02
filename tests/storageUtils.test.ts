/**
 * Unit Tests for Storage Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isStorageAvailable,
  getApiKey,
  setApiKey,
  removeApiKey,
  getStatementPeriod,
  setStatementPeriod,
  getStatementCurrency,
  setStatementCurrency,
  clearAppStorage,
} from '../utils/storageUtils';

describe('storageUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('basic storage operations', () => {
    it('should set and get items', () => {
      setStorageItem('test-key', 'test-value');
      expect(getStorageItem('test-key')).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      expect(getStorageItem('non-existent')).toBeNull();
    });

    it('should remove items', () => {
      setStorageItem('test-key', 'test-value');
      removeStorageItem('test-key');
      expect(getStorageItem('test-key')).toBeNull();
    });

    it('should check if storage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe('API key management', () => {
    it('should store and retrieve Gemini API key', () => {
      setApiKey('gemini', 'AIza-test-key-123');
      expect(getApiKey('gemini')).toBe('AIza-test-key-123');
    });

    it('should store and retrieve OpenAI API key', () => {
      setApiKey('openai', 'sk-test-key-456');
      expect(getApiKey('openai')).toBe('sk-test-key-456');
    });

    it('should store and retrieve Anthropic API key', () => {
      setApiKey('anthropic', 'sk-ant-test-key-789');
      expect(getApiKey('anthropic')).toBe('sk-ant-test-key-789');
    });

    it('should remove API keys', () => {
      setApiKey('gemini', 'test-key');
      removeApiKey('gemini');
      expect(getApiKey('gemini')).toBeNull();
    });

    it('should handle multiple API keys independently', () => {
      setApiKey('gemini', 'gemini-key');
      setApiKey('openai', 'openai-key');
      
      expect(getApiKey('gemini')).toBe('gemini-key');
      expect(getApiKey('openai')).toBe('openai-key');
      
      removeApiKey('gemini');
      expect(getApiKey('gemini')).toBeNull();
      expect(getApiKey('openai')).toBe('openai-key');
    });
  });

  describe('statement metadata storage', () => {
    it('should store and retrieve statement period', () => {
      setStatementPeriod('January 2025');
      expect(getStatementPeriod()).toBe('January 2025');
    });

    it('should store and retrieve statement currency', () => {
      setStatementCurrency('USD');
      expect(getStatementCurrency()).toBe('USD');
    });

    it('should return null for missing metadata', () => {
      expect(getStatementPeriod()).toBeNull();
      expect(getStatementCurrency()).toBeNull();
    });
  });

  describe('clearAppStorage', () => {
    it('should clear all app-related storage', () => {
      setApiKey('gemini', 'test-key');
      setStatementPeriod('January 2025');
      setStatementCurrency('USD');

      clearAppStorage();

      expect(getApiKey('gemini')).toBeNull();
      expect(getStatementPeriod()).toBeNull();
      expect(getStatementCurrency()).toBeNull();
    });
  });
});
