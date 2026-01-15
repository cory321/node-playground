import { supabase, hasSupabase, ProviderCacheRow } from '../supabase';
import { ProviderData } from '@/types/nodes';
import { CachedProviderData } from './types';

// Default cache expiry in days
const DEFAULT_CACHE_EXPIRY_DAYS = 7;

/**
 * Get cached provider data for a query+city combination
 * Returns null if not found or expired
 */
export async function getCachedProviders(
  query: string,
  city: string
): Promise<CachedProviderData | null> {
  if (!hasSupabase() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('provider_cache')
      .select('*')
      .eq('query', query.toLowerCase())
      .eq('city', city.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as ProviderCacheRow;
    return {
      query: row.query,
      city: row.city,
      state: row.state,
      providers: row.providers as unknown as ProviderData[],
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      fromCache: true,
    };
  } catch (err) {
    console.error('Error fetching cached providers:', err);
    return null;
  }
}

/**
 * Store provider data in cache
 */
export async function setCachedProviders(
  query: string,
  city: string,
  state: string | null,
  providers: ProviderData[],
  expiryDays: number = DEFAULT_CACHE_EXPIRY_DAYS
): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    return false;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  try {
    const { error } = await supabase.from('provider_cache').upsert(
      {
        query: query.toLowerCase(),
        city: city.toLowerCase(),
        state: state?.toLowerCase() || null,
        providers: providers as unknown as Record<string, unknown>[],
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'query,city',
      }
    );

    if (error) {
      console.error('Error caching providers:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error caching providers:', err);
    return false;
  }
}

/**
 * Delete expired cache entries
 * Can be called periodically to clean up
 */
export async function cleanExpiredProviderCache(): Promise<number> {
  if (!hasSupabase() || !supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('provider_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning provider cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('Error cleaning provider cache:', err);
    return 0;
  }
}

/**
 * Get cache statistics for a city
 */
export async function getProviderCacheStats(city: string): Promise<{
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
      .from('provider_cache')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.toLowerCase());

    const { count: validCached } = await supabase
      .from('provider_cache')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.toLowerCase())
      .gt('expires_at', now);

    return {
      totalCached: totalCached || 0,
      validCached: validCached || 0,
      expiredCached: (totalCached || 0) - (validCached || 0),
    };
  } catch (err) {
    console.error('Error getting provider cache stats:', err);
    return { totalCached: 0, validCached: 0, expiredCached: 0 };
  }
}

/**
 * Invalidate cache for a specific category+city (force refresh)
 */
export async function invalidateProviderCache(
  query: string,
  city: string
): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('provider_cache')
      .delete()
      .eq('query', query.toLowerCase())
      .eq('city', city.toLowerCase());

    if (error) {
      console.error('Error invalidating provider cache:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error invalidating provider cache:', err);
    return false;
  }
}
