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
