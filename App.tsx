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
import { parseStatementWithLLM } from './services/llmService';
import { processFileWithOCR } from './services/ocrService';
import { parseOCRText } from './services/ocrParser';
import { LLMProvider } from './services/llmService';
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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  
  // New states for parsing options
  const [parsingMethod, setParsingMethod] = useState<LLMProvider | 'ocr' | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number } | null>(null);

  // Check for API key in local storage when component mounts
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKeyStatus('ok');
      setSelectedProvider('gemini');
      setParsingMethod('gemini');
    } else {
      setApiKeyStatus('missing');
    }
  }, []);

  // Check for privacy policy acceptance when component mounts
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('privacy_policy_accepted');
    if (privacyAccepted === 'true') {
      setShowPrivacyPolicy(false);
    } else {
      setShowPrivacyPolicy(true);
    }
  }, []);
  
  // Handle API key status updates from the ApiKeyInput component
  const handleApiKeySet = (isSet: boolean) => {
    setApiKeyStatus(isSet ? 'ok' : 'missing');
    if (isSet) {
      setParsingMethod('gemini');
    } else {
      // Clear any previous error since we're showing the API key input form
      setError(null);
    }
  };
  
  // Handle privacy policy acceptance
  const handlePrivacyPolicyAccept = () => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setShowPrivacyPolicy(false);
  };

  // Handle privacy policy decline
  const handlePrivacyPolicyDecline = () => {
    setShowPrivacyPolicy(false);
    // Optionally, you could redirect away or show a message
    // For now, we'll just close the modal and they won't be able to use the app
  };

  // Handle parsing method selection
  const handleSelectParsingOption = (option: LLMProvider | 'ocr') => {
    setParsingMethod(option);
    setError(null);

    // Reset other states when changing parsing method
    if (selectedFile) {
      setExtractedTransactions([]);
    }
  };

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
  };

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setExtractedTransactions([]);
    setError(null);
  }, []);

  const processFile = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    if (parsingMethod && parsingMethod !== 'ocr' && apiKeyStatus !== 'ok') {
      setError("Cannot process file: You need to provide your API key first.");
      setApiKeyStatus('missing');
      return;
    }

    if (!parsingMethod) {
      setError("Please select a parsing method (AI API or OCR).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedTransactions([]);

    try {
      let transactions: ParsedTransaction[] = [];

      if (parsingMethod === 'ocr') {
        // Process with client-side OCR
        setOcrProgress({ status: 'Starting OCR processing', progress: 0 });
        const ocrResult = await processFileWithOCR(selectedFile, (progress) => {
          setOcrProgress(progress);
        });

        // Now process the extracted text with OCR parsing logic
        const extractedText = ocrResult.text;
        console.log('=== OCR EXTRACTION DEBUG ===');
        console.log('Total extracted characters:', extractedText.length);
        console.log('Total extracted lines:', extractedText.split('\n').length);
        console.log('First 2000 chars:', extractedText.substring(0, 2000));
        
        // Store for debugging
        (window as any).__lastExtractedText = extractedText;
        (window as any).__lastOcrResult = ocrResult;

        // Parse the OCR text into structured transactions
        transactions = parseOCRText(extractedText, documentType);
        
        console.log('=== PARSING RESULT ===');
        console.log('Transactions parsed:', transactions.length);
        if (transactions.length > 0) {
          console.log('First transaction:', transactions[0]);
        }

        setOcrProgress(null); // Clear progress when done

      } else if (parsingMethod && selectedProvider) {
        // Process with selected LLM provider
        let fileContent: string;
        let mimeType = selectedFile.type;

        if (!ACCEPTED_FILE_TYPES[mimeType as keyof typeof ACCEPTED_FILE_TYPES]) {
          throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP.`);
        }

        if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
          fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(selectedFile);
          });
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          fileContent = result.value;
          mimeType = 'text/plain';
        } else if (mimeType === 'text/plain') {
          fileContent = await selectedFile.text();
        } else {
          throw new Error(`File processing logic not implemented for type: ${mimeType}`);
        }

        // Get API key for the selected provider
        const apiKey = localStorage.getItem(`${selectedProvider}_api_key`);
        if (!apiKey) {
          throw new Error(`${selectedProvider} API key not found.`);
        }

        transactions = await parseStatementWithLLM(fileContent, mimeType, documentType, {
          provider: selectedProvider,
          model: localStorage.getItem(`${selectedProvider}_model`) || 'default',
          apiKey
        });
      }

      setExtractedTransactions(transactions);
    } catch (err) {
      console.error("Processing error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during processing.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">{APP_TITLE}</h1>
          <p className="text-slate-300">Parse financial documents with AI or OCR</p>
        </header>

        <ParsingOptions
          onSelectOption={handleSelectParsingOption}
          onSelectDocumentType={setDocumentType}
          apiKeyStatus={apiKeyStatus}
          onApiKeySet={handleApiKeySet}
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
        />

        {parsingMethod && (
          <div className="mt-8">
            <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />

            {selectedFile && (
              <div className="mt-6 text-center">
                <button
                  onClick={processFile}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? 'Processing...' : 'Process Document'}
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="mt-8">
            <Spinner />
            {ocrProgress && (
              <div className="mt-4 text-center">
                <p className="text-blue-300 mb-2">{ocrProgress.status}</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress.progress * 100}%` }}
                  ></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">{Math.round(ocrProgress.progress * 100)}% complete</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {extractedTransactions.length > 0 && (
          <div className="mt-8">
            <TransactionDisplay transactions={extractedTransactions} />
          </div>
        )}

        {/* Modals */}
        {showPrivacyPolicy && (
          <PrivacyPolicyModal
            isOpen={showPrivacyPolicy}
            onAccept={handlePrivacyPolicyAccept}
            onDecline={handlePrivacyPolicyDecline}
          />
        )}

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
            onConnect={async () => true} // OCR is now always available
          />
        )}
      </div>
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
