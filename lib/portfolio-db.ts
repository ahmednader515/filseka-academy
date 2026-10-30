import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { portfolioSchema, type PortfolioInput, type PortfolioWork } from "./portfolio-content";

let schemaReady: Promise<void> | undefined;
async function ensureSchema() {
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "PortfolioWork" (id TEXT PRIMARY KEY, content JSONB NOT NULL, is_published BOOLEAN NOT NULL DEFAULT false, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  })().catch((error) => { schemaReady = undefined; throw error; });
  await schemaReady;
}

export async function listPortfolioWorks(publishedOnly = true): Promise<PortfolioWork[]> {
  await ensureSchema();
  const rows = publishedOnly
    ? await sql`SELECT id, content FROM "PortfolioWork" WHERE is_published = true ORDER BY sort_order ASC, created_at DESC`
    : await sql`SELECT id, content FROM "PortfolioWork" ORDER BY sort_order ASC, created_at DESC`;
  return rows.flatMap((row) => {
    const parsed = portfolioSchema.safeParse(row.content);
    return parsed.success ? [{ ...parsed.data, id: String(row.id) }] : [];
  });
}

export async function savePortfolioWork(data: PortfolioInput, existingId?: string): Promise<string | null> {
  await ensureSchema();
  const content = JSON.stringify(data);
  if (existingId) {
    const rows = await sql`UPDATE "PortfolioWork" SET content = ${content}::jsonb, is_published = ${data.isPublished}, sort_order = ${data.order}, updated_at = NOW() WHERE id = ${existingId} RETURNING id`;
    return rows.length ? existingId : null;
  }
  const id = randomUUID();
  await sql`INSERT INTO "PortfolioWork" (id, content, is_published, sort_order) VALUES (${id}, ${content}::jsonb, ${data.isPublished}, ${data.order})`;
  return id;
}
