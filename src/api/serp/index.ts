// Re-export all SERP API utilities
export {
  getCachedSerp,
  setCachedSerp,
  cleanExpiredCache,
  getCacheStats,
  invalidateCityCache,
} from './cache';
export type { SerpSignals, CachedSerpData } from './cache';

export {
  TIER1_CATEGORIES,
  TIER2_CONDITIONS,
  TIER3_EXPANSIONS,
  AGGREGATOR_DOMAINS,
  DEFAULT_SCAN_CONFIG,
  LEAD_ECONOMICS,
  CONDITIONAL_CATEGORIES,
  detectCityProfile,
  getCategoriesToScan,
  getTier3Categories,
  isAggregatorDomain,
  getCategoryTier,
  getLeadEconomics,
  calculateExpectedMargin,
  assessCategoryViability,
  detectGBPOpportunities,
  prioritizeProviderOutreach,
  estimateServiceValue,
  calculateAggregatorDominance,
} from './tiers';
export type {
  CityProfile,
  ScanConfig,
  MarketSignals,
  GBPIssue,
  CategoryViability,
  LeadEconomics,
} from './tiers';

export { analyzeSerpWithClaude, generateTriageAnalysis } from './analyzer';
export type { CategoryAnalysis, TriageResult } from './analyzer';

import { SerpSignals, getCachedSerp, setCachedSerp } from './cache';
import { isAggregatorDomain } from './tiers';

// SerpAPI response types (subset of what we need)
interface SerpApiOrganicResult {
  position: number;
  title: string;
  link: string;
  domain?: string;
  displayed_link?: string;
  snippet?: string;
}

interface SerpApiLocalResult {
  position: number;
  title: string;
  rating?: number;
  reviews?: number;
  address?: string;
  phone?: string;
}

interface SerpApiAd {
  position: number;
  title: string;
  link: string;
  displayed_link?: string;
}

interface SerpApiLocalServiceAd {
  title: string;
  link: string;
  rating?: number;
  reviews?: number;
}

interface SerpApiResponse {
  search_metadata?: {
    status: string;
    total_time_taken?: number;
  };
  search_information?: {
    total_results?: number;
    query_displayed?: string;
  };
  organic_results?: SerpApiOrganicResult[];
  local_results?: {
    places?: SerpApiLocalResult[];
  };
  local_service_ads?: SerpApiLocalServiceAd[];
  ads?: SerpApiAd[];
  error?: string;
}

// Get Supabase URL for edge function calls
function getSupabaseUrl(): string | null {
  return import.meta.env.VITE_SUPABASE_URL || null;
}

function getSupabaseAnonKey(): string | null {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || null;
}

/**
 * Check if SerpAPI proxy is configured (via Supabase Edge Function)
 */
export function hasSerpApiKey(): boolean {
  return getSupabaseUrl() !== null && getSupabaseAnonKey() !== null;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Extract signals from SerpAPI response
 */
function extractSignals(data: SerpApiResponse): SerpSignals {
  const organicResults = data.organic_results || [];
  const localPack = data.local_results?.places || [];
  const lsas = data.local_service_ads || [];
  const ads = data.ads || [];

  // Get top 5 organic domains
  const topOrganicDomains = organicResults.slice(0, 5).map((result) => {
    return result.domain || extractDomain(result.link);
  });

  // Find which positions (1-5) have aggregators
  const aggregatorPositions: number[] = [];
  topOrganicDomains.forEach((domain, index) => {
    if (isAggregatorDomain(domain)) {
      aggregatorPositions.push(index + 1); // 1-indexed
    }
  });

  return {
    hasLSAs: lsas.length > 0,
    lsaCount: lsas.length,
    localPackCount: localPack.length,
    topOrganicDomains,
    adCount: ads.length,
    aggregatorPositions,
    totalResults: data.search_information?.total_results || 0,
  };
}

/**
 * Fetch SERP data from SerpAPI
 * First checks cache, then fetches if needed
 */
export async function fetchSerpData(
  query: string,
  city: string,
  state?: string | null,
  skipCache: boolean = false
): Promise<{
  signals: SerpSignals;
  rawData: Record<string, unknown>;
  fromCache: boolean;
  error?: string;
}> {
  const fullQuery = `${query} ${city}${state ? `, ${state}` : ''}`;

  // Check cache first
  if (!skipCache) {
    const cached = await getCachedSerp(query, city);
    if (cached) {
      return {
        signals: cached.signals,
        rawData: cached.serpData,
        fromCache: true,
      };
    }
  }

  // Check for Supabase config (required for edge function proxy)
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return {
      signals: {
        hasLSAs: false,
        lsaCount: 0,
        localPackCount: 0,
        topOrganicDomains: [],
        adCount: 0,
        aggregatorPositions: [],
        totalResults: 0,
      },
      rawData: {},
      fromCache: false,
      error: 'Supabase not configured for SERP proxy',
    };
  }

  try {
    // Call Supabase Edge Function to proxy SerpAPI (avoids CORS)
    const response = await fetch(
      `${supabaseUrl}/functions/v1/serp-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query, city, state }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `SERP proxy error: ${response.status} ${response.statusText}`);
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    // Extract signals
    const signals = extractSignals(data);

    // Cache the result
    await setCachedSerp(
      query,
      city,
      state || null,
      data as Record<string, unknown>,
      signals
    );

    return {
      signals,
      rawData: data as Record<string, unknown>,
      fromCache: false,
    };
  } catch (err) {
    console.error('SERP proxy error:', err);
    return {
      signals: {
        hasLSAs: false,
        lsaCount: 0,
        localPackCount: 0,
        topOrganicDomains: [],
        adCount: 0,
        aggregatorPositions: [],
        totalResults: 0,
      },
      rawData: {},
      fromCache: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Run quick triage search for a city
 */
export async function runTriageSearch(
  city: string,
  state?: string | null
): Promise<{
  signals: SerpSignals;
  fromCache: boolean;
  error?: string;
}> {
  const result = await fetchSerpData('home services near me', city, state);
  return {
    signals: result.signals,
    fromCache: result.fromCache,
    error: result.error,
  };
}
