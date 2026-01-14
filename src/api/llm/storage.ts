import { ApiKeys } from '@/types/api';

const STORAGE_KEY = 'nodeBuilderApiKeys';

// Get API keys from environment variables (set at build time via GitHub Secrets)
function getEnvKeys(): ApiKeys {
  return {
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    google: import.meta.env.VITE_GOOGLE_API_KEY || '',
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  };
}

// Default: use environment variables first
const DEFAULT_KEYS: ApiKeys = getEnvKeys();

// Check if env keys are available (at least one is set)
export function hasEnvKeys(): boolean {
  const envKeys = getEnvKeys();
  return !!(envKeys.anthropic || envKeys.google || envKeys.openai);
}

// Get API keys - prioritizes env vars, falls back to localStorage
export function getApiKeys(): ApiKeys {
  const envKeys = getEnvKeys();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const localKeys = stored ? JSON.parse(stored) : {};
    
    // Merge: env vars take priority, localStorage as fallback
    return {
      anthropic: envKeys.anthropic || localKeys.anthropic || '',
      google: envKeys.google || localKeys.google || '',
      openai: envKeys.openai || localKeys.openai || '',
    };
  } catch {
    return envKeys;
  }
}

// Save API keys to localStorage
export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

// Clear API keys from localStorage
export function clearApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Check if a specific provider key is set
export function hasApiKey(provider: keyof ApiKeys): boolean {
  const keys = getApiKeys();
  return !!keys[provider];
}
