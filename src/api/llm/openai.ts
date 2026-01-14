import { getApiKeys } from './storage';

interface OpenAIRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  max_completion_tokens?: number;
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string };
}

/**
 * Call OpenAI API (GPT / o-series)
 */
export async function callOpenAI(
  prompt: string,
  modelId: string = 'gpt-4.1',
  context: string = '',
  useReasoning: boolean = false,
  isReasoningModel: boolean = false
): Promise<string> {
  const keys = getApiKeys();

  if (!keys.openai) {
    throw new Error('OpenAI API key not configured. Please add it in Settings.');
  }

  const fullPrompt = context
    ? `Context from previous node:\n${context}\n\n---\n\n${prompt}`
    : prompt;

  // Build request body
  const requestBody: OpenAIRequestBody = {
    model: modelId,
    messages: [{ role: 'user', content: fullPrompt }],
  };

  // GPT-5.x and o-series models use max_completion_tokens
  // Older models (GPT-4.1) use max_tokens
  const isNewModel = modelId.startsWith('gpt-5') || modelId.startsWith('o');

  if (isNewModel || isReasoningModel) {
    requestBody.max_completion_tokens = useReasoning ? 16000 : 4096;
  } else {
    requestBody.max_tokens = useReasoning ? 8192 : 4096;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keys.openai}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error: OpenAIResponse = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
