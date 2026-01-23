-- Local Knowledge Cache Table
-- Stores generated local knowledge data with 30-day expiration for caching

CREATE TABLE IF NOT EXISTS local_knowledge_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,  -- Format: city-state-category (slugified, lowercase)
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for faster cache key lookups
CREATE INDEX IF NOT EXISTS idx_local_knowledge_cache_key ON local_knowledge_cache(cache_key);

-- Index for expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_local_knowledge_expires ON local_knowledge_cache(expires_at);

-- RLS Policies (if using Supabase auth)
-- Uncomment if you want to restrict access
-- ALTER TABLE local_knowledge_cache ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON local_knowledge_cache FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON local_knowledge_cache FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update" ON local_knowledge_cache FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete" ON local_knowledge_cache FOR DELETE USING (true);

COMMENT ON TABLE local_knowledge_cache IS 'Cache for local knowledge generation results with 30-day default expiration';
COMMENT ON COLUMN local_knowledge_cache.cache_key IS 'Unique key in format: city-state-category (slugified, lowercase)';
COMMENT ON COLUMN local_knowledge_cache.data IS 'JSON object containing LocalKnowledgeOutput data';
COMMENT ON COLUMN local_knowledge_cache.expires_at IS 'Cache expiration timestamp (30 days from creation)';
