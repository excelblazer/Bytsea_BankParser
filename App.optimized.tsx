/**
 * Optimized App Component with Code Splitting
 * Uses React.lazy() for component lazy loading
 */

import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { DocumentTypeProvider, useDocumentType } from './components/DocumentTypeContext';
import { ParsedTransaction } from './types';
import { parseStatementWithLLM } from './services/llmService';
import { processFileWithOCR } from './services/ocrService';
import { parseOCRText } from './services/ocrParser';
import { LLMProvider } from './services/llmService';
import { APP_TITLE, ACCEPTED_FILE_TYPES } from './constants';
import Spinner from './components/Spinner';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './services/logger';

// Lazy load heavy components
const FileUpload = lazy(() => import('./components/FileUpload'));
const TransactionDisplay = lazy(() => import('./components/TransactionDisplay'));
const ParsingOptions = lazy(() => import('./components/ParsingOptions'));
const PrivacyPolicyModal = lazy(() => import('./components/PrivacyPolicyModal'));
const GeminiApiModal = lazy(() => import('./components/GeminiApiModal'));

// For mammoth, we rely on the global mammoth object from the CDN script
declare var mammoth: any;

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
);

/**
 * Main application content component
 */
const AppContent: React.FC = () => {
  const { documentType, setDocumentType } = useDocumentType();

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [parsingMethod, setParsingMethod] = useState<LLMProvider | 'ocr' | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number } | null>(null);

  /**
   * Check for API key on mount
   */
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

  /**
   * Check for privacy policy acceptance on mount
   */
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('privacy_policy_accepted');
    setShowPrivacyPolicy(privacyAccepted !== 'true');
  }, []);

  /**
   * Handle API key status updates
   */
  const handleApiKeySet = useCallback((isSet: boolean) => {
    setApiKeyStatus(isSet ? 'ok' : 'missing');
    if (isSet) {
      setParsingMethod('gemini');
    } else {
      setError(null);
    }
  }, []);

  /**
   * Handle privacy policy acceptance
   */
  const handlePrivacyPolicyAccept = useCallback(() => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setShowPrivacyPolicy(false);
    logger.info('Privacy policy accepted');
  }, []);

  /**
   * Handle privacy policy decline
   */
  const handlePrivacyPolicyDecline = useCallback(() => {
    setShowPrivacyPolicy(false);
    logger.info('Privacy policy declined');
  }, []);

  /**
   * Handle parsing method selection
   */
  const handleSelectParsingOption = useCallback((option: LLMProvider | 'ocr') => {
    setParsingMethod(option);
    setError(null);
    if (selectedFile) {
      setExtractedTransactions([]);
    }
  }, [selectedFile]);

  /**
   * Handle provider change
   */
  const handleProviderChange = useCallback((provider: LLMProvider) => {
    setSelectedProvider(provider);
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setExtractedTransactions([]);
    setError(null);
    logger.info('File selected', { name: file.name, size: file.size, type: file.type });
  }, []);

  /**
   * Process selected file
   */
  const processFile = useCallback(async () => {
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
        logger.info('Starting OCR processing');
        setOcrProgress({ status: 'Starting OCR processing', progress: 0 });
        
        const ocrResult = await processFileWithOCR(selectedFile, (progress) => {
          setOcrProgress(progress);
        });

        const extractedText = ocrResult.text;
        logger.debug('OCR extraction complete', { 
          textLength: extractedText.length,
          lines: extractedText.split('\n').length 
        });

        transactions = parseOCRText(extractedText, documentType);
        logger.info('OCR parsing complete', { transactionCount: transactions.length });
        
        setOcrProgress(null);
      } else if (parsingMethod && selectedProvider) {
        logger.info('Starting LLM processing', { provider: selectedProvider });
        
        let fileContent: string;
        let mimeType = selectedFile.type;

        if (!ACCEPTED_FILE_TYPES[mimeType as keyof typeof ACCEPTED_FILE_TYPES]) {
          throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP.`);
        }

        // Read file based on type
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

        const apiKey = localStorage.getItem(`${selectedProvider}_api_key`);
        if (!apiKey) {
          throw new Error(`${selectedProvider} API key not found.`);
        }

        transactions = await parseStatementWithLLM(fileContent, mimeType, documentType, {
          provider: selectedProvider,
          model: localStorage.getItem(`${selectedProvider}_model`) || 'default',
          apiKey
        });

        logger.info('LLM parsing complete', { transactionCount: transactions.length });
      }

      setExtractedTransactions(transactions);
    } catch (err) {
      logger.error("Processing error", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during processing.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, parsingMethod, selectedProvider, apiKeyStatus, documentType]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">{APP_TITLE}</h1>
          <p className="text-slate-300">Parse financial documents with AI or OCR</p>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <ParsingOptions
            onSelectOption={handleSelectParsingOption}
            onSelectDocumentType={setDocumentType}
            apiKeyStatus={apiKeyStatus}
            onApiKeySet={handleApiKeySet}
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
          />
        </Suspense>

        {parsingMethod && (
          <div className="mt-8">
            <Suspense fallback={<LoadingFallback />}>
              <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
            </Suspense>

            {selectedFile && (
              <div className="mt-6 text-center">
                <button
                  onClick={processFile}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  aria-label="Process document"
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
                    role="progressbar"
                    aria-valuenow={ocrProgress.progress * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">{Math.round(ocrProgress.progress * 100)}% complete</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-900/50 border border-red-500 rounded-lg" role="alert">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {extractedTransactions.length > 0 && (
          <div className="mt-8">
            <Suspense fallback={<LoadingFallback />}>
              <TransactionDisplay transactions={extractedTransactions} />
            </Suspense>
          </div>
        )}

        {/* Modals */}
        {showPrivacyPolicy && (
          <Suspense fallback={null}>
            <PrivacyPolicyModal
              isOpen={showPrivacyPolicy}
              onAccept={handlePrivacyPolicyAccept}
              onDecline={handlePrivacyPolicyDecline}
            />
          </Suspense>
        )}

        {showGeminiModal && (
          <Suspense fallback={null}>
            <GeminiApiModal
              isOpen={showGeminiModal}
              onClose={() => setShowGeminiModal(false)}
              onKeySet={handleApiKeySet}
              apiKeyStatus={apiKeyStatus}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

/**
 * Root App component with providers and error boundary
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DocumentTypeProvider>
        <AppContent />
      </DocumentTypeProvider>
    </ErrorBoundary>
  );
};

export default App;
