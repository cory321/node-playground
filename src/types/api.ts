// API Provider types
export type LLMProvider = 'anthropic' | 'google' | 'openai';

// Model configuration
export interface ModelConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  description: string;
  supportsReasoning: boolean;
  isReasoningModel?: boolean;
}

// Model registry type
export type ModelRegistry = Record<string, ModelConfig>;

// API Keys storage
export interface ApiKeys {
  anthropic: string;
  google: string;
  openai: string;
}

// Provider option for UI dropdowns
export interface ProviderOption {
  key: string;
  label: string;
  color: string;
  group: string;
  supportsReasoning: boolean;
}

// Saved setup structure
export interface SavedSetup {
  id: string;
  name: string;
  createdAt: string;
  nodes: unknown[]; // Will be NodeData[] once fully typed
  connections: unknown[]; // Will be Connection[] once fully typed
  transform?: {
    x: number;
    y: number;
    scale: number;
  };
}
