import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ParsedTransaction } from '../types';
import {
  GEMINI_MODEL_NAME,
  BANK_STATEMENT_INSTRUCTION,
  CREDIT_CARD_STATEMENT_INSTRUCTION,
  LEDGER_STATEMENT_INSTRUCTION,
  GEMINI_PROMPT_FOR_FILE
} from '../constants';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic';
export type LLMModel = string; // Model identifier

export interface LLMConfig {
  provider: LLMProvider;
  model: LLMModel;
  apiKey: string;
}

export interface LLMResponse {
  transactions: ParsedTransaction[];
  rawResponse?: any;
}

// Provider-specific configurations
const PROVIDER_CONFIGS = {
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
    defaultModel: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com'
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    defaultModel: 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com'
  }
};

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: LLMProvider): string[] {
  return PROVIDER_CONFIGS[provider].models;
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  return PROVIDER_CONFIGS[provider].defaultModel;
}

/**
 * Get provider display name
 */
export function getProviderName(provider: LLMProvider): string {
  return PROVIDER_CONFIGS[provider].name;
}

/**
 * Validate API key format for a provider
 */
export function validateApiKey(provider: LLMProvider, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) return false;

  switch (provider) {
    case 'gemini':
      // Gemini API keys start with specific prefixes
      return apiKey.startsWith('AIza') && apiKey.length > 20;
    case 'openai':
      // OpenAI API keys start with 'sk-'
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      // Anthropic API keys start with 'sk-ant-'
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    default:
      return false;
  }
}

/**
 * Test API key validity by making a small request
 */
export async function testApiKey(config: LLMConfig): Promise<boolean> {
  try {
    switch (config.provider) {
      case 'gemini':
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: { parts: [{ text: 'Hello' }] },
          config: { maxOutputTokens: 10 }
        });
        return true;

      case 'openai':
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        return openaiResponse.ok;

      case 'anthropic':
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hello' }]
          })
        });
        return anthropicResponse.ok;

      default:
        return false;
    }
  } catch (error) {
    console.error(`API key test failed for ${config.provider}:`, error);
    return false;
  }
}

/**
 * Parse JSON response from LLM text
 */
function parseJsonFromText(text: string): ParsedTransaction[] | null {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);

    // Handle the new format with metadata separate from transactions
    if (parsedData &&
        typeof parsedData.bankName === 'string' &&
        typeof parsedData.clientName === 'string' &&
        Array.isArray(parsedData.transactions)) {

      // Convert the new format to the old format for backward compatibility
      const transactions = parsedData.transactions.map((t: any) => ({
        bankName: parsedData.bankName,
        clientName: parsedData.clientName,
        transactionDate: t.transactionDate,
        description: t.description,
        referenceNumber: t.referenceNumber,
        amount: t.amount
      }));

      // Store the statement period and currency in localStorage for use in filename and display
      if (parsedData.statementPeriod) {
        localStorage.setItem('statement_period', parsedData.statementPeriod);
      } else {
        localStorage.removeItem('statement_period');
      }

      // Store the currency information
      if (parsedData.currency) {
        localStorage.setItem('statement_currency', parsedData.currency);
      } else {
        localStorage.removeItem('statement_currency');
      }

      return transactions as ParsedTransaction[];
    }

    // Handle the old format for backward compatibility
    if (Array.isArray(parsedData) && parsedData.every(item =>
        typeof item.bankName === 'string' &&
        typeof item.clientName === 'string' &&
        typeof item.transactionDate === 'string' &&
        typeof item.description === 'string' &&
        typeof item.referenceNumber === 'string' &&
        typeof item.amount === 'number'
    )) {
      return parsedData as ParsedTransaction[];
    }

    console.warn("Parsed JSON does not match expected structure:", parsedData);
    return null;
  } catch (e) {
    console.error("Failed to parse JSON response from LLM:", e);
    console.error("Raw response text:", text);
    return null;
  }
}

/**
 * Get the appropriate instruction based on document type
 */
function getInstructionForDocType(docType: 'bank' | 'creditcard' | 'ledger' | null): string {
  switch (docType) {
    case 'bank':
      return BANK_STATEMENT_INSTRUCTION;
    case 'creditcard':
      return CREDIT_CARD_STATEMENT_INSTRUCTION;
    case 'ledger':
      return LEDGER_STATEMENT_INSTRUCTION;
    default:
      return BANK_STATEMENT_INSTRUCTION;
  }
}

/**
 * Process document with Gemini
 */
