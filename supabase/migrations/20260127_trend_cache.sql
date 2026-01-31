-- Create trend_cache table for storing Google Trends validation data
-- Cache expires after 30 days

CREATE TABLE IF NOT EXISTS trend_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    keyword TEXT NOT NULL,
    geo TEXT NOT NULL DEFAULT 'US',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on cache_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_trend_cache_cache_key ON trend_cache(cache_key);

-- Create index on created_at for cache expiry cleanup
CREATE INDEX IF NOT EXISTS idx_trend_cache_created_at ON trend_cache(created_at);

-- Add RLS policies
ALTER TABLE trend_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache
CREATE POLICY "Allow read access to trend_cache" ON trend_cache
    FOR SELECT USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access to trend_cache" ON trend_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trend_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_trend_cache_updated_at
    BEFORE UPDATE ON trend_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_trend_cache_updated_at();
