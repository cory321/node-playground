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
