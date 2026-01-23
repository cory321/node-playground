-- Provider Profile Cache Table
-- Optional caching for generated provider profiles to avoid regenerating identical content

-- Create the provider_profile_cache table
CREATE TABLE IF NOT EXISTS provider_profile_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key components (for lookup)
    provider_id TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    category TEXT NOT NULL,
    editorial_depth TEXT NOT NULL CHECK (editorial_depth IN ('brief', 'standard', 'detailed')),
    
    -- Hash of input data for cache invalidation
    -- Includes: provider enrichment data, local knowledge hooks, comparison context
    input_hash TEXT NOT NULL,
    
    -- Cached profile content
    profile_content JSONB NOT NULL,
    
    -- Quick lookup fields extracted from profile
    provider_name TEXT GENERATED ALWAYS AS (profile_content -> 'content' ->> 'headline') STORED,
    trust_score INTEGER GENERATED ALWAYS AS ((profile_content -> 'content' -> 'trustScore' -> 'display' ->> 'score')::INTEGER) STORED,
    word_count INTEGER GENERATED ALWAYS AS ((profile_content ->> 'wordCount')::INTEGER) STORED,
    local_ref_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(profile_content -> 'localReferences')) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'), -- Shorter TTL than site plans
    
    -- Unique constraint on cache key
    CONSTRAINT unique_profile_cache UNIQUE (provider_id, city, state, category, editorial_depth, input_hash)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_cache_provider 
    ON provider_profile_cache (provider_id);

CREATE INDEX IF NOT EXISTS idx_profile_cache_location 
    ON provider_profile_cache (city, state, category);
    
CREATE INDEX IF NOT EXISTS idx_profile_cache_expires 
    ON provider_profile_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_profile_cache_trust_score 
    ON provider_profile_cache (trust_score DESC);

-- Enable RLS
ALTER TABLE provider_profile_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for cache lookups)
CREATE POLICY "Allow anonymous read access"
    ON provider_profile_cache
    FOR SELECT
    USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access"
    ON provider_profile_cache
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_profiles()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM provider_profile_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_profile_cache_stats()
RETURNS TABLE (
    total_profiles INTEGER,
    avg_trust_score NUMERIC,
    avg_word_count NUMERIC,
    avg_local_refs NUMERIC,
    oldest_entry TIMESTAMPTZ,
    newest_entry TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_profiles,
        AVG(trust_score) as avg_trust_score,
        AVG(word_count) as avg_word_count,
        AVG(local_ref_count) as avg_local_refs,
        MIN(created_at) as oldest_entry,
        MAX(created_at) as newest_entry
    FROM provider_profile_cache
    WHERE expires_at > NOW();
END;
$$;

-- Comment on table
COMMENT ON TABLE provider_profile_cache IS 'Cache for generated provider profiles to avoid regenerating identical content';
COMMENT ON COLUMN provider_profile_cache.input_hash IS 'SHA256 hash of input data (provider enrichment + local knowledge + comparison context) for cache invalidation';
COMMENT ON COLUMN provider_profile_cache.profile_content IS 'Complete GeneratedProviderProfile JSON';
COMMENT ON COLUMN provider_profile_cache.expires_at IS 'Cache entries expire after 3 days by default (shorter than site plans due to more dynamic data)';
