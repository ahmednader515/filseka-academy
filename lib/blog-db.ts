import "server-only";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { sql } from "@/lib/db";
import { blogSchema, type BlogInput, type BlogPost } from "./blog-content";

let schemaReady: Promise<void> | undefined;
export async function ensureBlogSchema() {
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "BlogPost" (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, content JSONB NOT NULL, is_published BOOLEAN NOT NULL DEFAULT false, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by TEXT, updated_by TEXT)`;
    await sql`CREATE INDEX IF NOT EXISTS blog_post_published_date ON "BlogPost" (is_published, published_at DESC)`;
  })().catch((error) => { schemaReady = undefined; throw error; });
  await schemaReady;
}
function asPost(row: Record<string, unknown>): BlogPost | null {
  const parsed = blogSchema.safeParse(row.content);
  if (!parsed.success) return null;
  const iso = (value: unknown) => value ? new Date(value as string).toISOString() : "";
  return { ...parsed.data, id: String(row.id), slug: String(row.slug), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at), publishedAt: row.published_at ? iso(row.published_at) : null };
}
export async function listBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
  await ensureBlogSchema();
  const rows = publishedOnly ? await sql`SELECT id, slug, content, published_at, created_at, updated_at FROM "BlogPost" WHERE is_published = true ORDER BY published_at DESC NULLS LAST, created_at DESC, id DESC` : await sql`SELECT id, slug, content, published_at, created_at, updated_at FROM "BlogPost" ORDER BY updated_at DESC, id DESC`;
  return rows.flatMap((row) => { const post = asPost(row); return post ? [post] : []; });
}
export const getPublicBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  await ensureBlogSchema();
  const rows = await sql`SELECT id, slug, content, published_at, created_at, updated_at FROM "BlogPost" WHERE slug = ${slug} AND is_published = true LIMIT 1`;
  return rows[0] ? asPost(rows[0]) : null;
});
export async function saveBlogPost(data: BlogInput, userId: string, existingId?: string): Promise<string | null> {
  await ensureBlogSchema();
  const content = JSON.stringify(data);
  if (existingId) {
    const rows = await sql`UPDATE "BlogPost" SET slug = ${data.slug}, content = ${content}::jsonb, is_published = ${data.isPublished}, published_at = CASE WHEN ${data.isPublished} THEN COALESCE(published_at, NOW()) ELSE published_at END, updated_at = NOW(), updated_by = ${userId} WHERE id = ${existingId} RETURNING id`;
    return rows.length ? existingId : null;
  }
  const id = randomUUID();
  await sql`INSERT INTO "BlogPost" (id, slug, content, is_published, published_at, created_by, updated_by) VALUES (${id}, ${data.slug}, ${content}::jsonb, ${data.isPublished}, CASE WHEN ${data.isPublished} THEN NOW() ELSE NULL END, ${userId}, ${userId})`;
  return id;
}
