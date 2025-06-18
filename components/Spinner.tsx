
import React from 'react';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      {message && <p className="mt-3 text-lg text-gray-300">{message}</p>}
    </div>
  );
};

export default Spinner;
    