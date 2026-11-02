import { randomBytes, randomUUID } from "node:crypto";
import { sql } from "@/lib/db";

let schema: Promise<void> | undefined;
export function ensureUploadedCertificateSchema() {
  if (!schema) schema = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "UploadedCertificate" (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      recipient_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
      student_name TEXT, file_key TEXT NOT NULL, file_type TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE, created_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), redeemed_at TIMESTAMPTZ
    )`;
    await sql`ALTER TABLE "UploadedCertificate" ALTER COLUMN recipient_id DROP NOT NULL, ALTER COLUMN student_name DROP NOT NULL`;
    await sql`UPDATE "UploadedCertificate" SET recipient_id = NULL, student_name = NULL WHERE redeemed_at IS NULL AND recipient_id IS NOT NULL`;
  })().catch((error) => { schema = undefined; throw error; });
  return schema;
}

export type UploadedCertificate = { id: string; title: string; recipient_id: string | null; student_name: string | null; file_key: string; file_type: string; code: string; created_at: string; redeemed_at: string | null };

export async function createUploadedCertificate(input: { title: string; fileKey: string; fileType: string; adminId: string }) {
  await ensureUploadedCertificateSchema();
  const id = randomUUID();
  const code = `CERT-${randomBytes(12).toString("hex").toUpperCase()}`;
  const rows = await sql`INSERT INTO "UploadedCertificate" (id, title, file_key, file_type, code, created_by_id)
    VALUES (${id}, ${input.title}, ${input.fileKey}, ${input.fileType}, ${code}, ${input.adminId}) RETURNING id, code`;
  return rows[0] as { id: string; code: string };
}

export async function listUploadedCertificates(userId?: string) {
  await ensureUploadedCertificateSchema();
  const rows = userId
    ? await sql`SELECT id, title, student_name, file_type, redeemed_at FROM "UploadedCertificate" WHERE recipient_id = ${userId} AND redeemed_at IS NOT NULL ORDER BY redeemed_at DESC`
    : await sql`SELECT id, title, student_name, file_type, code, created_at, redeemed_at FROM "UploadedCertificate" ORDER BY created_at DESC`;
  return rows as (Pick<UploadedCertificate, "id" | "title" | "student_name" | "file_type" | "redeemed_at"> & { code?: string })[];
}

export async function redeemUploadedCertificate(userId: string, code: string) {
  await ensureUploadedCertificateSchema();
  // The first student to redeem the code becomes its owner, atomically.
  const rows = await sql`UPDATE "UploadedCertificate" AS certificate
    SET redeemed_at = NOW(), recipient_id = student.id, student_name = student.name
    FROM "User" AS student
    WHERE certificate.code = ${code.trim().toUpperCase()} AND certificate.redeemed_at IS NULL
    AND student.id = ${userId} AND student.role = 'STUDENT' RETURNING certificate.id`;
  return rows[0] ? String(rows[0].id) : null;
}

export async function getUploadedCertificateFile(id: string, userId: string, admin: boolean) {
  await ensureUploadedCertificateSchema();
  const rows = await sql`SELECT file_key, file_type FROM "UploadedCertificate" WHERE id = ${id}
    AND (${admin} OR (recipient_id = ${userId} AND redeemed_at IS NOT NULL))`;
  return rows[0] as Pick<UploadedCertificate, "file_key" | "file_type"> | undefined;
}