async function processWithGemini(
  fileContent: string,
  mimeType: string,
  documentType: 'bank' | 'creditcard' | 'ledger' | null,
  config: LLMConfig
): Promise<LLMResponse> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  const parts: Part[] = [];

  if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileContent,
      },
    });
    parts.push({ text: GEMINI_PROMPT_FOR_FILE });
  } else if (mimeType === 'text/plain') {
    parts.push({ text: `${GEMINI_PROMPT_FOR_FILE}\n\nHere is the statement text:\n${fileContent}` });
  } else {
    throw new Error(`Unsupported mime type for Gemini processing: ${mimeType}`);
  }

  const systemInstruction = getInstructionForDocType(documentType);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: config.model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  const textResponse = response.text;
  if (!textResponse) {
    throw new Error("Received an empty response from Gemini. The document might be unparsable or too complex.");
  }

  const transactions = parseJsonFromText(textResponse);
  if (!transactions) {
    throw new Error("Gemini failed to return valid transaction data in the expected JSON format.");
  }

  return { transactions, rawResponse: response };
}

/**
 * Process document with OpenAI
 */
async function processWithOpenAI(
  fileContent: string,
  mimeType: string,
  documentType: 'bank' | 'creditcard' | 'ledger' | null,
  config: LLMConfig
): Promise<LLMResponse> {
  const systemInstruction = getInstructionForDocType(documentType);
  const userPrompt = GEMINI_PROMPT_FOR_FILE; // Reuse the same prompt structure

  let messages: any[] = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: userPrompt }
  ];

  // Handle different file types
  if (mimeType.startsWith('image/')) {
    messages[1].content = [
      { type: 'text', text: userPrompt },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${fileContent}`
        }
      }
    ];
  } else if (mimeType === 'application/pdf') {
    // For PDFs, we'd need to convert to images first, but for now treat as text
    messages[1].content = `${userPrompt}\n\nDocument content (base64): ${fileContent}`;
  } else if (mimeType === 'text/plain') {
    messages[1].content = `${userPrompt}\n\nHere is the statement text:\n${fileContent}`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      response_format: { type: 'json_object' },
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textResponse = data.choices[0]?.message?.content;

  if (!textResponse) {
    throw new Error("Received an empty response from OpenAI.");
  }

  const transactions = parseJsonFromText(textResponse);
  if (!transactions) {
    throw new Error("OpenAI failed to return valid transaction data in the expected JSON format.");
  }

  return { transactions, rawResponse: data };
}

/**
 * Process document with Anthropic Claude
 */
async function processWithAnthropic(
  fileContent: string,
  mimeType: string,
  documentType: 'bank' | 'creditcard' | 'ledger' | null,
  config: LLMConfig
): Promise<LLMResponse> {
  const systemInstruction = getInstructionForDocType(documentType);
  const userPrompt = GEMINI_PROMPT_FOR_FILE;

  let messages: any[] = [];

  // Handle different file types
  if (mimeType.startsWith('image/')) {
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: fileContent
          }
        }
      ]
    }];
  } else {
    messages = [{
      role: 'user',
      content: `${userPrompt}\n\nHere is the statement text:\n${fileContent}`
    }];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      system: systemInstruction,
      messages: messages,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textResponse = data.content[0]?.text;

  if (!textResponse) {
    throw new Error("Received an empty response from Anthropic.");
  }

  const transactions = parseJsonFromText(textResponse);
  if (!transactions) {
    throw new Error("Anthropic failed to return valid transaction data in the expected JSON format.");
  }

  return { transactions, rawResponse: data };
}

/**
 * Main function to parse statements with any LLM provider
 */
export async function parseStatementWithLLM(
  fileContent: string,
  mimeType: string,
  documentType: 'bank' | 'creditcard' | 'ledger' | null,
  config: LLMConfig
): Promise<ParsedTransaction[]> {
  try {
    let result: LLMResponse;

    switch (config.provider) {
      case 'gemini':
        result = await processWithGemini(fileContent, mimeType, documentType, config);
        break;
      case 'openai':
        result = await processWithOpenAI(fileContent, mimeType, documentType, config);
        break;
      case 'anthropic':
        result = await processWithAnthropic(fileContent, mimeType, documentType, config);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }

    return result.transactions;
  } catch (error) {
    console.error(`Error calling ${config.provider} API:`, error);
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error(`The configured ${getProviderName(config.provider)} API key is invalid. Please check your configuration.`);
      }
      throw new Error(`${getProviderName(config.provider)} processing failed: ${error.message}`);
    }
    throw new Error(`An unknown error occurred during ${getProviderName(config.provider)} processing.`);
  }
}

/**
 * Legacy function for backward compatibility with Gemini-only code
 */
export const parseStatementWithGemini = async (
  fileContent: string,
  mimeType: string,
  documentType: 'bank' | 'creditcard' | 'ledger' | null = null
): Promise<ParsedTransaction[]> => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please enter your API key in the settings.");
  }

  return parseStatementWithLLM(fileContent, mimeType, documentType, {
    provider: 'gemini',
    model: GEMINI_MODEL_NAME,
    apiKey
  });
};