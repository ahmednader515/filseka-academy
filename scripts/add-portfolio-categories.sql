-- The application also creates and seeds this table automatically on first use.
CREATE TABLE IF NOT EXISTS "PortfolioCategorySettings" (id TEXT PRIMARY KEY, categories JSONB NOT NULL);
INSERT INTO "PortfolioCategorySettings" (id, categories) VALUES ('default', '[
  {"id":"programs","ar":"برامج تلفزيونية","en":"TV programs","icon":"video"},
  {"id":"podcasts","ar":"بودكاست","en":"Podcasts","icon":"mic"},
  {"id":"projects","ar":"مشاريع المتدربين","en":"Student projects","icon":"users"},
  {"id":"events","ar":"تغطيات وفعاليات","en":"Events","icon":"broadcast"},
  {"id":"backstage","ar":"كواليس الإنتاج","en":"Behind the scenes","icon":"camera"}
]'::jsonb) ON CONFLICT DO NOTHING;
