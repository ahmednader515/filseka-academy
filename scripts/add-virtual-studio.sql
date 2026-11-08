-- Virtual studio exercises and private student audio submissions.
CREATE TABLE IF NOT EXISTS "StudioExercise" (
      id TEXT PRIMARY KEY, title VARCHAR(200) NOT NULL, instructions TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE, created_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS "StudioRecording" (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES "StudioExercise"(id) ON DELETE SET NULL,
      title VARCHAR(200) NOT NULL, source TEXT NOT NULL CHECK (source IN ('recording', 'upload')),
      object_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 104857600),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready')),
      feedback TEXT, score INTEGER CHECK (score BETWEEN 0 AND 100),
      reviewed_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS studio_recordings_student_idx ON "StudioRecording" (student_id, created_at DESC);
