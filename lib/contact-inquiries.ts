import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";

let schemaReady: Promise<void> | undefined;
async function ensureSchema() {
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "ContactInquiry" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      interest TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS contact_inquiry_email_created ON "ContactInquiry" (email, created_at DESC)`;
  })().catch((error) => { schemaReady = undefined; throw error; });
  await schemaReady;
}

export type ContactInquiry = { id: string; name: string; email: string; phone: string; interest: string; message: string; created_at: string };

export async function saveContactInquiry(data: Omit<ContactInquiry, "id" | "created_at">): Promise<string | null> {
  await ensureSchema();
  const id = randomUUID();
  // One short transaction serializes submissions per email across server instances.
  const result = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${data.email}))`,
    sql`INSERT INTO "ContactInquiry" (id, name, email, phone, interest, message)
      SELECT ${id}, ${data.name}, ${data.email}, ${data.phone}, ${data.interest}, ${data.message}
      WHERE NOT EXISTS (SELECT 1 FROM "ContactInquiry" WHERE email = ${data.email} AND created_at > NOW() - INTERVAL '1 minute')
      RETURNING id`,
  ]);
  return result[1].length ? id : null;
}

export async function listContactInquiries(page: number) {
  await ensureSchema();
  const offset = (page - 1) * 25;
  return await sql`SELECT id, name, email, phone, interest, message, created_at FROM "ContactInquiry" ORDER BY created_at DESC, id DESC LIMIT 26 OFFSET ${offset}` as ContactInquiry[];
}
