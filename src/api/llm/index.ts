// Re-export all LLM API utilities
export { MODELS, getModel, getModelsByProvider } from './models';
export { getApiKeys, saveApiKeys, clearApiKeys, hasApiKey, hasEnvKeys } from './storage';
export { callClaude, callClaudeWithVision } from './anthropic';
export { callOpenAI } from './openai';
export { callGemini } from './google';
export { callGeminiImage, calculateAspectRatio, findClosestAspectRatio, ASPECT_RATIO_PRESETS } from './gemini-image';

import { MODELS } from './models';
import { callClaude } from './anthropic';
import { callOpenAI } from './openai';
import { callGemini } from './google';

/**
 * Unified LLM call function - routes to the appropriate provider
 */
export async function callLLM(
  provider: string,
  prompt: string,
  modelKey: string | null = null,
  context: string = '',
  useReasoning: boolean = false
): Promise<string> {
  const model = modelKey ? MODELS[modelKey] : MODELS[provider];

  if (!model) {
    throw new Error(`Unknown model/provider: ${provider}`);
  }

  // Check if model supports reasoning
  const enableReasoning = useReasoning && model.supportsReasoning;

  if (model.provider === 'anthropic') {
    return callClaude(prompt, model.id, context, enableReasoning);
  } else if (model.provider === 'google') {
    return callGemini(prompt, model.id, context, enableReasoning);
  } else if (model.provider === 'openai') {
    return callOpenAI(
      prompt,
      model.id,
      context,
      enableReasoning,
      model.isReasoningModel || false
    );
  } else {
    throw new Error(`Unknown provider type: ${model.provider}`);
  }
}
