
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ParsedTransaction } from '../types';
import { GEMINI_MODEL_NAME, GEMINI_SYSTEM_INSTRUCTION_TEXT_INPUT, GEMINI_PROMPT_FOR_FILE } from '../constants';

// Get API key from environment or local storage
const getApiKey = (): string | null => {
  // Check local storage first
  const localStorageKey = localStorage.getItem('gemini_api_key');
  if (localStorageKey) return localStorageKey;
  
  // Fall back to environment variable if available
  return process.env.API_KEY || null;
};

// Function to set API key in local storage
export const setApiKey = (key: string): void => {
  localStorage.setItem('gemini_api_key', key);
};

// Create a configurable instance of the Google Generative AI client
const createAIClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

const parseJsonFromText = (text: string): ParsedTransaction[] | null => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    if (Array.isArray(parsedData) && parsedData.every(item => 
        typeof item.bankName === 'string' &&
        typeof item.clientName === 'string' &&
        typeof item.transactionDate === 'string' && // Further date validation can be added
        typeof item.description === 'string' &&
        typeof item.referenceNumber === 'string' &&
        typeof item.amount === 'number'
    )) {
      return parsedData as ParsedTransaction[];
    }
    console.warn("Parsed JSON does not match ParsedTransaction[] structure:", parsedData);
    return null;
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", e);
    console.error("Raw response text:", text);
    return null;
  }
};

export const parseStatementWithGemini = async (
  fileContent: string, // Base64 string for images/PDFs, plain text for TXT/DOCX
  mimeType: string
): Promise<ParsedTransaction[]> => {
  // Get API key from local storage or environment
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please enter your API key in the settings.");
  }
  
  // Create a new AI client with the provided API key
  const ai = createAIClient(apiKey);
  
  const parts: Part[] = [];

  if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileContent, // Already base64 encoded
      },
    });
    parts.push({ text: GEMINI_PROMPT_FOR_FILE });
  } else if (mimeType === 'text/plain') {
    // For plain text, we combine the prompt with the content
    parts.push({ text: `${GEMINI_PROMPT_FOR_FILE}\n\nHere is the statement text:\n${fileContent}` });
  } else {
    throw new Error(`Unsupported mime type for Gemini processing: ${mimeType}`);
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_TEXT_INPUT,
        responseMimeType: "application/json",
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      console.error("Gemini response was empty or undefined.");
      throw new Error("Received an empty response from the AI. The document might be unparsable or too complex.");
    }
    
    const parsedTransactions = parseJsonFromText(textResponse);

    if (!parsedTransactions) {
      throw new Error("AI failed to return valid transaction data in the expected JSON format. Please check the console for raw AI output. The AI might have misunderstood the input or the document structure.");
    }
    return parsedTransactions;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // Check for specific Gemini API error messages if available
        if (error.message.includes("API key not valid")) {
             throw new Error("The configured Gemini API key is invalid. Please check your environment configuration.");
        }
         throw new Error(`AI processing failed: ${error.message}. Ensure your API key is valid and the file is not too large or complex.`);
    }
    throw new Error("An unknown error occurred during AI processing.");
  }
};
