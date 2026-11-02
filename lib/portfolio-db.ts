import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { PORTFOLIO_CATEGORIES, portfolioSchema, portfolioCategoriesSchema, type PortfolioCategory, type PortfolioInput, type PortfolioWork } from "./portfolio-content";

let schemaReady: Promise<void> | undefined;
async function ensureSchema() {
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "PortfolioWork" (id TEXT PRIMARY KEY, content JSONB NOT NULL, is_published BOOLEAN NOT NULL DEFAULT false, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS "PortfolioCategorySettings" (id TEXT PRIMARY KEY, categories JSONB NOT NULL)`;
    await sql`INSERT INTO "PortfolioCategorySettings" (id, categories) VALUES ('default', ${JSON.stringify(PORTFOLIO_CATEGORIES)}::jsonb) ON CONFLICT DO NOTHING`;
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
    const [, rows] = await sql.transaction([
      sql`SELECT id FROM "PortfolioCategorySettings" WHERE id = 'default' FOR UPDATE`,
      sql`UPDATE "PortfolioWork" SET content = ${content}::jsonb, is_published = ${data.isPublished}, sort_order = ${data.order}, updated_at = NOW() WHERE id = ${existingId}
        AND EXISTS (SELECT 1 FROM "PortfolioCategorySettings", jsonb_array_elements(categories) AS category WHERE "PortfolioCategorySettings".id = 'default' AND category->>'id' = ${data.category}) RETURNING id`,
    ]);
    return rows.length ? existingId : null;
  }
  const id = randomUUID();
  const [, rows] = await sql.transaction([
    sql`SELECT id FROM "PortfolioCategorySettings" WHERE id = 'default' FOR UPDATE`,
    sql`INSERT INTO "PortfolioWork" (id, content, is_published, sort_order)
      SELECT ${id}, ${content}::jsonb, ${data.isPublished}, ${data.order}
      WHERE EXISTS (SELECT 1 FROM "PortfolioCategorySettings", jsonb_array_elements(categories) AS category WHERE "PortfolioCategorySettings".id = 'default' AND category->>'id' = ${data.category}) RETURNING id`,
  ]);
  return rows.length ? id : null;
}

export async function listPortfolioCategories(): Promise<PortfolioCategory[]> {
  await ensureSchema();
  const rows = await sql`SELECT categories FROM "PortfolioCategorySettings" WHERE id = 'default'`;
  return portfolioCategoriesSchema.parse(rows[0].categories);
}

export async function savePortfolioCategories(categories: PortfolioCategory[]): Promise<boolean> {
  await ensureSchema();
  const json = JSON.stringify(portfolioCategoriesSchema.parse(categories));
  // Serialize category edits with work saves so an in-use category cannot disappear.
  const [, rows] = await sql.transaction([
    sql`SELECT id FROM "PortfolioCategorySettings" WHERE id = 'default' FOR UPDATE`,
    sql`UPDATE "PortfolioCategorySettings" SET categories = ${json}::jsonb WHERE id = 'default'
      AND NOT EXISTS (SELECT 1 FROM "PortfolioWork" work WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(${json}::jsonb) category WHERE category->>'id' = work.content->>'category'
      )) RETURNING id`,
  ]);
  return rows.length > 0;
}

export async function deletePortfolioWork(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`DELETE FROM "PortfolioWork" WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
