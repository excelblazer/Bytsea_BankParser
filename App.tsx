
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import TransactionDisplay from './components/TransactionDisplay';
import Spinner from './components/Spinner';
import ApiKeyInput from './components/ApiKeyInput';
import { ParsedTransaction } from './types';
import { parseStatementWithGemini } from './services/geminiService';
import { APP_TITLE, ACCEPTED_FILE_TYPES } from './constants';

// For mammoth, we rely on the global mammoth object from the CDN script
declare var mammoth: any;

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');

  // Check for API key in local storage when component mounts
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('missing');
      setError("Please enter your Google Gemini API key to use this application.");
    }
  }, []);

  // Handle API key status updates from the ApiKeyInput component
  const handleApiKeySet = (isSet: boolean) => {
    setApiKeyStatus(isSet ? 'ok' : 'missing');
    if (!isSet) {
      setError("Please enter your Google Gemini API key to use this application.");
    } else {
      setError(null);
    }
  };


  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setExtractedTransactions([]); // Clear previous results
    setError(null); // Clear previous errors
  }, []);

  const processFile = async () => {
    if (!selectedFile || apiKeyStatus !== 'ok') {
      if(apiKeyStatus !== 'ok') setError("Cannot process file: Gemini API Key is missing or invalid.");
      else setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedTransactions([]); // Clear again before processing, though already done in handleFileSelect

    try {
      let fileContent: string; // Base64 for images/PDFs, plain text for TXT/DOCX
      let mimeType = selectedFile.type;

      if (!ACCEPTED_FILE_TYPES[mimeType as keyof typeof ACCEPTED_FILE_TYPES]) {
        throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP.`);
      }

      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]); // Get base64 part
          reader.onerror = error => reject(error);
          reader.readAsDataURL(selectedFile);
        });
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // DOCX
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value;
        mimeType = 'text/plain'; // Treat as plain text for Gemini after extraction
      } else if (mimeType === 'text/plain') { // TXT
        fileContent = await selectedFile.text();
      } else {
        throw new Error(`File processing logic not implemented for type: ${mimeType}`);
      }
      
      const transactions = await parseStatementWithGemini(fileContent, mimeType);
      setExtractedTransactions(transactions);
    } catch (err) {
      console.error("Processing error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during file processing.");
      }
      setExtractedTransactions([]); // Ensure empty on error too
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center w-full">
      <header className="text-center mb-10 mt-6">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 mb-2">
          {APP_TITLE}
        </h1>
        <p className="text-slate-400 text-lg">
          Upload your bank or card statements (PDF, DOCX, TXT, Images) to extract transactions.
        </p>
      </header>
      
      {/* Display API Key Input component if API key is missing */}
      {apiKeyStatus === 'missing' && (
        <ApiKeyInput onKeySet={handleApiKeySet} />
      )}
      
      {error && (
         <div className="w-full max-w-xl mx-auto my-4 p-4 bg-red-800/70 border border-red-600 rounded-lg text-red-200 text-center">
            <strong>Configuration Error:</strong> {error}
        </div>
      )}

      {/* Only show the file upload when API key is configured */}
      {apiKeyStatus === 'ok' && (
        <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
      )}

      {selectedFile && apiKeyStatus === 'ok' && (
        <button
          onClick={processFile}
          disabled={isLoading}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Extract Transactions'}
        </button>
      )}

      {isLoading && <Spinner message="AI is analyzing your statement... This may take a moment." />}
      
      {!isLoading && error && (
        <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-red-800/50 border border-red-700 rounded-lg text-red-200" role="alert">
          <h3 className="font-semibold text-lg mb-2">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && extractedTransactions.length > 0 && (
        <TransactionDisplay transactions={extractedTransactions} fileNamePrefix={selectedFile?.name.split('.')[0]}/>
      )}
       {/* This block handles the case where processing is done, no errors, but no transactions found */}
       {!isLoading && !error && extractedTransactions.length === 0 && selectedFile && (
         <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-center" role="status" aria-live="polite">
           <p>Processing complete. No transactions were found in the file: {selectedFile.name}</p>
         </div>
        )}
    </div>
  );
};

export default App;
