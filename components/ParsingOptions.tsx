import React, { useState, useEffect } from 'react';
import { FaGoogle, FaRobot, FaCheck, FaBolt } from 'react-icons/fa';
import { SiOpenai, SiAnthropic } from 'react-icons/si';
import MultiProviderApiKeyInput from './MultiProviderApiKeyInput';
import { LLMProvider } from '../services/llmService';

interface ParsingOptionsProps {
  onSelectOption: (option: LLMProvider | 'ocr') => void;
  onSelectDocumentType: (type: 'bank' | 'creditcard' | 'ledger') => void;
  apiKeyStatus: 'checking' | 'ok' | 'missing';
  onApiKeySet: (isSet: boolean) => void;
  selectedProvider: LLMProvider | null;
  onProviderChange: (provider: LLMProvider) => void;
}

const ParsingOptions: React.FC<ParsingOptionsProps> = ({
  onSelectOption,
  onSelectDocumentType,
  apiKeyStatus,
  onApiKeySet,
  selectedProvider,
  onProviderChange
}) => {
  const [selectedOption, setSelectedOption] = useState<LLMProvider | 'ocr' | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<'bank' | 'creditcard' | 'ledger' | null>(null);

  // When API key is set, automatically select the current provider
  useEffect(() => {
    if (apiKeyStatus === 'ok' && selectedProvider) {
      setSelectedOption(selectedProvider);
    }
  }, [apiKeyStatus, selectedProvider]);

  const handleSelectLLM = () => {
    if (selectedProvider) {
      setSelectedOption(selectedProvider);
      onSelectOption(selectedProvider);
    }
  };

  const handleSelectOcr = () => {
    setSelectedOption('ocr');
    onSelectOption('ocr');
  };

  const handleDocTypeSelect = (type: 'bank' | 'creditcard' | 'ledger') => {
    setSelectedDocType(type);
    onSelectDocumentType(type);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Choose Your Parsing Method</h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* API Integration Option */}
        <div
          className={`flex-1 p-6 bg-slate-800 rounded-xl shadow-xl border cursor-pointer transition-all duration-200 ${
            selectedOption && selectedOption !== 'ocr'
              ? 'border-blue-500 ring-2 ring-blue-500/50'
              : 'border-slate-700 hover:border-slate-500'
          }`}
          onClick={handleSelectLLM}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">AI API Integration</h3>
            {selectedOption && selectedOption !== 'ocr' && (
              <span className="bg-blue-500/20 text-blue-400 p-1 rounded-full">
                <FaCheck size={14} />
              </span>
            )}
          </div>

          <p className="text-slate-300 mb-6">
            Use your own AI API keys to process documents privately and securely.
          </p>

          <div className="space-y-4">
            {/* Provider Options */}
            <div className={`p-3 rounded-lg flex items-center gap-3 ${selectedProvider === 'gemini' && apiKeyStatus === 'ok' ? 'bg-blue-600/20 border border-blue-600/50' : 'bg-slate-700'}`}>
              <FaGoogle className="text-blue-400" size={20} />
              <span className="text-white">Google Gemini</span>
              {selectedProvider === 'gemini' && apiKeyStatus === 'ok' && <FaCheck className="ml-auto text-green-400" size={14} />}
            </div>

            <div className={`p-3 rounded-lg flex items-center gap-3 ${selectedProvider === 'openai' && apiKeyStatus === 'ok' ? 'bg-green-600/20 border border-green-600/50' : 'bg-slate-700'}`}>
              <SiOpenai className="text-green-400" size={20} />
              <span className="text-white">OpenAI</span>
              {selectedProvider === 'openai' && apiKeyStatus === 'ok' && <FaCheck className="ml-auto text-green-400" size={14} />}
            </div>

            <div className={`p-3 rounded-lg flex items-center gap-3 ${selectedProvider === 'anthropic' && apiKeyStatus === 'ok' ? 'bg-orange-600/20 border border-orange-600/50' : 'bg-slate-700'}`}>
              <SiAnthropic className="text-orange-400" size={20} />
              <span className="text-white">Anthropic Claude</span>
              {selectedProvider === 'anthropic' && apiKeyStatus === 'ok' && <FaCheck className="ml-auto text-green-400" size={14} />}
            </div>
          </div>

          {apiKeyStatus === 'missing' && (
            <div className="mt-6">
              <MultiProviderApiKeyInput
                selectedProvider={selectedProvider}
                onKeySet={onApiKeySet}
                onProviderChange={onProviderChange}
              />
            </div>
          )}
        </div>

        {/* OCR Client-Side Option */}
        <div
          className={`flex-1 p-6 bg-slate-800 rounded-xl shadow-xl border cursor-pointer transition-all duration-200 ${
            selectedOption === 'ocr'
              ? 'border-purple-500 ring-2 ring-purple-500/50'
              : 'border-slate-700 hover:border-slate-500'
          }`}
          onClick={handleSelectOcr}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Client-Side OCR</h3>
            {selectedOption === 'ocr' && (
              <span className="bg-purple-500/20 text-purple-400 p-1 rounded-full">
                <FaCheck size={14} />
              </span>
            )}
          </div>

          <p className="text-slate-300 mb-6">
            Process documents directly in your browser using advanced OCR technology. No API keys required.
          </p>

          <div className="p-4 rounded-lg bg-slate-700 flex items-center gap-4">
            <div className="p-3 bg-purple-600/30 rounded-full">
              <FaRobot className="text-purple-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">OCR Processing</h4>
              <div className="flex items-center">
                <span className="flex items-center text-green-400 text-sm">
                  <FaBolt className="mr-2" size={12} />
                  Always Available
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">How it works:</h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Documents are processed entirely in your browser</li>
              <li>No data is sent to external servers</li>
              <li>Supports PDF, images, and text documents</li>
              <li>Processing time depends on document size and complexity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document Type Selection - Appears after parsing method is selected */}
      {selectedOption && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-center text-blue-400 mb-4">Select Document Type</h3>
          
          <div className="flex flex-wrap justify-center gap-4">
            {/* Bank Statement Option */}
            <div 
              className={`p-4 w-56 bg-slate-800 rounded-xl shadow border cursor-pointer transition-all duration-200 ${
                selectedDocType === 'bank' 
                  ? 'border-green-500 ring-2 ring-green-500/50' 
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => handleDocTypeSelect('bank')}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Bank Statement</h4>
                {selectedDocType === 'bank' && (
                  <span className="bg-green-500/20 text-green-400 p-1 rounded-full">
                    <FaCheck size={12} />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Process regular bank account statements with deposits and withdrawals
              </p>
            </div>
            
            {/* Credit Card Statement Option */}
            <div 
              className={`p-4 w-56 bg-slate-800 rounded-xl shadow border cursor-pointer transition-all duration-200 ${
                selectedDocType === 'creditcard' 
                  ? 'border-blue-500 ring-2 ring-blue-500/50' 
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => handleDocTypeSelect('creditcard')}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Credit Card</h4>
                {selectedDocType === 'creditcard' && (
                  <span className="bg-blue-500/20 text-blue-400 p-1 rounded-full">
                    <FaCheck size={12} />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Process credit card statements with purchases and payments
              </p>
            </div>
            
            {/* Ledger Option */}
            <div 
              className={`p-4 w-56 bg-slate-800 rounded-xl shadow border cursor-pointer transition-all duration-200 ${
                selectedDocType === 'ledger' 
                  ? 'border-purple-500 ring-2 ring-purple-500/50' 
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => handleDocTypeSelect('ledger')}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Accounting Ledger</h4>
                {selectedDocType === 'ledger' && (
                  <span className="bg-purple-500/20 text-purple-400 p-1 rounded-full">
                    <FaCheck size={12} />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Process accounting ledgers with debits and credits
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsingOptions;
