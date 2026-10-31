# Prisma setup

Run these commands from the project root:

```sh
npx prisma db push
npx prisma generate
npx prisma studio
```

Studio opens at http://localhost:5555. To run it without opening a browser:

```sh
npx prisma studio --browser none
```

The CLI loads the same environment files as Next.js, including `.env.local` and
`.env`. Set `DATABASE_URL` to the PostgreSQL connection string. Optionally set
`DIRECT_URL` for CLI schema operations and Studio; the application client uses
`DATABASE_URL`. Do not put credentials in the schema or commit environment files.

The schema was introspected from the existing database and contains all 32
current tables, including certificates, lesson completion, subscriptions, and
the retained homework tables. It preserves database column names, foreign keys,
timestamps, defaults, and indexes. The `partialIndexes` preview feature preserves
the existing conditional unique index on student copyright codes. Existing
PostgreSQL check constraints remain enforced by the database, although Prisma
does not represent them in the schema. When creating a separate empty database,
the original check constraints need to be applied through the SQL setup scripts.

Prisma 7.10.1 is pinned for the CLI, Client, and PostgreSQL adapter. Client output
is generated under `generated/prisma` and is ignored by Git. `postinstall` runs
generation; it can also be run explicitly using `npm run db:generate`.

Import the server-side singleton to write Prisma queries:

```ts
import { prisma } from "@/lib/prisma";

const courses = await prisma.course.findMany({
  where: { isPublished: true },
});
```

The current application queries in `lib/db.ts` still use Neon SQL. They operate
on the same database and are compatible with this Prisma setup; this change
does not rewrite the application's data layer. Keep the Prisma schema updated
when adding database columns in those SQL helpers. After intentional database
changes outside Prisma, run `npm run db:pull` and `npm run db:generate`.

Useful scripts:

- `npm run db:validate`: validate the schema.
- `npm run db:push`: sync schema changes without migrations.
- `npm run db:generate`: regenerate Prisma Client.
- `npm run db:studio`: open Studio.
- `npm run db:check`: run a read-only Prisma Client connection check.

`db push` and `generate` are separate commands in Prisma 7. The existing database
was already in sync when this setup was verified; no data-loss flags were used.
For schema changes requiring tracked deployment history, establish a migration
baseline before using `prisma migrate`. Do not reset an existing database to
create that baseline.
