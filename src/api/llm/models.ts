import { ModelRegistry } from '@/types/api';

// Available models - Updated Jan 2026
export const MODELS: ModelRegistry = {
  // Anthropic Claude 4.5 Models (latest)
  'claude-sonnet': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Balanced performance and capability',
    supportsReasoning: true,
  },
  'claude-opus': {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Most capable, complex reasoning',
    supportsReasoning: true,
  },
  'claude-haiku': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fastest, near-instant responses',
    supportsReasoning: true,
  },
  // Anthropic Claude 3.5 Models (stable fallback)
  'claude-3.5-sonnet': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Stable, proven performance',
    supportsReasoning: true,
  },
  'claude-3.5-haiku': {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fast and reliable',
    supportsReasoning: false,
  },
  // Google Gemini Models (Gemini 2.5 latest stable - Gemini 3 not yet in API)
  'gemini-pro': {
    id: 'gemini-2.5-pro-preview-06-05',
    name: 'Gemini 2.5 Pro Preview',
    provider: 'google',
    description: 'Latest preview, advanced reasoning',
    supportsReasoning: true,
  },
  'gemini-flash': {
    id: 'gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    description: 'Fast preview with thinking',
    supportsReasoning: true,
  },
  // Google Gemini 2.5 Models (stable fallback)
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Stable, generally available',
    supportsReasoning: false,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Speed optimized, stable',
    supportsReasoning: false,
  },
  // OpenAI GPT Models (latest)
  'gpt-5.2': {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    description: 'Flagship model, 400K context',
    supportsReasoning: true,
  },
  'gpt-5.1': {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    description: 'Smart Router, multimodal',
    supportsReasoning: true,
  },
  'gpt-4.1': {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    description: 'Reliable, general purpose',
    supportsReasoning: false,
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    description: 'Fast and affordable',
    supportsReasoning: false,
  },
  // OpenAI Reasoning Models (o-series)
  'o3': {
    id: 'o3',
    name: 'o3',
    provider: 'openai',
    description: 'Advanced reasoning model',
    supportsReasoning: true,
    isReasoningModel: true,
  },
  'o4-mini': {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    description: 'Efficient reasoning model',
    supportsReasoning: true,
    isReasoningModel: true,
  },
};

// Get model by key
export function getModel(key: string) {
  return MODELS[key];
}

// Get all models for a provider
export function getModelsByProvider(provider: string) {
  return Object.entries(MODELS)
    .filter(([, config]) => config.provider === provider)
    .map(([key, config]) => ({ key, ...config }));
}
