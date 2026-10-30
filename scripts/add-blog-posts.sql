CREATE TABLE IF NOT EXISTS "BlogPost" (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS blog_post_published_date ON "BlogPost" (is_published, published_at DESC);
