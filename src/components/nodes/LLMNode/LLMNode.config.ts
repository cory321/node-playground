import { ProviderOption } from '@/types/api';

// Provider options for the LLM node dropdown
// Keys must match the keys in src/api/llm/models.ts
export const PROVIDER_OPTIONS: ProviderOption[] = [
  // Claude 4.5 models (Anthropic - latest)
  {
    key: 'claude-sonnet',
    label: 'Claude Sonnet 4.5',
    color: '#d97706',
    group: 'Claude 4.5',
    supportsReasoning: true,
  },
  {
    key: 'claude-opus',
    label: 'Claude Opus 4.5',
    color: '#ea580c',
    group: 'Claude 4.5',
    supportsReasoning: true,
  },
  {
    key: 'claude-haiku',
    label: 'Claude Haiku 4.5',
    color: '#f59e0b',
    group: 'Claude 4.5',
    supportsReasoning: true,
  },
  // Claude 3.5 models (Anthropic - stable fallback)
  {
    key: 'claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    color: '#b45309',
    group: 'Claude 3.5',
    supportsReasoning: true,
  },
  {
    key: 'claude-3.5-haiku',
    label: 'Claude 3.5 Haiku',
    color: '#ca8a04',
    group: 'Claude 3.5',
    supportsReasoning: false,
  },
  // OpenAI GPT models (latest)
  {
    key: 'gpt-5.2',
    label: 'GPT-5.2',
    color: '#10b981',
    group: 'OpenAI',
    supportsReasoning: true,
  },
  {
    key: 'gpt-5.1',
    label: 'GPT-5.1',
    color: '#059669',
    group: 'OpenAI',
    supportsReasoning: true,
  },
  {
    key: 'gpt-4.1',
    label: 'GPT-4.1',
    color: '#34d399',
    group: 'OpenAI',
    supportsReasoning: false,
  },
  {
    key: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    color: '#6ee7b7',
    group: 'OpenAI',
    supportsReasoning: false,
  },
  // OpenAI Reasoning models (o-series)
  {
    key: 'o3',
    label: 'o3',
    color: '#14b8a6',
    group: 'OpenAI o-series',
    supportsReasoning: true,
  },
  {
    key: 'o4-mini',
    label: 'o4-mini',
    color: '#2dd4bf',
    group: 'OpenAI o-series',
    supportsReasoning: true,
  },
  // Gemini 2.5 Preview models (latest with thinking support)
  {
    key: 'gemini-pro',
    label: 'Gemini 2.5 Pro Preview',
    color: '#2563eb',
    group: 'Gemini',
    supportsReasoning: true,
  },
  {
    key: 'gemini-flash',
    label: 'Gemini 2.5 Flash Preview',
    color: '#0891b2',
    group: 'Gemini',
    supportsReasoning: true,
  },
  // Gemini 2.5 stable models
  {
    key: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    color: '#3b82f6',
    group: 'Gemini Stable',
    supportsReasoning: false,
  },
  {
    key: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    color: '#06b6d4',
    group: 'Gemini Stable',
    supportsReasoning: false,
  },
];

export function getProviderOption(key: string): ProviderOption {
  return PROVIDER_OPTIONS.find((p) => p.key === key) || PROVIDER_OPTIONS[0];
}
