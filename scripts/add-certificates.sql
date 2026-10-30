-- Additive migration. The app also runs these CREATE TABLE IF NOT EXISTS statements on first use.
CREATE TABLE IF NOT EXISTS "CertificateSettings" (
  id TEXT PRIMARY KEY,
  design JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "CertificateCourse" (
  course_id TEXT PRIMARY KEY REFERENCES "Course"(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "LessonCompletion" (
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS "CourseCertificate" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  design JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
