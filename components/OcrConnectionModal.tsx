import React, { useState } from 'react';
import { FaRobot, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface OcrConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => Promise<boolean>;
}

const OcrConnectionModal: React.FC<OcrConnectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleConnect = async () => {
    setConnectionStatus('connecting');
    setErrorMessage('');
    
    try {
      const success = await onConnect();
      if (success) {
        setConnectionStatus('success');
        setTimeout(() => {
          onClose();
          setConnectionStatus('idle');
        }, 1500);
      } else {
        setConnectionStatus('error');
        setErrorMessage('OCR backend service is currently unavailable. The service may be starting up or experiencing issues. Please try again in a few moments or use the Gemini AI API option.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to OCR backend. Please check your connection and try again.');
    }
  };

  const handleClose = () => {
    if (connectionStatus !== 'connecting') {
      onClose();
      setConnectionStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-emerald-500/30 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 backdrop-blur-xl">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-cyan-600/5"></div>
        
        {/* Close button */}
        {connectionStatus !== 'connecting' && (
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 z-10"
          >
            <FaTimes className="text-lg" />
          </button>
        )}
        
        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl mb-4">
            <FaRobot className="text-4xl text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">OCR Backend</h2>
          <p className="text-slate-300 text-center leading-relaxed max-w-sm">
            Connect to our secure OCR service for fast, privacy-focused document processing.
          </p>
        </div>

        {/* Content based on connection status */}
        <div className="relative z-10">
          {connectionStatus === 'idle' && (
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-emerald-300 font-semibold text-lg mb-4">✨ What you get:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-slate-300">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                    No API key needed
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                    Privacy-focused
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                    Fast processing
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                    Image & PDF support
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleConnect}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 transform hover:scale-[1.02]"
              >
                Connect to OCR Backend
              </button>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Enhanced loading animation */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-t-transparent border-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="text-emerald-300 font-semibold text-lg mb-2">Connecting to OCR Backend</p>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  Establishing secure connection to our OCR processing service...
                </p>
              </div>
            </div>
          )}

          {connectionStatus === 'success' && (
            <div className="flex flex-col items-center space-y-6 py-4">
              <div className="relative">
                <div className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <FaCheck className="text-4xl text-emerald-400" />
                </div>
                <div className="absolute inset-0 border-2 border-emerald-400/30 rounded-full animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="text-emerald-300 font-semibold text-xl mb-2">Connected Successfully!</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  OCR backend is ready to process your documents securely.
                </p>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center text-red-400 mb-3">
                  <FaExclamationTriangle className="mr-3 text-lg" />
                  <span className="font-semibold text-lg">Connection Failed</span>
                </div>
                <p className="text-red-200 text-sm leading-relaxed">{errorMessage}</p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleConnect}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrConnectionModal;
