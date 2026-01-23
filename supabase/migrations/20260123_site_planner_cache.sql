-- Site Planner Cache Table
-- Optional caching for generated site plans to avoid regenerating identical plans

-- Create the site_planner_cache table
CREATE TABLE IF NOT EXISTS site_planner_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key components (for lookup)
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    category TEXT NOT NULL,
    depth TEXT NOT NULL CHECK (depth IN ('mvp', 'standard', 'comprehensive')),
    provider_count INTEGER NOT NULL DEFAULT 0,
    
    -- Hash of input data for cache invalidation
    input_hash TEXT NOT NULL,
    
    -- Cached output
    site_plan JSONB NOT NULL,
    
    -- Brand identity extracted for quick lookup
    brand_name TEXT GENERATED ALWAYS AS (site_plan -> 'brand' ->> 'name') STORED,
    brand_domain TEXT GENERATED ALWAYS AS (site_plan -> 'brand' ->> 'domain') STORED,
    page_count INTEGER GENERATED ALWAYS AS ((site_plan -> 'meta' ->> 'pageCount')::INTEGER) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Unique constraint on cache key
    CONSTRAINT unique_site_plan_cache UNIQUE (city, state, category, depth, input_hash)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_planner_cache_lookup 
    ON site_planner_cache (city, state, category, depth);
    
CREATE INDEX IF NOT EXISTS idx_site_planner_cache_expires 
    ON site_planner_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_site_planner_cache_brand 
    ON site_planner_cache (brand_domain);

-- Enable RLS
ALTER TABLE site_planner_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for cache lookups)
CREATE POLICY "Allow anonymous read access"
    ON site_planner_cache
    FOR SELECT
    USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access"
    ON site_planner_cache
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_site_plans()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM site_planner_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Comment on table
COMMENT ON TABLE site_planner_cache IS 'Cache for generated site plans to avoid regenerating identical plans';
COMMENT ON COLUMN site_planner_cache.input_hash IS 'SHA256 hash of input data (location + serp + providers + local_knowledge) for cache invalidation';
COMMENT ON COLUMN site_planner_cache.site_plan IS 'Complete SitePlannerOutput JSON';
COMMENT ON COLUMN site_planner_cache.expires_at IS 'Cache entries expire after 7 days by default';
