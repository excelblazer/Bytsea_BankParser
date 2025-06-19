
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import TransactionDisplay from './components/TransactionDisplay';
import Spinner from './components/Spinner';
import ApiKeyInput from './components/ApiKeyInput';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import { ParsedTransaction } from './types';
import { parseStatementWithGemini } from './services/geminiService';
import { APP_TITLE, ACCEPTED_FILE_TYPES } from './constants';

// For mammoth, we rely on the global mammoth object from the CDN script
declare var mammoth: any;

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');
  const [hasAttemptedProcessing, setHasAttemptedProcessing] = useState<boolean>(false);
  const [showApiChangeWarning, setShowApiChangeWarning] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState<boolean>(false);
  // Check for API key in local storage when component mounts
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('missing');
      // No need for error message when first loading as the ApiKeyInput component will be shown
    }
  }, []);

  // Check for privacy policy acceptance when component mounts
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('privacy_policy_accepted');
    if (privacyAccepted === 'true') {
      setPrivacyPolicyAccepted(true);
    } else {
      setShowPrivacyPolicy(true);
    }
  }, []);

  // Handle API key status updates from the ApiKeyInput component
  const handleApiKeySet = (isSet: boolean) => {
    setApiKeyStatus(isSet ? 'ok' : 'missing');
    if (!isSet) {
      // Clear any previous error since we're showing the API key input form
      setError(null);
    } else {
      setError(null);
    }
    setShowApiChangeWarning(false);
  };
  
  // Handle the API change process with warning
  const handleApiChangeRequest = () => {
    setShowApiChangeWarning(true);
  };
  
  // Confirm API change after warning
  const confirmApiChange = () => {
    // Clear API key from localStorage
    localStorage.removeItem('gemini_api_key');
    setApiKeyStatus('missing');
    setSelectedFile(null);
    setExtractedTransactions([]);
    setError(null);
    setShowApiChangeWarning(false);
  };
    // Cancel API change request
  const cancelApiChange = () => {
    setShowApiChangeWarning(false);
  };

  // Handle privacy policy acceptance
  const handlePrivacyPolicyAccept = () => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setPrivacyPolicyAccepted(true);
    setShowPrivacyPolicy(false);
  };

  // Handle privacy policy decline
  const handlePrivacyPolicyDecline = () => {
    setShowPrivacyPolicy(false);
    // Optionally, you could redirect away or show a message
    // For now, we'll just close the modal and they won't be able to use the app
  };


  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setExtractedTransactions([]); // Clear previous results
    setError(null); // Clear previous errors
    setHasAttemptedProcessing(false); // Reset processing state when new file is selected
  }, []);

  const processFile = async () => {
    if (!selectedFile || apiKeyStatus !== 'ok') {
      if(apiKeyStatus !== 'ok') {
        setError("Cannot process file: You need to provide your Google Gemini API key first.");
        setApiKeyStatus('missing'); // Show the API key input form
      }
      else setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedTransactions([]); // Clear again before processing, though already done in handleFileSelect
    setHasAttemptedProcessing(true); // Mark that we've attempted processing

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
    <div className="mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center w-full max-w-screen-xl relative">
      
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onAccept={handlePrivacyPolicyAccept}
        onDecline={handlePrivacyPolicyDecline}
      />

      {/* Main App Content - Only show if privacy policy is accepted */}
      {privacyPolicyAccepted && (
        <>
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 mt-6 mb-1 text-center">
            {APP_TITLE}
          </h1>
          <div className="h-1 w-64 mx-auto bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 rounded-full mb-3"></div>
          <p className="text-slate-400 text-lg mb-10 text-center">
            {apiKeyStatus === 'missing' 
              ? "First, enter your Google Gemini API key to enable transaction extraction." 
              : "Upload your bank or card statements (PDF, DOCX, TXT, Images) to extract transactions."}
          </p>
      
      {/* Display API Key Input component if API key is missing */}
      {apiKeyStatus === 'missing' && (
        <>
          <ApiKeyInput onKeySet={handleApiKeySet} />
          
          {/* Coming Soon API integrations */}
          <div className="w-full max-w-xl mx-auto mt-8 mb-4">
            <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-center mb-3 text-blue-300">More API Options Coming Soon</h3>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <div className="flex-1 border border-slate-700 rounded-md p-4 bg-slate-800/70 relative overflow-hidden group api-box cursor-not-allowed shadow-md">
                  <div className="absolute top-0 right-0 bg-blue-600/80 text-xs px-2 py-1 rounded-bl-md">Coming Soon</div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center rounded bg-slate-700">
                      <span className="font-bold text-blue-400">O</span>
                    </div>
                    <h4 className="font-medium text-white">OpenAI</h4>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">Connect with OpenAI's GPT models for more advanced statement parsing capabilities.</p>
                  <button disabled className="w-full py-2 bg-slate-700/70 text-slate-400 rounded cursor-not-allowed opacity-70">
                    Connect OpenAI
                  </button>
                </div>
                <div className="flex-1 border border-slate-700 rounded-md p-4 bg-slate-800/70 relative overflow-hidden api-box cursor-not-allowed shadow-md">
                  <div className="absolute top-0 right-0 bg-purple-600/80 text-xs px-2 py-1 rounded-bl-md">Coming Soon</div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center rounded bg-slate-700">
                      <span className="font-bold text-purple-400">A</span>
                    </div>
                    <h4 className="font-medium text-white">Anthropic</h4>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">Use Claude for enhanced data extraction from complex financial statements.</p>
                  <button disabled className="w-full py-2 bg-slate-700/70 text-slate-400 rounded cursor-not-allowed opacity-70">
                    Connect Anthropic
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {error && (
         <div className="w-full max-w-xl mx-auto my-4 p-4 bg-red-800/70 border border-red-600 rounded-lg text-red-200 text-center">
            <strong>Configuration Error:</strong> {error}
        </div>
      )}

      {/* Only show the file upload when API key is configured */}
      {apiKeyStatus === 'ok' && (
        <>
          <div className="w-full max-w-xl mx-auto mb-4">
            <div className="flex items-center justify-between bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
              <div className="flex items-center">
                <div className="bg-green-500/20 rounded-full p-1 mr-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-slate-300 mr-2">Connected:</span>
                <span className="font-medium text-cyan-300">Google Gemini AI</span>
              </div>
              <button
                onClick={handleApiChangeRequest}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors duration-200"
              >
                Change API
              </button>
            </div>
          </div>
          <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
          
          {/* Coming Soon - Alternate API providers in disabled state */}
          <div className="w-full max-w-xl mx-auto mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center opacity-50 cursor-not-allowed">
              <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center mr-2">
                <span className="text-blue-400 text-xs font-bold">O</span>
              </div>
              <span className="text-xs text-slate-400">OpenAI • Coming Soon</span>
            </div>
            <div className="flex items-center opacity-50 cursor-not-allowed">
              <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center mr-2">
                <span className="text-purple-400 text-xs font-bold">A</span>
              </div>
              <span className="text-xs text-slate-400">Anthropic • Coming Soon</span>
            </div>
          </div>
        </>
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
        <TransactionDisplay transactions={extractedTransactions} />
      )}
       {/* This block handles the case where processing is done, no errors, but no transactions found */}
       {!isLoading && !error && extractedTransactions.length === 0 && selectedFile && hasAttemptedProcessing && (
         <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-center" role="status" aria-live="polite">
           <p>Processing complete. No transactions were found in the file: {selectedFile.name}</p>
         </div>
        )}
        
        {/* API Change Warning Modal */}
        {showApiChangeWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md mx-4 border border-red-500/30 shadow-2xl modal-content">
              <div className="flex items-start mb-4">
                <div className="mr-3 text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Change API Integration</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Warning: Your current API integration settings will be removed from the browser.
                  </p>
                  <p className="text-slate-300 text-sm mb-1">
                    You will need to re-enter your API key to continue using the application.
                  </p>
                  <div className="text-xs text-amber-400/80 mt-2 mb-4 italic">
                    Any uploaded files and extracted data will also be cleared.
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={cancelApiChange}                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmApiChange}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}        </>
      )}      {/* Show a message when privacy policy is not accepted */}
      {!privacyPolicyAccepted && !showPrivacyPolicy && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy Required</h2>
          <p className="text-slate-300 mb-6">
            You need to accept our privacy policy to use this application.
          </p>
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Review Privacy Policy
          </button>
        </div>
      )}

      {/* Footer with Privacy Policy link - only show when policy is accepted */}
      {privacyPolicyAccepted && (
        <footer className="mt-auto pt-8 pb-4 text-center">
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline"
          >
            Privacy Policy
          </button>
        </footer>
      )}
    </div>
  );
};

export default App;
