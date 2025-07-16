import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import TransactionDisplay from './components/TransactionDisplay';
import Spinner from './components/Spinner';
import ParsingOptions from './components/ParsingOptions';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import GeminiApiModal from './components/GeminiApiModal';
import OcrConnectionModal from './components/OcrConnectionModal';
import { DocumentTypeProvider, useDocumentType } from './components/DocumentTypeContext';
import { ParsedTransaction } from './types';
import { parseStatementWithGemini } from './services/geminiService';
import { parseWithOcrBackend } from './services/ocrBackendService';
import { checkOcrBackendAvailable } from './services/backendService';
import { APP_TITLE, ACCEPTED_FILE_TYPES } from './constants';

// For mammoth, we rely on the global mammoth object from the CDN script
declare var mammoth: any;

const AppContent: React.FC = () => {
  // Import the document type context
  const { documentType, setDocumentType } = useDocumentType();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');
  const [hasAttemptedProcessing, setHasAttemptedProcessing] = useState<boolean>(false);
  const [showApiChangeWarning, setShowApiChangeWarning] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState<boolean>(false);
  
  // New states for parsing options
  const [parsingMethod, setParsingMethod] = useState<'gemini' | 'ocr' | null>(null);
  const [isOcrAvailable, setIsOcrAvailable] = useState<boolean>(false);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);

  // Check for API key in local storage and OCR availability when component mounts
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKeyStatus('ok');
      setParsingMethod('gemini');
    } else {
      setApiKeyStatus('missing');
    }
    
    // Check if OCR backend is available
    const checkOcr = async () => {
      const available = await checkOcrBackendAvailable();
      setIsOcrAvailable(available);
    };
    checkOcr();
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
  
  // Function to check OCR availability on demand
  const checkOcrAvailability = async (): Promise<boolean> => {
    const available = await checkOcrBackendAvailable();
    setIsOcrAvailable(available);
    return available;
  };

  // Handle API key status updates from the ApiKeyInput component
  const handleApiKeySet = (isSet: boolean) => {
    setApiKeyStatus(isSet ? 'ok' : 'missing');
    if (isSet) {
      setParsingMethod('gemini');
    } else {
      // Clear any previous error since we're showing the API key input form
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
    setParsingMethod(null); // Reset parsing method when API key is cleared
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

  // Handle parsing method selection
  const handleSelectParsingOption = (option: 'gemini' | 'ocr') => {
    setParsingMethod(option);
    setError(null);
    
    // Reset other states when changing parsing method
    if (selectedFile) {
      setExtractedTransactions([]);
      setHasAttemptedProcessing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setExtractedTransactions([]); // Clear previous results
    setError(null); // Clear previous errors
    setHasAttemptedProcessing(false); // Reset processing state when new file is selected
  }, []);

  const processFile = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    
    if (parsingMethod === 'gemini' && apiKeyStatus !== 'ok') {
      setError("Cannot process file: You need to provide your Google Gemini API key first.");
      setApiKeyStatus('missing'); // Show the API key input form
      return;
    }
    
    if (!parsingMethod) {
      setError("Please select a parsing method (Gemini API or OCR backend).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedTransactions([]); // Clear again before processing, though already done in handleFileSelect
    setHasAttemptedProcessing(true); // Mark that we've attempted processing

    try {
      let transactions: ParsedTransaction[] = [];
      
      if (parsingMethod === 'gemini') {
        // Process with Gemini API
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
          const result = await mammoth.extractRawText({ arrayBuffer });
          fileContent = result.value;
          mimeType = 'text/plain'; // Treat as plain text for Gemini after extraction
        } else if (mimeType === 'text/plain') { // TXT
          fileContent = await selectedFile.text();
        } else {
          throw new Error(`File processing logic not implemented for type: ${mimeType}`);
        }
        
        transactions = await parseStatementWithGemini(fileContent, mimeType, documentType);
      } else if (parsingMethod === 'ocr') {
        // Process with OCR backend - determine OCR endpoint based on document type
        // Currently the backend only supports 'statement' and 'ledger' types
        const ocrType = documentType === 'ledger' ? 'ledger' : 'statement';
        const result = await parseWithOcrBackend(selectedFile, ocrType);
        transactions = result.transactions || [];
      }
      
      setExtractedTransactions(transactions);
    } catch (err) {
      console.error("Processing error:", err);
      if (err instanceof Error) {
        // Handle specific error types
        if (parsingMethod === 'gemini' && err.message.includes('API key')) {
          setApiKeyStatus('missing');
        }
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
          <p className="text-slate-400 text-lg mb-6 text-center">
            {!parsingMethod
              ? "Choose a parsing method to get started."
              : parsingMethod && !documentType
              ? "Select your document type to continue."
              : documentType === 'bank'
              ? "Upload your bank statement (PDF, DOCX, TXT, Images) to extract transactions."
              : documentType === 'creditcard'
              ? "Upload your credit card statement (PDF, DOCX, TXT, Images) to extract transactions."
              : documentType === 'ledger'
              ? "Upload your accounting ledger (PDF, DOCX, TXT, Images) to extract transactions."
              : "Upload your financial documents (PDF, DOCX, TXT, Images) to extract transactions."}
          </p>
      
          {/* Display Parsing Options if no method selected or show modals */}
          {showGeminiModal && (
            <GeminiApiModal 
              isOpen={showGeminiModal}
              onClose={() => setShowGeminiModal(false)}
              onKeySet={handleApiKeySet}
              apiKeyStatus={apiKeyStatus}
            />
          )}
          
          {showOcrModal && (
            <OcrConnectionModal
              isOpen={showOcrModal}
              onClose={() => setShowOcrModal(false)}
              onConnect={checkOcrAvailability}
            />
          )}
          
          {(!parsingMethod || !documentType) && (
            <ParsingOptions 
              onSelectOption={handleSelectParsingOption}
              onSelectDocumentType={setDocumentType}
              apiKeyStatus={apiKeyStatus}
              onApiKeySet={handleApiKeySet}
              isOcrAvailable={isOcrAvailable}
              checkOcrAvailability={checkOcrAvailability}
            />
          )}
          
          {/* Show parsing method status */}
          {parsingMethod && documentType && (
            <div className="w-full max-w-xl mx-auto mb-4">
              <div className="flex items-center justify-between bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                <div className="flex items-center">
                  <div className="bg-green-500/20 rounded-full p-1 mr-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-sm text-slate-300 mr-2">Method:</span>
                      <span className="font-medium text-cyan-300">
                        {parsingMethod === 'gemini' ? 'Google Gemini AI' : 'OCR Backend Service'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-slate-300 mr-2">Document:</span>
                      <span className="font-medium text-purple-300">
                        {documentType === 'bank' ? 'Bank Statement' : 
                         documentType === 'creditcard' ? 'Credit Card Statement' : 'Accounting Ledger'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setParsingMethod(null)}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors duration-200"
                >
                  Change Method
                </button>
              </div>
            </div>
          )}

          {/* Show file upload when both parsing method and document type are selected */}
          {parsingMethod && documentType && <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />}

          {/* Show process button when file is selected */}
          {selectedFile && parsingMethod && documentType && (
            <button
              onClick={processFile}
              disabled={isLoading}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Extract Transactions'}
            </button>
          )}

          {/* Show loading spinner */}
          {isLoading && <Spinner message="Analyzing your statement... This may take a moment." />}
          
          {/* Error display */}
          {!isLoading && error && (
            <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-red-800/50 border border-red-700 rounded-lg text-red-200" role="alert">
              <h3 className="font-semibold text-lg mb-2">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Display transactions when available */}
          {!isLoading && !error && extractedTransactions.length > 0 && (
            <TransactionDisplay transactions={extractedTransactions} />
          )}
          
          {/* Show message when processing complete but no transactions found */}
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
                    onClick={cancelApiChange}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
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
          )}
        </>
      )}
      
      {/* Show a message when privacy policy is not accepted */}
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

const App: React.FC = () => {
  return (
    <DocumentTypeProvider>
      <AppContent />
    </DocumentTypeProvider>
  );
};

export default App;
