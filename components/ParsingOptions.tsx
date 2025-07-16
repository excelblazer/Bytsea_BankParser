import React, { useState, useEffect } from 'react';
import { FaGoogle, FaRobot, FaCheck, FaSpinner, FaBolt } from 'react-icons/fa';
import { SiOpenai, SiAnthropic } from 'react-icons/si';
import ApiKeyInput from './ApiKeyInput';

interface ParsingOptionsProps {
  onSelectOption: (option: 'gemini' | 'ocr') => void;
  onSelectDocumentType: (type: 'bank' | 'creditcard' | 'ledger') => void;
  apiKeyStatus: 'checking' | 'ok' | 'missing';
  onApiKeySet: (isSet: boolean) => void;
  isOcrAvailable: boolean;
  checkOcrAvailability: () => Promise<boolean>;
}

const ParsingOptions: React.FC<ParsingOptionsProps> = ({
  onSelectOption,
  onSelectDocumentType,
  apiKeyStatus,
  onApiKeySet,
  isOcrAvailable,
  checkOcrAvailability
}) => {
  const [selectedOption, setSelectedOption] = useState<'gemini' | 'ocr' | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<'bank' | 'creditcard' | 'ledger' | null>(null);
  const [isCheckingOcr, setIsCheckingOcr] = useState<boolean>(false);

  // When API key is set, automatically select Gemini option
  useEffect(() => {
    if (apiKeyStatus === 'ok') {
      setSelectedOption('gemini');
    }
  }, [apiKeyStatus]);

  const handleSelectGemini = () => {
    setSelectedOption('gemini');
    onSelectOption('gemini');
    // Don't call setDocumentType here, as we want the user to explicitly select a document type
  };

  const handleSelectOcr = async () => {
    if (!isOcrAvailable && !isCheckingOcr) {
      setIsCheckingOcr(true);
      const available = await checkOcrAvailability();
      setIsCheckingOcr(false);
      if (available) {
        setSelectedOption('ocr');
        onSelectOption('ocr');
        // Don't call setDocumentType here, as we want the user to explicitly select a document type
      }
    } else if (isOcrAvailable) {
      setSelectedOption('ocr');
      onSelectOption('ocr');
      // Don't call setDocumentType here, as we want the user to explicitly select a document type
    }
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
            selectedOption === 'gemini' 
              ? 'border-blue-500 ring-2 ring-blue-500/50' 
              : 'border-slate-700 hover:border-slate-500'
          }`}
          onClick={handleSelectGemini}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">AI API Integration</h3>
            {selectedOption === 'gemini' && (
              <span className="bg-blue-500/20 text-blue-400 p-1 rounded-full">
                <FaCheck size={14} />
              </span>
            )}
          </div>
          
          <p className="text-slate-300 mb-6">
            Use your own AI API keys to process documents privately and securely.
          </p>
          
          <div className="space-y-4">
            {/* Gemini API Option */}
            <div className={`p-3 rounded-lg flex items-center gap-3 ${apiKeyStatus === 'ok' ? 'bg-blue-600/20 border border-blue-600/50' : 'bg-slate-700'}`}>
              <FaGoogle className="text-blue-400" size={20} />
              <span className="text-white">Google Gemini</span>
              {apiKeyStatus === 'ok' && <FaCheck className="ml-auto text-green-400" size={14} />}
            </div>
            
            {/* OpenAI (Coming Soon) */}
            <div className="p-3 rounded-lg bg-slate-700/50 flex items-center gap-3 opacity-60 cursor-not-allowed">
              <SiOpenai className="text-slate-400" size={20} />
              <span className="text-slate-300">OpenAI</span>
              <span className="ml-auto text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Coming Soon</span>
            </div>
            
            {/* Anthropic (Coming Soon) */}
            <div className="p-3 rounded-lg bg-slate-700/50 flex items-center gap-3 opacity-60 cursor-not-allowed">
              <SiAnthropic className="text-slate-400" size={20} />
              <span className="text-slate-300">Anthropic</span>
              <span className="ml-auto text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Coming Soon</span>
            </div>
          </div>
          
          {apiKeyStatus === 'missing' && (
            <div className="mt-6">
              <ApiKeyInput onKeySet={onApiKeySet} />
            </div>
          )}
        </div>
        
        {/* OCR Backend Option */}
        <div 
          className={`flex-1 p-6 bg-slate-800 rounded-xl shadow-xl border cursor-pointer transition-all duration-200 ${
            selectedOption === 'ocr' 
              ? 'border-purple-500 ring-2 ring-purple-500/50' 
              : 'border-slate-700 hover:border-slate-500'
          }`}
          onClick={handleSelectOcr}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Backend OCR Processing</h3>
            {selectedOption === 'ocr' && (
              <span className="bg-purple-500/20 text-purple-400 p-1 rounded-full">
                <FaCheck size={14} />
              </span>
            )}
          </div>
          
          <p className="text-slate-300 mb-6">
            Don't have an API key? Try our OCR backend services. Your document will be uploaded for processing.
          </p>
          
          <div className="p-4 rounded-lg bg-slate-700 flex items-center gap-4">
            <div className="p-3 bg-purple-600/30 rounded-full">
              <FaRobot className="text-purple-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">OCR Backend Service</h4>
              <div className="flex items-center">
                {isCheckingOcr ? (
                  <span className="flex items-center text-yellow-400 text-sm">
                    <FaSpinner className="animate-spin mr-2" size={12} />
                    Checking availability...
                  </span>
                ) : isOcrAvailable ? (
                  <span className="flex items-center text-green-400 text-sm">
                    <FaBolt className="mr-2" size={12} />
                    Service Available
                  </span>
                ) : (
                  <span className="flex items-center text-red-400 text-sm">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Service Unavailable
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">How it works:</h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Your document will be securely processed by our OCR backend</li>
              <li>Processing time depends on document size and server load</li>
              <li>Service availability may vary based on server capacity</li>
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
