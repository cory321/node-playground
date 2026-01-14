import { getApiKeys } from './storage';

interface GeminiRequestBody {
  contents: Array<{ parts: Array<{ text: string }> }>;
  generationConfig?: {
    thinkingConfig?: {
      thinkingBudget: number;
    };
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

/**
 * Call Gemini API (Google)
 */
export async function callGemini(
  prompt: string,
  modelId: string = 'gemini-2.5-pro',
  context: string = '',
  useReasoning: boolean = false
): Promise<string> {
  const keys = getApiKeys();

  if (!keys.google) {
    throw new Error('Google AI API key not configured. Please add it in Settings.');
  }

  const fullPrompt = context
    ? `Context from previous node:\n${context}\n\n---\n\n${prompt}`
    : prompt;

  // Build request body
  const requestBody: GeminiRequestBody = {
    contents: [{ parts: [{ text: fullPrompt }] }],
  };

  // Add thinking config for reasoning mode (Gemini 3 models)
  if (
    useReasoning &&
    (modelId.includes('gemini-3') ||
      modelId.includes('gemini-2.5-pro') ||
      modelId.includes('gemini-2.5-flash'))
  ) {
    requestBody.generationConfig = {
      thinkingConfig: {
        thinkingBudget: 8192,
      },
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${keys.google}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error: GeminiResponse = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
