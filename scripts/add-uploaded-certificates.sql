-- Additive migration; also created automatically on first use.
CREATE TABLE IF NOT EXISTS "UploadedCertificate" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  recipient_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  student_name TEXT,
  file_key TEXT NOT NULL,
  file_type TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);
-- Upgrade existing installations while preserving already redeemed certificates.
ALTER TABLE "UploadedCertificate" ALTER COLUMN recipient_id DROP NOT NULL, ALTER COLUMN student_name DROP NOT NULL;
UPDATE "UploadedCertificate" SET recipient_id = NULL, student_name = NULL WHERE redeemed_at IS NULL AND recipient_id IS NOT NULL;
