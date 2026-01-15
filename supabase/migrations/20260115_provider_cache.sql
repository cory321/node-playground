-- Provider Cache Table
-- Stores discovered provider data with expiration for caching

CREATE TABLE IF NOT EXISTS provider_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  providers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(query, city)
);

-- Index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_provider_cache_expires ON provider_cache(expires_at);

-- Index for city-based lookups
CREATE INDEX IF NOT EXISTS idx_provider_cache_city ON provider_cache(city);

-- RLS Policies (if using Supabase auth)
-- Uncomment if you want to restrict access
-- ALTER TABLE provider_cache ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON provider_cache FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON provider_cache FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update" ON provider_cache FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete" ON provider_cache FOR DELETE USING (true);

COMMENT ON TABLE provider_cache IS 'Cache for provider discovery results with 7-day default expiration';
COMMENT ON COLUMN provider_cache.query IS 'Service category query (e.g., "appliance repair")';
COMMENT ON COLUMN provider_cache.city IS 'City name for the search';
COMMENT ON COLUMN provider_cache.state IS 'State abbreviation (optional)';
COMMENT ON COLUMN provider_cache.providers IS 'JSON array of ProviderData objects with scores';
COMMENT ON COLUMN provider_cache.expires_at IS 'Cache expiration timestamp';
