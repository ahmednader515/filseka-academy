import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => Object.hasOwn(overrides, name) ? overrides[name] : originalRequire(name);
  mod._compile(compiled, filename);
  return mod.exports;
}

const content = load("lib/blog-content.ts");
const { blogSchema, blogSlug, blogSummary, readingMinutes } = content;
const draft = { title: "اختبار المدونة", slug: `test-${randomUUID()}`, category: "tips", body: "نص مسودة خاصة" };
assert(blogSchema.safeParse(draft).success);
assert.equal(blogSlug("  مرحبًا، بالعالم!  "), "مرحبا-بالعالم");
assert.equal(blogSlug("A New Article!"), "a-new-article");
assert(!blogSchema.safeParse({ ...draft, slug: "../private" }).success);
assert(!blogSchema.safeParse({ ...draft, slug: "demo-private" }).success);
assert(!blogSchema.safeParse({ ...draft, imageUrl: "javascript:alert(1)" }).success);
assert(!blogSchema.safeParse({ ...draft, imageUrl: "//example.com/image.png" }).success);
assert(!blogSchema.safeParse({ ...draft, category: "unknown" }).success);
assert(!blogSchema.safeParse({ ...draft, isPublished: true }).success);
assert(!blogSchema.safeParse({ ...draft, isPublished: true, excerpt: "A complete excerpt", body: "short" }).success);
assert(blogSchema.safeParse({ ...draft, isPublished: true, excerpt: "A complete excerpt", body: "Full article content. ".repeat(20) }).success);
assert.equal(readingMinutes("word ".repeat(401)), 3);
const summary = blogSummary(content.BLOG_DEMOS[0]);
assert(!("body" in summary));
assert(summary.readingMinutes >= 1);

const { BlogBody } = load("components/BlogBody.tsx");
const markup = renderToStaticMarkup(createElement(BlogBody, { body: '## Heading\n\n**Bold**\n\n- Item one\n- Item two\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n[safe](https://example.com)' }));
assert(markup.includes("<h2>Heading</h2>"));
assert(markup.includes("<strong>Bold</strong>"));
assert(markup.includes("<ul>"));
assert(!markup.includes("<script>"));
assert(!markup.includes('href="javascript:'));
assert(markup.includes('href="https://example.com/"'));
assert(markup.includes("noopener noreferrer"));
const adjacentList = renderToStaticMarkup(createElement(BlogBody, { body: "## Heading\n- First item\n- Second item\n### Subheading\nParagraph" }));
assert(adjacentList.includes("<h2>Heading</h2><ul>"));
assert(adjacentList.includes("</ul><h3>Subheading</h3><p>Paragraph</p>"));
console.log("PASS: blog schema, Arabic slugs, publishing requirements, summaries, safe body formatting");

