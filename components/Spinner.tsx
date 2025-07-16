
import React from 'react';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Main spinning ring */}
        <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-4 bg-blue-400 rounded-full animate-pulse"></div>
        {/* Outer glow ring */}
        <div className="absolute inset-0 w-16 h-16 border-2 border-blue-500/30 rounded-full animate-ping"></div>
      </div>
      
      {message && (
        <div className="mt-6 text-center max-w-md">
          <p className="text-lg font-medium text-white mb-2">Processing Document</p>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>
      )}
      
      {/* Animated progress dots */}
      <div className="flex space-x-2 mt-4">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default Spinner;
    