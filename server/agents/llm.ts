import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/**
 * Shared LangChain Gemini model factory
 */
export function getLangChainGemini(options?: {
    temperature?: number;
    model?: string;
    maxRetries?: number;
}): ChatGoogleGenerativeAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return null;
    }

    const model = options?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    return new ChatGoogleGenerativeAI({
        model,
        apiKey,
        temperature: options?.temperature ?? 0.3,
        maxRetries: options?.maxRetries ?? 3,
    });
}
