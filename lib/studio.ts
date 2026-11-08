import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import type { StudioData, StudioRecording } from "./studio-shared";

let schemaReady: Promise<void> | undefined;
export function ensureStudioSchema() {
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "StudioExercise" (
      id TEXT PRIMARY KEY, title VARCHAR(200) NOT NULL, instructions TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE, created_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS "StudioRecording" (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES "StudioExercise"(id) ON DELETE SET NULL,
      title VARCHAR(200) NOT NULL, source TEXT NOT NULL CHECK (source IN ('recording', 'upload')),
      object_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 104857600),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready')),
      feedback TEXT, score INTEGER CHECK (score BETWEEN 0 AND 100),
      reviewed_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS studio_recordings_student_idx ON "StudioRecording" (student_id, created_at DESC)`;
  })().catch((error) => { schemaReady = undefined; throw error; });
  return schemaReady;
}

export async function getStudioData(userId: string, admin: boolean): Promise<StudioData> {
  await ensureStudioSchema();
  const exercises = admin
    ? await sql`SELECT id, title, instructions, active FROM "StudioExercise" ORDER BY created_at DESC`
    : await sql`SELECT id, title, instructions, active FROM "StudioExercise" WHERE active = TRUE ORDER BY created_at DESC`;
  const recordings = await sql`
    SELECT r.id, r.student_id, u.name AS student_name, r.title, r.exercise_id, e.title AS exercise_title,
      r.source, r.size_bytes, r.feedback, r.score, reviewer.name AS reviewer_name, r.created_at, r.reviewed_at
    FROM "StudioRecording" r JOIN "User" u ON u.id = r.student_id
    LEFT JOIN "StudioExercise" e ON e.id = r.exercise_id
    LEFT JOIN "User" reviewer ON reviewer.id = r.reviewed_by_id
    WHERE r.status = 'ready' AND (${admin} = TRUE OR r.student_id = ${userId})
    ORDER BY r.created_at DESC
  `;
  return JSON.parse(JSON.stringify({ exercises, recordings })) as StudioData;
}

export async function createStudioUpload(data: {
  studentId: string; title: string; exerciseId: string | null;
  source: "recording" | "upload"; mime: string; size: number; originalId?: string;
}) {
  await ensureStudioSchema();
  if (data.exerciseId) {
    const exercises = await sql`SELECT id FROM "StudioExercise" WHERE id = ${data.exerciseId}
      AND (active = TRUE OR EXISTS (SELECT 1 FROM "StudioRecording" WHERE id = ${data.originalId ?? null}
        AND student_id = ${data.studentId} AND status = 'ready' AND exercise_id = ${data.exerciseId}))`;
    if (!exercises.length) return null;
  }
  const id = randomUUID();
  const key = `studio/${data.studentId}/${id}`;
  await sql`INSERT INTO "StudioRecording" (id, student_id, exercise_id, title, source, object_key, mime_type, size_bytes)
    VALUES (${id}, ${data.studentId}, ${data.exerciseId}, ${data.title}, ${data.source}, ${key}, ${data.mime}, ${data.size})`;
  return { id, key };
}

export async function getStudioFile(id: string, userId: string, admin: boolean) {
  await ensureStudioSchema();
  const rows = await sql`SELECT object_key, mime_type, size_bytes, status, title FROM "StudioRecording"
    WHERE id = ${id} AND (${admin} = TRUE OR student_id = ${userId}) LIMIT 1`;
  return rows[0] as { object_key: string; mime_type: string; size_bytes: number; status: string; title: string } | undefined;
}

export async function completeStudioUpload(id: string, userId: string) {
  await sql`UPDATE "StudioRecording" SET status = 'ready' WHERE id = ${id} AND student_id = ${userId}`;
}

export async function editStudioRecording(id: string, studentId: string, title: string, exerciseId: string | null) {
  await ensureStudioSchema();
  const rows = await sql`UPDATE "StudioRecording" SET title = ${title}, exercise_id = ${exerciseId}
    WHERE id = ${id} AND student_id = ${studentId} AND status = 'ready'
      AND (${exerciseId}::TEXT IS NULL OR exercise_id = ${exerciseId}
        OR EXISTS (SELECT 1 FROM "StudioExercise" WHERE id = ${exerciseId} AND active = TRUE))
    RETURNING id`;
  return rows.length > 0;
}

export async function deleteStudioRecording(id: string, studentId: string, objectKey: string) {
  const rows = await sql`DELETE FROM "StudioRecording"
    WHERE id = ${id} AND student_id = ${studentId} AND object_key = ${objectKey} RETURNING id`;
  return rows.length > 0;
}

// Both records are owner-scoped. The original is only removed once the new audio
// is verified; a new submission starts without feedback for the previous take.
export async function replaceStudioRecording(originalId: string, newId: string, studentId: string) {
  const rows = await sql`
    WITH removed AS (
      DELETE FROM "StudioRecording" WHERE id = ${originalId} AND student_id = ${studentId} AND status = 'ready'
        AND EXISTS (SELECT 1 FROM "StudioRecording" WHERE id = ${newId} AND student_id = ${studentId} AND status = 'pending')
      RETURNING object_key
    ), completed AS (
      UPDATE "StudioRecording" SET status = 'ready'
      WHERE id = ${newId} AND student_id = ${studentId} AND status = 'pending' AND EXISTS (SELECT 1 FROM removed)
      RETURNING id
    ) SELECT removed.object_key FROM removed, completed
  `;
  return rows[0]?.object_key as string | undefined;
}

export async function saveStudioExercise(id: string | null, title: string, instructions: string, active: boolean, adminId: string) {
  await ensureStudioSchema();
  if (id) {
    const rows = await sql`UPDATE "StudioExercise" SET title = ${title}, instructions = ${instructions}, active = ${active} WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
  await sql`INSERT INTO "StudioExercise" (id, title, instructions, active, created_by_id)
    VALUES (${randomUUID()}, ${title}, ${instructions}, ${active}, ${adminId})`;
  return true;
}

export async function reviewStudioRecording(id: string, feedback: string, score: number | null, adminId: string) {
  await ensureStudioSchema();
  const rows = await sql`UPDATE "StudioRecording" SET feedback = ${feedback}, score = ${score},
    reviewed_by_id = ${adminId}, reviewed_at = NOW() WHERE id = ${id} AND status = 'ready' RETURNING id`;
  return rows.length > 0;
}

export type { StudioRecording };
