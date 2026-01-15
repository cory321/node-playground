import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. SERP caching will be disabled.'
  );
}

// Create Supabase client (will be null if credentials are missing)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Check if Supabase is configured
export function hasSupabase(): boolean {
  return supabase !== null;
}

// Database types for SERP caching
export interface SerpCacheRow {
  id: string;
  query: string;
  city: string;
  state: string | null;
  serp_data: Record<string, unknown>;
  signals: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface ScanResultRow {
  id: string;
  city: string;
  state: string | null;
  scan_mode: 'triage' | 'full';
  results: Record<string, unknown>;
  top_opportunities: Record<string, unknown>[] | null;
  skip_list: Record<string, unknown>[] | null;
  created_at: string;
}

// Database types for provider caching
export interface ProviderCacheRow {
  id: string;
  query: string;
  city: string;
  state: string | null;
  providers: Record<string, unknown>[];
  created_at: string;
  expires_at: string;
}

// Database types for project persistence
export interface ProjectRow {
  id: string;
  name: string;
  nodes: Record<string, unknown>[];
  connections: Record<string, unknown>[];
  transform: { x: number; y: number; scale: number } | null;
  created_at: string;
  updated_at: string;
}
