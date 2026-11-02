-- Additive migration; the app also creates this table on first use.
CREATE TABLE IF NOT EXISTS "HomepageSound" (
  id TEXT PRIMARY KEY,
  url TEXT,
  name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false
);
