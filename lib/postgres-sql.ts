import { Pool, type QueryResultRow } from "pg";

type Rows = QueryResultRow[];
type QueryPart = { strings: readonly string[]; values: unknown[] };

// Queries stay lazy so fragments can be nested and transactions can execute
// every statement on the same connection before any statement is awaited.
class SqlQuery implements PromiseLike<Rows> {
  private result?: Promise<Rows>;

  constructor(readonly part: QueryPart, private readonly pool: Pool) {}

  compile(values: unknown[] = []): { text: string; values: unknown[] } {
    let text = this.part.strings[0];
    this.part.values.forEach((value, index) => {
      if (value instanceof SqlQuery) {
        text += value.compile(values).text;
      } else {
        values.push(value);
        text += `$${values.length}`;
      }
      text += this.part.strings[index + 1];
    });
    return { text, values };
  }

  private execute(): Promise<Rows> {
    this.result ??= this.pool.query(this.compile()).then((result) => result.rows);
    return this.result;
  }

  then<TResult1 = Rows, TResult2 = never>(
    onfulfilled?: ((rows: Rows) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected: (reason: unknown) => TResult | PromiseLike<TResult>) {
    return this.execute().catch(onrejected);
  }
}

const globalForSql = globalThis as unknown as { academySqlPool?: Pool };

export function createPostgresSql(connectionString: string) {
  const pool = globalForSql.academySqlPool ?? new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  });
  if (!globalForSql.academySqlPool) {
    pool.on("error", (error) => console.error("PostgreSQL idle connection error:", error.message));
    globalForSql.academySqlPool = pool;
  }

  function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlQuery {
    return new SqlQuery({ strings, values }, pool);
  }

  sql.transaction = async (queries: SqlQuery[]): Promise<Rows[]> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const results: Rows[] = [];
      for (const query of queries) {
        results.push((await client.query(query.compile())).rows);
      }
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  };

  return sql;
}
