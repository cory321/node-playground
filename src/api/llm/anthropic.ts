import { getApiKeys } from './storage';

interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  messages: Array<{ role: string; content: string | ClaudeMessageContent[] }>;
  thinking?: {
    type: string;
    budget_tokens: number;
  };
}

// Multimodal message content types for vision
type ClaudeMessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source:
        | { type: 'url'; url: string }
        | { type: 'base64'; media_type: string; data: string };
    };

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message: string };
}

/**
 * Call Claude API (Anthropic)
 */
export async function callClaude(
  prompt: string,
  modelId: string = 'claude-sonnet-4-5-20250514',
  context: string = '',
  useReasoning: boolean = false
): Promise<string> {
  const keys = getApiKeys();

  if (!keys.anthropic) {
    throw new Error('Anthropic API key not configured. Please add it in Settings.');
  }

  const fullPrompt = context
    ? `Context from previous node:\n${context}\n\n---\n\n${prompt}`
    : prompt;

  // Build request body
  const requestBody: ClaudeRequestBody = {
    model: modelId,
    max_tokens: useReasoning ? 16000 : 4096,
    messages: [{ role: 'user', content: fullPrompt }],
  };

  // Add extended thinking for reasoning mode
  if (useReasoning) {
    requestBody.thinking = {
      type: 'enabled',
      budget_tokens: 10000,
    };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': keys.anthropic,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error: ClaudeResponse = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  const data: ClaudeResponse = await response.json();

  // Extract text from response, handling both regular and thinking responses
  const textContent = data.content?.find((block) => block.type === 'text');
  return textContent?.text || '';
}

/**
 * Call Claude API with vision/image support (Anthropic)
 * Supports both URL-based images and base64 data URLs
 */
export async function callClaudeWithVision(
  prompt: string,
  imageUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929',
  maxTokens: number = 8192
): Promise<string> {
  const keys = getApiKeys();

  if (!keys.anthropic) {
    throw new Error('Anthropic API key not configured. Please add it in Settings.');
  }

  // Build image source based on whether it's base64 or URL
  let imageSource: ClaudeMessageContent['source'] extends infer T
    ? T extends { type: 'image' }
      ? T['source']
      : never
    : never;

  if (imageUrl.startsWith('data:image/')) {
    // Extract media type and base64 data from data URL
    const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image data URL format');
    }
    imageSource = {
      type: 'base64',
      media_type: matches[1],
      data: matches[2],
    };
  } else {
    // URL-based image
    imageSource = {
      type: 'url',
      url: imageUrl,
    };
  }

  // Build multimodal message content
  const messageContent: ClaudeMessageContent[] = [
    {
      type: 'image',
      source: imageSource,
    },
    {
      type: 'text',
      text: prompt,
    },
  ];

  const requestBody: ClaudeRequestBody = {
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: messageContent }],
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': keys.anthropic,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error: ClaudeResponse = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude Vision API error: ${response.status}`);
  }

  const data: ClaudeResponse = await response.json();

  // Extract text from response
  const textContent = data.content?.find((block) => block.type === 'text');
  return textContent?.text || '';
}
