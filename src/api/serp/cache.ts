import { supabase, hasSupabase, SerpCacheRow } from '../supabase';

// SERP signals extracted from SerpAPI response
export interface SerpSignals {
  hasLSAs: boolean;
  lsaCount: number;
  localPackCount: number;
  topOrganicDomains: string[]; // First 5 domains
  adCount: number;
  aggregatorPositions: number[]; // Which positions (1-5) have aggregators
  totalResults: number;
}

// Trend validation data structure (matches validation.ts TrendValidation)
export interface TrendValidationData {
  isStable: boolean;
  spikeDetected: boolean;
  spikeRatio: number;
  averageInterest: number;
  maxInterest: number;
  minInterest: number;
  medianInterest: number;
  trendDirection: 'growing' | 'declining' | 'flat' | 'volatile';
  confidenceScore: number;
  flags: string[];
  monthlyData: { date: string; value: number }[];
  fromCache: boolean;
}

// Trend cache entry
export interface CachedTrendData {
  keyword: string;
  geo: string;
  data: TrendValidationData;
  createdAt: Date;
}

// Cache entry with signals
export interface CachedSerpData {
  query: string;
  city: string;
  state: string | null;
  serpData: Record<string, unknown>;
  signals: SerpSignals;
  createdAt: Date;
  expiresAt: Date;
  fromCache: boolean;
}

// Default cache expiry in days
const DEFAULT_CACHE_EXPIRY_DAYS = 7;

/**
 * Get cached SERP data for a query+city combination
 * Returns null if not found or expired
 */
export async function getCachedSerp(
  query: string,
  city: string
): Promise<CachedSerpData | null> {
  if (!hasSupabase() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('serp_cache')
      .select('*')
      .eq('query', query.toLowerCase())
      .eq('city', city.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as SerpCacheRow;
    return {
      query: row.query,
      city: row.city,
      state: row.state,
      serpData: row.serp_data,
      signals: row.signals as unknown as SerpSignals,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      fromCache: true,
    };
  } catch (err) {
    console.error('Error fetching cached SERP:', err);
    return null;
  }
}

/**
 * Store SERP data in cache
 */
export async function setCachedSerp(
  query: string,
  city: string,
  state: string | null,
  serpData: Record<string, unknown>,
  signals: SerpSignals,
  expiryDays: number = DEFAULT_CACHE_EXPIRY_DAYS
): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    return false;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  try {
    const { error } = await supabase.from('serp_cache').upsert(
      {
        query: query.toLowerCase(),
        city: city.toLowerCase(),
        state: state?.toLowerCase() || null,
        serp_data: serpData,
        signals: signals as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'query,city',
      }
    );

    if (error) {
      console.error('Error caching SERP:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error caching SERP:', err);
    return false;
  }
}

/**
 * Delete expired cache entries
 * Can be called periodically to clean up
 */
export async function cleanExpiredCache(): Promise<number> {
  if (!hasSupabase() || !supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('serp_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('Error cleaning cache:', err);
    return 0;
  }
}

/**
 * Get cache statistics for a city
 */
export async function getCacheStats(city: string): Promise<{
  totalCached: number;
  validCached: number;
  expiredCached: number;
}> {
  if (!hasSupabase() || !supabase) {
    return { totalCached: 0, validCached: 0, expiredCached: 0 };
  }

  try {
    const now = new Date().toISOString();

    const { count: totalCached } = await supabase
      .from('serp_cache')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.toLowerCase());

    const { count: validCached } = await supabase
      .from('serp_cache')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.toLowerCase())
      .gt('expires_at', now);

    return {
      totalCached: totalCached || 0,
      validCached: validCached || 0,
      expiredCached: (totalCached || 0) - (validCached || 0),
    };
  } catch (err) {
    console.error('Error getting cache stats:', err);
    return { totalCached: 0, validCached: 0, expiredCached: 0 };
  }
}

/**
 * Invalidate cache for a specific city (force refresh)
 */
export async function invalidateCityCache(city: string): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('serp_cache')
      .delete()
      .eq('city', city.toLowerCase());

    if (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error invalidating cache:', err);
    return false;
  }
}

// ==================== Trend Validation Cache (30-day expiry) ====================

// Default trend cache expiry in days
const DEFAULT_TREND_CACHE_EXPIRY_DAYS = 30;

/**
 * Generate cache key for trend data
 */
function getTrendCacheKey(keyword: string, geo: string): string {
  return `trend:${keyword.toLowerCase().trim()}:${geo.toLowerCase()}`;
}

/**
 * Get cached trend validation data
 * Returns null if not found or expired (30 days)
 */
export async function getCachedTrendValidation(
  keyword: string,
  geo: string = 'US'
): Promise<TrendValidationData | null> {
  if (!hasSupabase() || !supabase) {
    return null;
  }

  try {
    const cacheKey = getTrendCacheKey(keyword, geo);

    const { data, error } = await supabase
      .from('trend_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid (30 days)
    const cachedAt = new Date(data.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff >= DEFAULT_TREND_CACHE_EXPIRY_DAYS) {
      return null; // Expired
    }

    return {
      ...data.data,
      fromCache: true,
    } as TrendValidationData;
  } catch (err) {
    console.error('Error fetching cached trend:', err);
    return null;
  }
}

/**
 * Store trend validation data in cache
 */
export async function setCachedTrendValidation(
  keyword: string,
  geo: string,
  data: TrendValidationData
): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    return false;
  }

  try {
    const cacheKey = getTrendCacheKey(keyword, geo);

    const { error } = await supabase.from('trend_cache').upsert(
      {
        cache_key: cacheKey,
        keyword: keyword.toLowerCase().trim(),
        geo: geo.toLowerCase(),
        data: data,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (error) {
      console.error('Error caching trend:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error caching trend:', err);
    return false;
  }
}

/**
 * Get trend cache statistics
 */
export async function getTrendCacheStats(): Promise<{
  totalCached: number;
  expiredCount: number;
}> {
  if (!hasSupabase() || !supabase) {
    return { totalCached: 0, expiredCount: 0 };
  }

  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - DEFAULT_TREND_CACHE_EXPIRY_DAYS);

    const { count: totalCached } = await supabase
      .from('trend_cache')
      .select('*', { count: 'exact', head: true });

    const { count: expiredCount } = await supabase
      .from('trend_cache')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', expiryDate.toISOString());

    return {
      totalCached: totalCached || 0,
      expiredCount: expiredCount || 0,
    };
  } catch (err) {
    console.error('Error getting trend cache stats:', err);
    return { totalCached: 0, expiredCount: 0 };
  }
}

/**
 * Clean expired trend cache entries
 */
export async function cleanExpiredTrendCache(): Promise<number> {
  if (!hasSupabase() || !supabase) {
    return 0;
  }

  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - DEFAULT_TREND_CACHE_EXPIRY_DAYS);

    const { data, error } = await supabase
      .from('trend_cache')
      .delete()
      .lt('created_at', expiryDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning trend cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('Error cleaning trend cache:', err);
    return 0;
  }
}
