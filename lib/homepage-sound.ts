import { sql } from "@/lib/db";

export type HomepageSoundTrack = { url: string; name: string };
export type HomepageSoundTrackAction = "remove" | "up" | "down";
export type HomepageSoundSetting = { tracks: HomepageSoundTrack[]; enabled: boolean };
let schema: Promise<void> | undefined;
function ensureSchema() {
  schema ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "HomepageSound" (id TEXT PRIMARY KEY, url TEXT, name TEXT, enabled BOOLEAN NOT NULL DEFAULT false)`;
    await sql`ALTER TABLE "HomepageSound" ADD COLUMN IF NOT EXISTS tracks JSONB`;
  })().catch((error) => { schema = undefined; throw error; });
  return schema;
}
export async function getHomepageSound(): Promise<HomepageSoundSetting> {
  await ensureSchema();
  const rows = await sql`SELECT url, name, tracks, enabled FROM "HomepageSound" WHERE id = 'default'`;
  const row = rows[0];
  const tracks = row?.tracks as HomepageSoundTrack[] | null;
  return { tracks: tracks ?? (row?.url ? [{ url: row.url as string, name: (row.name as string) || "Audio" }] : []), enabled: Boolean(row?.enabled) };
}
export async function saveHomepageSound(url: string, name: string) {
  await ensureSchema();
  const tracks = JSON.stringify([{ url, name }]);
  await sql`INSERT INTO "HomepageSound" (id, tracks, enabled) VALUES ('default', ${tracks}::jsonb, true)
    ON CONFLICT (id) DO UPDATE SET tracks = COALESCE("HomepageSound".tracks,
      CASE WHEN "HomepageSound".url IS NOT NULL THEN jsonb_build_array(jsonb_build_object('url', "HomepageSound".url, 'name', COALESCE("HomepageSound".name, 'Audio'))) ELSE '[]'::jsonb END)
      || EXCLUDED.tracks, enabled = true`;
}
export async function changeHomepageSound(enabled: boolean, remove: boolean) {
  await ensureSchema();
  if (remove) await sql`UPDATE "HomepageSound" SET tracks = '[]'::jsonb, url = NULL, name = NULL, enabled = false WHERE id = 'default'`;
  else await sql`UPDATE "HomepageSound" SET enabled = ${enabled} WHERE id = 'default' AND (jsonb_array_length(tracks) > 0 OR (tracks IS NULL AND url IS NOT NULL))`;
}

export async function editHomepageSoundTrack(url: string, action: HomepageSoundTrackAction): Promise<boolean> {
  const current = await getHomepageSound();
  const index = current.tracks.findIndex((track) => track.url === url);
  if (index < 0) return false;
  const tracks = [...current.tracks];
  if (action === "remove") tracks.splice(index, 1);
  else {
    const target = index + (action === "up" ? -1 : 1);
    if (target < 0 || target >= tracks.length) return true;
    [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
  }
  // Avoid overwriting uploads or edits made by another administrator while saving.
  const rows = await sql`UPDATE "HomepageSound" SET tracks = ${JSON.stringify(tracks)}::jsonb,
    url = NULL, name = NULL, enabled = CASE WHEN ${tracks.length} = 0 THEN false ELSE enabled END
    WHERE id = 'default' AND COALESCE(tracks,
      CASE WHEN url IS NOT NULL THEN jsonb_build_array(jsonb_build_object('url', url, 'name', COALESCE(name, 'Audio'))) ELSE '[]'::jsonb END)
      = ${JSON.stringify(current.tracks)}::jsonb RETURNING id`;
  return rows.length > 0;
}
