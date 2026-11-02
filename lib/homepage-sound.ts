import { sql } from "@/lib/db";

export type HomepageSoundSetting = { url: string | null; name: string | null; enabled: boolean };
let schema: Promise<void> | undefined;
function ensureSchema() {
  schema ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "HomepageSound" (id TEXT PRIMARY KEY, url TEXT, name TEXT, enabled BOOLEAN NOT NULL DEFAULT false)`;
  })().catch((error) => { schema = undefined; throw error; });
  return schema;
}
export async function getHomepageSound(): Promise<HomepageSoundSetting> {
  await ensureSchema();
  const rows = await sql`SELECT url, name, enabled FROM "HomepageSound" WHERE id = 'default'`;
  return rows[0] ? { url: rows[0].url as string | null, name: rows[0].name as string | null, enabled: Boolean(rows[0].enabled) } : { url: null, name: null, enabled: false };
}
export async function saveHomepageSound(url: string, name: string) {
  await ensureSchema();
  await sql`INSERT INTO "HomepageSound" (id, url, name, enabled) VALUES ('default', ${url}, ${name}, true)
    ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, name = EXCLUDED.name, enabled = true`;
}
export async function changeHomepageSound(enabled: boolean, remove: boolean) {
  await ensureSchema();
  if (remove) await sql`UPDATE "HomepageSound" SET url = NULL, name = NULL, enabled = false WHERE id = 'default'`;
  else await sql`UPDATE "HomepageSound" SET enabled = ${enabled} WHERE id = 'default' AND url IS NOT NULL`;
}
