import React, { createContext, useContext, useState } from 'react';

type DocumentType = 'bank' | 'creditcard' | 'ledger' | null;

interface DocumentTypeContextType {
  documentType: DocumentType;
  setDocumentType: (type: DocumentType) => void;
}

const DocumentTypeContext = createContext<DocumentTypeContextType | undefined>(undefined);

export const DocumentTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documentType, setDocumentType] = useState<DocumentType>(null);

  return (
    <DocumentTypeContext.Provider value={{ documentType, setDocumentType }}>
      {children}
    </DocumentTypeContext.Provider>
  );
};

export const useDocumentType = (): DocumentTypeContextType => {
  const context = useContext(DocumentTypeContext);
  if (context === undefined) {
    throw new Error('useDocumentType must be used within a DocumentTypeProvider');
  }
  return context;
};
