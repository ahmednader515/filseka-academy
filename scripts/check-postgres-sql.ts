import "dotenv/config";
import assert from "node:assert/strict";
import { createPostgresSql } from "../lib/postgres-sql";

async function main() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const sql = createPostgresSql(process.env.DATABASE_URL);
  const input = "quote ' ; SELECT 99 --";
  const fragment = sql`${input}::text AS value`;
  const query = sql`SELECT ${7}::int AS before, ${fragment}, ${9}::int AS after`;
  assert.deepEqual(query.compile().values, [7, input, 9]);
  assert.deepEqual(await query, [{ before: 7, value: input, after: 9 }]);

  const results = await sql.transaction([
    sql`CREATE TEMP TABLE academy_sql_check (value int) ON COMMIT DROP`,
    sql`INSERT INTO academy_sql_check VALUES (${42})`,
    sql`SELECT value FROM academy_sql_check`,
  ]);
  assert.deepEqual(results[2], [{ value: 42 }]);

  // A session setting changed inside a failed transaction must roll back.
  const [original] = await sql`SELECT current_setting('application_name') AS name`;
  await assert.rejects(sql.transaction([
    sql`SELECT set_config('application_name', 'academy-rollback-check', false)`,
    sql`SELECT 1 / 0`,
  ]), (error: unknown) => (error as { code?: string }).code === "22012");
  const [restored] = await sql`SELECT current_setting('application_name') AS name`;
  assert.equal(restored.name, original.name);
  console.log("PostgreSQL checks passed: parameters, nested fragments, transactions, rollback.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
