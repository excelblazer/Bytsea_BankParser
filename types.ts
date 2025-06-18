
export interface ParsedTransaction {
  bankName: string;
  clientName: string;
  transactionDate: string; // Should be formatted as YYYY-MM-DD
  description: string;
  referenceNumber: string;
  amount: number; // Positive for credit, negative for debit
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // other grounding metadata fields
}
    