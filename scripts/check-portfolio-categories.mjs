import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";

function load(relative, mocks = {}) {
  const filename = path.resolve(import.meta.dirname, "..", relative);
  const mod = new Module(filename);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const content = load("lib/portfolio-content.ts");
assert(content.portfolioCategoriesSchema.safeParse(content.PORTFOLIO_CATEGORIES).success);
const extra = { id: "new-category", ar: "قسم جديد", en: "New category", icon: "video" };
for (const invalid of [[], [extra, extra], [{ ...extra, en: "" }], [{ ...extra, id: "all" }], [{ ...extra, icon: "invalid" }]]) assert(!content.portfolioCategoriesSchema.safeParse(invalid).success);
const work = { title: "Work", category: extra.id, imageUrl: "/image.png", isPublished: false, order: 0 };
assert(content.portfolioSchema.safeParse(work).success, "New category IDs must be accepted by work validation");

let categories;
const works = new Map();
const events = [];
function sql(strings, ...args) {
  const query = strings.join("?").replace(/\s+/g, " ");
  const run = () => {
    events.push(query);
    if (query.startsWith("CREATE TABLE")) return [];
    if (query.startsWith('INSERT INTO "PortfolioCategorySettings"')) { categories ??= JSON.parse(args[0]); return []; }
    if (query.includes("FOR UPDATE")) return [{ id: "default" }];
    if (query.startsWith("SELECT categories")) return [{ categories }];
    if (query.startsWith('UPDATE "PortfolioCategorySettings"')) {
      assert(query.includes("NOT EXISTS") && query.includes("work.content->>'category'"));
      const next = JSON.parse(args[0]);
      if ([...works.values()].some((item) => !next.some((category) => category.id === item.category))) return [];
      categories = next; return [{ id: "default" }];
    }
    if (query.startsWith('INSERT INTO "PortfolioWork"')) {
      assert(query.includes("WHERE EXISTS"));
      if (!categories.some((category) => category.id === args[4])) return [];
      works.set(args[0], JSON.parse(args[1])); return [{ id: args[0] }];
    }
    if (query.startsWith('UPDATE "PortfolioWork"')) {
      if (!works.has(args[3]) || !categories.some((category) => category.id === args[4])) return [];
      works.set(args[3], JSON.parse(args[0])); return [{ id: args[3] }];
    }
    throw new Error(`Unexpected query: ${query}`);
  };
  return { run, then: (resolve, reject) => Promise.resolve().then(run).then(resolve, reject) };
}
sql.transaction = async (queries) => {
  const result = [];
  for (const query of queries) result.push(await query.run());
  return result;
};
const database = load("lib/portfolio-db.ts", { "server-only": {}, "@/lib/db": { sql }, "./portfolio-content": content });
assert.equal((await database.listPortfolioCategories()).length, 5);
assert(await database.savePortfolioCategories([...categories, extra]));
const id = await database.savePortfolioWork(content.portfolioSchema.parse(work));
assert(id);
assert.equal(await database.savePortfolioWork(content.portfolioSchema.parse({ ...work, category: "missing" })), null);
assert.equal(await database.savePortfolioCategories(categories.filter((category) => category.id !== extra.id)), false);
const renamed = categories.map((category) => category.id === extra.id ? { ...category, en: "Renamed" } : category).reverse();
assert(await database.savePortfolioCategories(renamed));
assert.equal((await database.listPortfolioCategories())[0].en, "Renamed");
assert(await database.savePortfolioWork(content.portfolioSchema.parse({ ...work, category: "programs" }), id));
assert(await database.savePortfolioCategories(categories.filter((category) => category.id !== extra.id)));
for (let i = 0; i < events.length; i++) if (events[i].startsWith('UPDATE "PortfolioCategorySettings"') || events[i].startsWith('INSERT INTO "PortfolioWork"') || events[i].startsWith('UPDATE "PortfolioWork"')) assert(events[i - 1].includes("FOR UPDATE"));

let session = null;
const route = load("app/api/dashboard/portfolio/categories/route.ts", {
  "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} },
  "@/lib/request-origin": { isAllowedRequestOrigin: (request) => request.headers.get("origin") === "http://localhost" },
  "@/lib/portfolio-content": content, "@/lib/portfolio-db": database, "next/cache": { revalidatePath() {} },
});
const request = (items = categories, origin = "http://localhost") => new Request("http://localhost/api/dashboard/portfolio/categories", { method: "PUT", headers: { origin }, body: JSON.stringify(items) });
assert.equal((await route.PUT(request())).status, 403);
session = { user: { role: "TEACHER" } };
assert.equal((await route.PUT(request())).status, 403);
session = { user: { role: "ADMIN" } };
assert.equal((await route.PUT(request(categories, "https://other.example"))).status, 403);
assert.equal((await route.PUT(request([]))).status, 400);
assert.equal((await route.PUT(request(categories.filter((category) => category.id !== "programs")))).status, 409);
assert.equal((await route.PUT(request())).status, 200);
session = { user: { role: "ASSISTANT_ADMIN" } };
assert.equal((await route.PUT(request())).status, 200);
console.log("PASS: category creation, renaming, ordering, deletion, in-use protection, work validation, transaction locks, roles, and origins.");
