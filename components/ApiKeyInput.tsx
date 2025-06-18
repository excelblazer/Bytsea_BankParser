import React, { useState, useEffect } from 'react';
import { setApiKey } from '../services/geminiService';

interface ApiKeyInputProps {
  onKeySet: (isSet: boolean) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySet }) => {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    // Check if API key exists in local storage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKeyState('•'.repeat(16)); // Show placeholder dots for security
      setIsSaved(true);
      onKeySet(true);
    }
  }, [onKeySet]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setIsSaved(true);
      onKeySet(true);
      setApiKeyState('•'.repeat(16)); // Replace with dots after saving
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKeyState('');
    setIsSaved(false);
    onKeySet(false);
  };

  return (
    <div className="w-full max-w-md mx-auto my-8 p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Google Gemini API Key</h2>
      
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
          Enter your Google Gemini API Key:
        </label>
        <input
          type={isSaved ? "password" : "text"}
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKeyState(e.target.value)}
          placeholder={isSaved ? "API key saved" : "Enter API key..."}
          className="w-full p-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSaved}
        />
      </div>
      
      <div className="flex justify-between">
        {!isSaved ? (
          <button
            onClick={handleSaveKey}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save API Key
          </button>
        ) : (
          <button
            onClick={handleClearKey}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-colors duration-200"
          >
            Clear API Key
          </button>
        )}
        
        <a
          href="https://ai.google.dev/tutorials/setup"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
        >
          Get an API Key
        </a>
      </div>
      
      <p className="mt-4 text-xs text-slate-400">
        Your API key is stored only in your browser's local storage and never sent to our servers.
        It is used only to communicate directly with Google's Gemini API. You are open to investigate the code and see how it works by navigating to the <a href="https://github.com/excelblazer/Bytsea-BankParser" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">repository</a>.
      </p>
    </div>
  );
};

export default ApiKeyInput;
