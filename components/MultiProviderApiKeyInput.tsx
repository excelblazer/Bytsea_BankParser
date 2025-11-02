import React, { useState, useEffect } from 'react';
import { LLMProvider, getProviderName, validateApiKey, testApiKey, getAvailableModels, getDefaultModel } from '../services/llmService';

interface MultiProviderApiKeyInputProps {
  selectedProvider: LLMProvider | null;
  onKeySet: (isSet: boolean) => void;
  onProviderChange: (provider: LLMProvider) => void;
}

const MultiProviderApiKeyInput: React.FC<MultiProviderApiKeyInputProps> = ({
  selectedProvider,
  onKeySet,
  onProviderChange
}) => {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (selectedProvider) {
      // Check if API key exists in local storage for this provider
      const storedKey = localStorage.getItem(`${selectedProvider}_api_key`);
      const storedModel = localStorage.getItem(`${selectedProvider}_model`) || getDefaultModel(selectedProvider);
      
      if (storedKey) {
        setApiKeyState('•'.repeat(16)); // Show placeholder dots for security
        setIsSaved(true);
        onKeySet(true);
      } else {
        setApiKeyState('');
        setIsSaved(false);
        onKeySet(false);
      }
      
      setSelectedModel(storedModel);
      setTestResult(null);
    }
  }, [selectedProvider, onKeySet]);

  const handleProviderSelect = (provider: LLMProvider) => {
    onProviderChange(provider);
  };

  const handleSaveKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;

    // Validate API key format
    if (!validateApiKey(selectedProvider, apiKey.trim())) {
      setTestResult('error');
      return;
    }

    // Test the API key
    setIsTesting(true);
    setTestResult(null);

    try {
      const isValid = await testApiKey({
        provider: selectedProvider,
        model: selectedModel || getDefaultModel(selectedProvider),
        apiKey: apiKey.trim()
      });

      if (isValid) {
        localStorage.setItem(`${selectedProvider}_api_key`, apiKey.trim());
        localStorage.setItem(`${selectedProvider}_model`, selectedModel || getDefaultModel(selectedProvider));
        setIsSaved(true);
        onKeySet(true);
        setApiKeyState('•'.repeat(16));
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      console.error('API key test failed:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = () => {
    if (!selectedProvider) return;

    localStorage.removeItem(`${selectedProvider}_api_key`);
    setApiKeyState('');
    setIsSaved(false);
    onKeySet(false);
    setTestResult(null);
  };

  if (!selectedProvider) {
    return (
      <div className="w-full max-w-md mx-auto my-8 p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Select AI Provider</h2>
        <p className="text-slate-300 text-center mb-6">Choose your preferred AI service provider:</p>

        <div className="space-y-3">
          <button
            onClick={() => handleProviderSelect('gemini')}
            className="w-full p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-3"
          >
            <span className="text-blue-400 text-xl">🤖</span>
            <span className="text-white">Google Gemini</span>
          </button>

          <button
            onClick={() => handleProviderSelect('openai')}
            className="w-full p-3 bg-green-600/20 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors flex items-center gap-3"
          >
            <span className="text-green-400 text-xl">🧠</span>
            <span className="text-white">OpenAI</span>
          </button>

          <button
            onClick={() => handleProviderSelect('anthropic')}
            className="w-full p-3 bg-orange-600/20 border border-orange-600/50 rounded-lg hover:bg-orange-600/30 transition-colors flex items-center gap-3"
          >
            <span className="text-orange-400 text-xl">🦙</span>
            <span className="text-white">Anthropic Claude</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-8 p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">
        {getProviderName(selectedProvider)} API Key
      </h2>

      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
          Enter your {getProviderName(selectedProvider)} API Key:
        </label>
        <input
          type={isSaved ? "password" : "text"}
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKeyState(e.target.value)}
          placeholder={`Enter ${selectedProvider} API key`}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTesting}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="modelSelect" className="block text-sm font-medium text-slate-300 mb-2">
          Select Model:
        </label>
        <select
          id="modelSelect"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTesting}
        >
          {getAvailableModels(selectedProvider).map((model) => (
            <option key={model} value={model} className="bg-slate-700">
              {model}
            </option>
          ))}
        </select>
      </div>

      {testResult === 'success' && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-md">
          <p className="text-green-300 text-sm">✓ API key validated successfully!</p>
        </div>
      )}

      {testResult === 'error' && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
          <p className="text-red-300 text-sm">✗ Invalid API key or connection failed. Please check your key.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSaveKey}
          disabled={!apiKey.trim() || isSaved || isTesting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          {isTesting ? 'Testing...' : isSaved ? 'Saved' : 'Save & Test Key'}
        </button>

        {isSaved && (
          <button
            onClick={handleClearKey}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-400">
        <p>• Your API key is stored locally in your browser</p>
        <p>• Keys are never sent to our servers</p>
        <p>• You can clear your key anytime</p>
      </div>
    </div>
  );
};

export default MultiProviderApiKeyInput;