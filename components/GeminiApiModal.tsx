import React from 'react';
import { FaGoogle, FaTimes } from 'react-icons/fa';
import ApiKeyInput from './ApiKeyInput';

interface GeminiApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySet: (isSet: boolean) => void;
  apiKeyStatus: 'checking' | 'ok' | 'missing';
}

const GeminiApiModal: React.FC<GeminiApiModalProps> = ({ 
  isOpen, 
  onClose, 
  onKeySet, 
  apiKeyStatus 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-blue-500/30 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 backdrop-blur-xl">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
        >
          <FaTimes className="text-lg" />
        </button>
        
        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl mb-4">
            <FaGoogle className="text-4xl text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Google Gemini AI</h2>
          <p className="text-slate-300 text-center leading-relaxed max-w-sm">
            Connect your Google Gemini API to unlock advanced AI capabilities for all document types.
          </p>
        </div>

        {/* API Key Input */}
        <div className="relative z-10 mb-6">
          <ApiKeyInput onKeySet={onKeySet} />
        </div>

        {/* Success State */}
        {apiKeyStatus === 'ok' && (
          <div className="relative z-10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 mb-6 animate-fade-in">
            <div className="flex items-center mb-3">
              <div className="relative mr-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="font-semibold text-green-300 text-lg">Connected Successfully!</span>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">
              Your Gemini API key has been configured. You can now process documents with advanced AI analysis.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-xl transition-all duration-200 font-medium"
          >
            {apiKeyStatus === 'ok' ? 'Close' : 'Cancel'}
          </button>
          {apiKeyStatus === 'ok' && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiApiModal;
