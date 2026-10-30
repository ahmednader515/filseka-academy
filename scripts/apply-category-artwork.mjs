import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { access } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
const sql = neon(process.env.DATABASE_URL);
const keys = ["acting", "podcasting", "presenting", "content-editing", "filmmaking", "general"];
for (const key of keys) await access(new URL(`../public/category-artwork/${key}.webp`, import.meta.url));
const result = await sql.transaction(keys.map((key) => key === "general"
  ? sql`UPDATE "Category" SET image_url = '/category-artwork/general.webp', updated_at = NOW() WHERE slug = 'courses-1793012040669' RETURNING slug`
  : sql`UPDATE "Category" SET image_url = ${`/category-artwork/${key}.webp`}, updated_at = NOW() WHERE id = ${`demo-media-category-${key}`} RETURNING slug`
));
console.log("Category artwork applied:", result.flat().map((row) => row.slug));
