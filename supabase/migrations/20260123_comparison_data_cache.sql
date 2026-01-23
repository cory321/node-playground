-- Comparison Data Cache Table
-- Optional caching for generated comparison pages to avoid regenerating identical data

-- Create the comparison_data_cache table
CREATE TABLE IF NOT EXISTS comparison_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key components (for lookup)
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    category TEXT NOT NULL,
    provider_count INTEGER NOT NULL DEFAULT 0,
    include_pricing BOOLEAN NOT NULL DEFAULT true,
    include_winner_badges BOOLEAN NOT NULL DEFAULT true,
    
    -- Hash of input data for cache invalidation
    input_hash TEXT NOT NULL,
    
    -- Cached output
    comparison_data JSONB NOT NULL,
    
    -- Extracted fields for quick lookup
    comparison_page_count INTEGER GENERATED ALWAYS AS (
        jsonb_array_length(comparison_data -> 'comparisonPages')
    ) STORED,
    pricing_page_count INTEGER GENERATED ALWAYS AS (
        jsonb_array_length(comparison_data -> 'pricingPages')
    ) STORED,
    total_providers INTEGER GENERATED ALWAYS AS (
        (comparison_data -> 'marketStats' ->> 'totalProviders')::INTEGER
    ) STORED,
    average_trust_score INTEGER GENERATED ALWAYS AS (
        (comparison_data -> 'marketStats' ->> 'averageTrustScore')::INTEGER
    ) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    
    -- Unique constraint on cache key
    CONSTRAINT unique_comparison_data_cache UNIQUE (city, state, category, input_hash)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_comparison_data_cache_lookup 
    ON comparison_data_cache (city, state, category);
    
CREATE INDEX IF NOT EXISTS idx_comparison_data_cache_expires 
    ON comparison_data_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_comparison_data_cache_provider_count 
    ON comparison_data_cache (provider_count);

-- Enable RLS
ALTER TABLE comparison_data_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for cache lookups)
CREATE POLICY "Allow anonymous read access"
    ON comparison_data_cache
    FOR SELECT
    USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access"
    ON comparison_data_cache
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_comparison_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM comparison_data_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Comment on table
COMMENT ON TABLE comparison_data_cache IS 'Cache for generated comparison data to avoid regenerating identical pages';
COMMENT ON COLUMN comparison_data_cache.input_hash IS 'SHA256 hash of input data (blueprint + providers + local_knowledge + config) for cache invalidation';
COMMENT ON COLUMN comparison_data_cache.comparison_data IS 'Complete GeneratedComparisonData JSON';
COMMENT ON COLUMN comparison_data_cache.expires_at IS 'Cache entries expire after 3 days by default (comparison data changes more frequently)';