const deleteId = randomUUID();
let deletedId;
let deleteCalls = 0;
let deleteResult = true;
let deleteError;
let session = { user: { id: "admin", role: "ADMIN" } };
const invalidated = [];
const route = load("app/api/dashboard/blog/route.ts", {
  "next-auth": { getServerSession: async () => session },
  "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
  "@/lib/auth": { authOptions: {} },
  "@/lib/blog-content": content,
  "@/lib/request-origin": load("lib/request-origin.ts"),
  "@/lib/blog-db": {
    saveBlogPost: async () => deleteId,
    deleteBlogPost: async (id) => { deleteCalls++; deletedId = id; if (deleteError) throw deleteError; return deleteResult; },
  },
});
const { NextRequest } = require("next/server");
const deletion = (id = deleteId, origin = "https://academy.test") => route.DELETE(new NextRequest(`https://academy.test/api/dashboard/blog?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { origin } }));
for (const unauthorized of [null, { user: { id: "student", role: "STUDENT" } }]) {
  session = unauthorized;
  assert.equal((await deletion()).status, 403);
}
session = { user: { id: "admin", role: "ADMIN" } };
assert.equal((await deletion(deleteId, "https://other.test")).status, 403);
assert.equal((await deletion("invalid")).status, 400);
assert.equal(deleteCalls, 0);
assert.equal((await deletion()).status, 200);
assert.equal(deletedId, deleteId);
assert.deepEqual(invalidated, [["/blog", "layout"], ["/dashboard/blog"]]);
session.user.role = "ASSISTANT_ADMIN";
assert.equal((await deletion()).status, 200);
deleteResult = false;
assert.equal((await deletion()).status, 404);
const successfulInvalidations = invalidated.length;
deleteError = Object.assign(new Error("Database unavailable"), { code: "08006" });
const originalConsoleError = console.error;
let failureLogged = false;
try {
  console.error = () => { failureLogged = true; };
  assert.equal((await deletion()).status, 503);
} finally { console.error = originalConsoleError; }
assert(failureLogged);
assert.equal(invalidated.length, successfulInvalidations);

let deletionQuery;
const deletionDb = load("lib/blog-db.ts", {
  "server-only": {},
  "./blog-content": content,
  "@/lib/db": { sql: async (strings, ...values) => {
    if (strings.join("").startsWith('DELETE FROM "BlogPost"')) { deletionQuery = { strings, values }; return [{ id: values[0] }]; }
    return [];
  } },
});
assert.equal(await deletionDb.deleteBlogPost(deleteId), true);
assert.deepEqual(deletionQuery.values, [deleteId]);
assert.equal(deletionQuery.strings.join("?"), 'DELETE FROM "BlogPost" WHERE id = ? RETURNING id');
console.log("PASS: blog deletion authorization, origin checks, validation, cache invalidation, missing posts, failures and parameterized SQL");

const oldAuthUrl = process.env.NEXTAUTH_URL;
const oldAuthAlias = process.env.AUTH_URL;
try {
  deleteError = undefined;
  deleteResult = true;
  delete process.env.AUTH_URL;
  process.env.NEXTAUTH_URL = "https://felseka-academy.com";
  const proxiedRequest = (method, origin, extra = {}) => new NextRequest(`http://localhost:3000/api/dashboard/blog?id=${deleteId}`, {
    method, headers: { origin, "content-type": "application/json", ...extra },
    ...(method === "DELETE" ? {} : { body: JSON.stringify({ ...draft, id: deleteId }) }),
  });
  for (const method of ["POST", "PATCH", "DELETE"]) {
    assert.equal((await route[method](proxiedRequest(method, "https://felseka-academy.com"))).status, method === "POST" ? 201 : 200);
    const rejected = await route[method](proxiedRequest(method, "https://evil.example"));
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).code, "INVALID_ORIGIN");
  }
  delete process.env.NEXTAUTH_URL;
  assert.equal((await route.POST(proxiedRequest("POST", "https://felseka-academy.com", { host: "felseka-academy.com", "x-forwarded-proto": "https" }))).status, 201);
  assert.equal((await route.POST(proxiedRequest("POST", "https://evil.example", { host: "felseka-academy.com", "x-forwarded-proto": "https", "x-forwarded-host": "evil.example" }))).status, 403);
  assert.equal((await route.POST(proxiedRequest("POST", "http://localhost:3000"))).status, 201);
} finally {
  if (oldAuthUrl === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = oldAuthUrl;
  if (oldAuthAlias === undefined) delete process.env.AUTH_URL; else process.env.AUTH_URL = oldAuthAlias;
}
console.log("PASS: blog creation, editing and deletion behind HTTPS reverse proxies; foreign origins remain blocked");

if (process.argv.includes("--database")) {
  require("dotenv/config");
  const { neon } = require("@neondatabase/serverless");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required");
  const sql = neon(process.env.DATABASE_URL);
  const db = load("lib/blog-db.ts", { "server-only": {}, "@/lib/db": { sql }, "./blog-content": content });
  let id;
  try {
    id = await db.saveBlogPost(blogSchema.parse(draft), "blog-integration-test");
    assert(id);
    const saved = (await db.listBlogPosts(false)).find((post) => post.id === id);
    assert(saved);
    assert.equal(saved.isPublished, false);
    assert.equal(saved.publishedAt, null);
    assert.equal(await db.getPublicBlogPost(draft.slug), null);
    assert(!(await db.listBlogPosts()).some((post) => post.id === id));
    await db.saveBlogPost(blogSchema.parse({ ...draft, title: "Updated private draft" }), "blog-integration-test", id);
    assert.equal((await db.listBlogPosts(false)).find((post) => post.id === id)?.title, "Updated private draft");
    await assert.rejects(() => db.saveBlogPost(blogSchema.parse(draft), "blog-integration-test"), (error) => error.code === "23505");
    assert.equal(await db.saveBlogPost(blogSchema.parse(draft), "blog-integration-test", randomUUID()), null);
    console.log("PASS: database draft creation, editing, duplicate slugs and public draft isolation");
  } finally {
    if (id) await sql`DELETE FROM "BlogPost" WHERE id = ${id} AND created_by = 'blog-integration-test' AND is_published = false`;
  }
}
