// Re-export cache utilities
export {
  getCachedProviders,
  setCachedProviders,
  cleanExpiredProviderCache,
  getProviderCacheStats,
  invalidateProviderCache,
} from './cache';
export type { CachedProviderData } from './types';

// Re-export scoring utilities
export {
  scoreProvider,
  scoreAdvertising,
  scoreDigitalPresence,
  scoreReviewVelocity,
  scoreSizeSignal,
  scoreReachability,
  getPriority,
  generateReasoning,
} from './scoring';

import { ProviderData } from '@/types/nodes';
import { RawProviderData, DiscoveryResult, LocalPackResponse } from './types';
import { getCachedProviders, setCachedProviders } from './cache';
import { scoreProvider, generateReasoning } from './scoring';

// Get Supabase URL for edge function calls
function getSupabaseUrl(): string | null {
  return import.meta.env.VITE_SUPABASE_URL || null;
}

function getSupabaseAnonKey(): string | null {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || null;
}

/**
 * Check if provider discovery is configured (via Supabase Edge Function)
 */
export function hasProviderApiKey(): boolean {
  return getSupabaseUrl() !== null && getSupabaseAnonKey() !== null;
}

/**
 * Build the search query for provider discovery
 */
function buildProviderQuery(category: string, city: string, state: string | null): string {
  return `${category} ${city}${state ? `, ${state}` : ''}`;
}

/**
 * Parse provider data from SerpAPI local pack results
 */
function parseLocalPackProviders(
  data: LocalPackResponse,
  category: string
): { providers: RawProviderData[]; hasLSA: boolean; hasAds: boolean } {
  const localResults = data.local_results || [];
  const lsas = data.local_service_ads || [];
  const ads = data.ads || [];

  // Track which businesses are running LSAs or ads
  const lsaTitles = new Set(lsas.map((lsa) => lsa.title.toLowerCase()));
  const adTitles = new Set(ads.map((ad) => ad.title.toLowerCase()));

  return {
    providers: localResults,
    hasLSA: lsas.length > 0,
    hasAds: ads.length > 0,
  };
}

/**
 * Transform raw provider data into scored ProviderData
 */
function transformAndScoreProviders(
  rawProviders: RawProviderData[],
  lsas: { title: string }[],
  ads: { title: string }[]
): ProviderData[] {
  // Build lookup sets for LSA and ad detection
  const lsaTitles = new Set(lsas.map((lsa) => lsa.title.toLowerCase()));
  const adTitles = new Set(ads.map((ad) => ad.title.toLowerCase()));

  return rawProviders.map((raw, index) => {
    const titleLower = raw.title.toLowerCase();
    const hasLSA = lsaTitles.has(titleLower);
    const hasGoogleAds = adTitles.has(titleLower);

    const score = scoreProvider(raw, { hasLSA, hasGoogleAds });
    const reasoning = generateReasoning(raw, score, { hasLSA, hasGoogleAds });

    return {
      id: raw.place_id || `provider-${index}`,
      name: raw.title,
      phone: raw.phone || null,
      website: raw.website || null,
      address: raw.address || null,
      googleRating: raw.rating || null,
      googleReviewCount: raw.reviews || null,
      hasLSA,
      hasGoogleAds,
      score,
      reasoning,
      contacted: false,
    };
  });
}

/**
 * Discover local service providers for a category in a city
 * Uses SerpAPI local pack results to find and score providers
 */
export async function discoverProviders(
  category: string,
  city: string,
  state: string | null,
  skipCache: boolean = false
): Promise<DiscoveryResult> {
  const query = category.toLowerCase();

  // Check cache first
  if (!skipCache) {
    const cached = await getCachedProviders(query, city);
    if (cached) {
      return {
        providers: cached.providers,
        fromCache: true,
        error: null,
      };
    }
  }

  // Check for Supabase config (required for edge function proxy)
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return {
      providers: [],
      fromCache: false,
      error: 'Supabase not configured for SERP proxy',
    };
  }

  try {
    // Call Supabase Edge Function to proxy SerpAPI
    // Request local pack results specifically
    const response = await fetch(`${supabaseUrl}/functions/v1/serp-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        query: category,
        city,
        state,
        includeLocalPack: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `SERP proxy error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    // Extract local pack results
    const localResults: RawProviderData[] = data.local_results?.places || [];
    const lsas = data.local_service_ads || [];
    const ads = data.ads || [];

    // Transform and score providers
    const providers = transformAndScoreProviders(localResults, lsas, ads);

    // Sort by score descending
    providers.sort((a, b) => b.score.total - a.score.total);

    // Cache the results
    await setCachedProviders(query, city, state, providers);

    return {
      providers,
      fromCache: false,
      error: null,
    };
  } catch (err) {
    console.error('Provider discovery error:', err);
    return {
      providers: [],
      fromCache: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get provider counts by priority
 */
export function getProviderCounts(providers: ProviderData[]): {
  total: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  skip: number;
  contacted: number;
} {
  return {
    total: providers.length,
    p1: providers.filter((p) => p.score.priority === 'P1').length,
    p2: providers.filter((p) => p.score.priority === 'P2').length,
    p3: providers.filter((p) => p.score.priority === 'P3').length,
    p4: providers.filter((p) => p.score.priority === 'P4').length,
    skip: providers.filter((p) => p.score.priority === 'skip').length,
    contacted: providers.filter((p) => p.contacted).length,
  };
}

/**
 * Filter providers by priority
 */
export function filterProvidersByPriority(
  providers: ProviderData[],
  priorities: ('P1' | 'P2' | 'P3' | 'P4' | 'skip')[]
): ProviderData[] {
  return providers.filter((p) => priorities.includes(p.score.priority));
}
