-- Additive migration; the app also creates this table on first use.
CREATE TABLE IF NOT EXISTS "HomepageSound" (
  id TEXT PRIMARY KEY,
  url TEXT,
  name TEXT,
  tracks JSONB,
  enabled BOOLEAN NOT NULL DEFAULT false
);

-- Existing installations retain their legacy sound until the playlist is edited.
ALTER TABLE "HomepageSound" ADD COLUMN IF NOT EXISTS tracks JSONB;
