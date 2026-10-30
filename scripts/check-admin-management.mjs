import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(import.meta.dirname, "..");
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const designModule = load("lib/certificate-design.ts");
const { categoryInput, generateCategorySlug } = load("lib/category-validation.ts");
assert(categoryInput.safeParse({ name: "Radio", nameAr: "إذاعة" }).success);
assert.equal(generateCategorySlug("  Acting & Camera!  ", "abc123"), "acting-camera-abc123");
assert.equal(generateCategorySlug("!!!", "abc123"), "category-abc123");
assert.notEqual(generateCategorySlug("Radio", "first"), generateCategorySlug("Radio", "second"));
assert(categoryInput.safeParse({ name: "Radio", nameAr: "إذاعة", slug: generateCategorySlug("تَدْريب إذاعي", "abc123") }).success);
assert(categoryInput.safeParse({ name: "Radio", nameAr: "إذاعة", slug: "radio-training", order: 1 }).success);
for (const input of [{ slug: "has spaces" }, { order: -1 }, { imageUrl: "javascript:alert(1)" }, { name: "" }]) assert(!categoryInput.safeParse({ name: "Radio", nameAr: "إذاعة", slug: "radio", ...input }).success);
assert(!designModule.certificateDesignSchema.safeParse({ ...designModule.DEFAULT_CERTIFICATE_DESIGN, logoUrl: "//evil.example/logo.png" }).success);
assert(!designModule.certificateDesignSchema.safeParse({ ...designModule.DEFAULT_CERTIFICATE_DESIGN, accent: "red; background: url(x)" }).success);

let lessons = ["lesson-a", "lesson-b"];
let enabled = true;
let fullAccess = true;
let grants = [];
let completions = new Set();
let issued = false;
let issuedDesign;
let currentDesign = { ...designModule.DEFAULT_CERTIFICATE_DESIGN };
const queries = [];
const sql = async (parts, ...args) => {
  const query = parts.join("?").replace(/\s+/g, " ").trim(); queries.push(query);
  if (query.startsWith("CREATE TABLE")) return [];
  if (query.startsWith('SELECT id FROM "Lesson"')) return lessons.includes(args[0]) ? [{ id: args[0] }] : [];
  if (query.startsWith('INSERT INTO "LessonCompletion"')) { completions.add(args[1]); return []; }
  if (query.startsWith("SELECT l.id")) return lessons.map((id) => ({ id, completed: completions.has(id) }));
  if (query.startsWith('SELECT course_id FROM "CertificateCourse"')) return enabled ? [{ course_id: "course" }] : [];
  if (query.startsWith('SELECT design FROM "CertificateSettings"')) return [{ design: currentDesign }];
  if (query.startsWith('INSERT INTO "CourseCertificate"')) {
    assert(query.includes("ON CONFLICT (user_id, course_id) DO NOTHING"));
    assert(query.includes("AND NOT EXISTS (SELECT 1 FROM"));
    if (!issued && enabled && lessons.length && lessons.every((id) => completions.has(id))) { issued = true; issuedDesign = JSON.parse(args[1]); }
    return [];
  }
  if (query.startsWith('SELECT id FROM "CourseCertificate"')) return issued ? [{ id: "certificate" }] : [];
  throw new Error(`Unexpected query: ${query}`);
};
const database = { sql, hasFullCourseAccessAsStudent: async () => fullAccess, getAllowedLessonIdsForUserCourse: async () => grants };
const certDb = load("lib/certificates-db.ts", { "@/lib/db": database, "./certificate-design": designModule });
fullAccess = false;
await assert.rejects(certDb.completeLesson("student", "course", "lesson-a"), /FORBIDDEN/);
assert.equal(completions.size, 0);
grants = ["lesson-a"];
let progress = await certDb.completeLesson("student", "course", "lesson-a");
assert.equal(progress.certificateId, null);
await assert.rejects(certDb.completeLesson("student", "course", "lesson-b"), /FORBIDDEN/);
fullAccess = true;
progress = await certDb.completeLesson("student", "course", "lesson-b");
assert.equal(progress.certificateId, "certificate");
assert.equal(progress.completedIds.length, 2);
currentDesign = { ...currentDesign, title: "Changed title" };
await certDb.completeLesson("student", "course", "lesson-b");
assert.equal(completions.size, 2);
assert.notEqual(issuedDesign.title, currentDesign.title);
issued = false; enabled = false;
assert.equal((await certDb.getCertificateProgress("student", "course", true)).certificateId, null);
enabled = true; lessons = [];
assert.equal((await certDb.getCertificateProgress("student", "course", true)).certificateId, null);

let session = null;
const routeMocks = { "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} }, "@/lib/db": database, "@/lib/certificates-db": certDb };
const completionRoute = load("app/api/courses/[id]/completion/route.ts", routeMocks);
const params = { params: Promise.resolve({ id: "course" }) };
const request = () => new Request("http://localhost/api/courses/course/completion", { method: "POST", body: JSON.stringify({ lessonId: "lesson-a" }) });
assert.equal((await completionRoute.POST(request(), params)).status, 403);
session = { user: { id: "admin", role: "ADMIN" } };
assert.equal((await completionRoute.POST(request(), params)).status, 403);
session = { user: { id: "student", role: "STUDENT" } };
fullAccess = false; grants = [];
assert.equal((await completionRoute.GET(new Request("http://localhost"), params)).status, 403);
const certificateRoute = load("app/api/dashboard/certificates/route.ts", { ...routeMocks, "@/lib/certificate-design": designModule });
assert.equal((await certificateRoute.PUT(request())).status, 403);

const { getSidebarGroups, isSidebarLinkActive } = load("lib/sidebar-navigation.ts");
const adminLinks = getSidebarGroups("ADMIN").flatMap((g) => g.items.map((i) => i.href));
const assistantLinks = getSidebarGroups("ASSISTANT_ADMIN").flatMap((g) => g.items.map((i) => i.href));
assert(adminLinks.includes("/dashboard/categories") && adminLinks.includes("/dashboard/certificates"));
assert(assistantLinks.includes("/dashboard/categories") && !assistantLinks.includes("/dashboard/certificates"));
assert(!isSidebarLinkActive("/dashboard/courses", "/dashboard/courses/new", ""));
const css = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
const icon = load("components/AcademyIcon.tsx");
const { CertificateDocument } = load("components/CertificateDocument.tsx", { "./AcademyIcon": icon, "./CertificateDocument.module.css": css });
const html = renderToStaticMarkup(React.createElement(CertificateDocument, { design: designModule.DEFAULT_CERTIFICATE_DESIGN, studentName: "<script>alert(1)</script>", courseTitle: "Radio course", verificationId: "abc" }));
assert(html.includes("&lt;script&gt;") && !html.includes("<script>"));
assert(html.includes("Radio course") && html.includes("abc"));

const editorial = load("lib/homepage-editorial-content.ts");
const copy = load("lib/homepage-copy.ts", { "@/lib/homepage-editorial-content": editorial, "@/lib/homepage-demo-instructors": load("lib/homepage-demo-instructors.ts") });
assert.equal(new Set(copy.HOMEPAGE_COPY_FIELDS.map((f) => f.key)).size, copy.HOMEPAGE_COPY_FIELDS.length);
const overrides = JSON.stringify({ trainersHeading: { ar: "مدربونا الجدد", en: "Our new trainers" }, "milestone.training-hours.value": { ar: "+200", en: "+200" } });
assert.equal(copy.resolveHomepageCopy(overrides, "ar").trainersHeading, "مدربونا الجدد");
assert.equal(copy.resolveHomepageCopy(overrides, "en")["milestone.training-hours.value"], "+200");
const localeMock = { useLocale: () => "ar", useT: () => (_key, fallback) => fallback || _key };
const imageAttach = load("components/ImageAttachField.tsx", { "@/components/LocaleProvider": localeMock });
const linkMock = { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
const uiMocks = { "@/components/LocaleProvider": localeMock, "@/components/ImageAttachField": imageAttach, "next/navigation": { useRouter: () => ({ refresh() {} }) }, "next/link": linkMock, "../management.module.css": css };
const { CategoryManager } = load("app/dashboard/categories/CategoryManager.tsx", uiMocks);
const categoryHtml = renderToStaticMarkup(React.createElement(CategoryManager, { categories: [{ id: "cat", name: "Radio", nameAr: "إذاعة", slug: "radio", description: "Learn radio", imageUrl: "", order: 1, courses: 3 }] }));
assert(categoryHtml.includes("إذاعة") && categoryHtml.includes("3 كورس"));
assert(!categoryHtml.includes("رابط القسم"));
const { CertificateDesigner } = load("app/dashboard/certificates/CertificateDesigner.tsx", { ...uiMocks, "@/components/CertificateDocument": { CertificateDocument } });
const designerHtml = renderToStaticMarkup(React.createElement(CertificateDesigner, { initial: { design: designModule.DEFAULT_CERTIFICATE_DESIGN, courseIds: ["course"] }, courses: [{ id: "course", title: "Radio course" }] }));
assert(designerHtml.includes("Radio course") && designerHtml.includes("checked=\"\""));
const { HomepageSettingsForm } = load("app/dashboard/settings/homepage/HomepageSettingsForm.tsx", {
  ...uiMocks,
  "../../management.module.css": css,
  "@/lib/homepage-copy": copy,
  "@/lib/homepage-text-settings": load("lib/homepage-text-settings.ts"),
  "@/lib/platform-details": load("lib/platform-details.ts"),
  "@/lib/platform-news": load("lib/platform-news.ts"),
});
const formHtml = renderToStaticMarkup(React.createElement(HomepageSettingsForm, { initialSettings: { homepageTextOverrides: overrides, heroTitle: "Our academy", socialLeftEnabled: true } }));
assert(formHtml.includes("مدربونا الجدد") && formHtml.includes("Our academy") && formHtml.includes("+200"));
assert(!formHtml.includes('name="heroTemplate"') && !formHtml.includes("teacherImageUrl"));
// Compile the real lesson-saving function in isolation to test stable identities without changing database data.
const dbSource = ts.createSourceFile("db.ts", readFileSync(path.join(root, "lib/db.ts"), "utf8"), ts.ScriptTarget.Latest, true);
const saveLessonsSource = dbSource.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "saveCourseLessons").getText(dbSource);
const lessonWrites = [];
const lessonSql = async (parts, ...args) => {
  const query = parts.join("?").replace(/\s+/g, " ");
  if (query.includes("SELECT id, slug")) return [{ id: "kept-lesson", slug: "unchanged-url" }];
  lessonWrites.push({ query, args }); return [];
};
lessonSql.transaction = async (queries) => Promise.all(queries);
const lessonModule = new Module(path.join(root, "lesson-save-test.cjs"));
lessonModule.require = () => ({ sql: lessonSql, generateId: () => "new-lesson", ensureOnce: async (_key, fn) => fn() });
lessonModule._compile(ts.transpileModule('const {sql,generateId,ensureOnce}=require("mock");\n' + saveLessonsSource, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, lessonModule.id);
await lessonModule.exports.saveCourseLessons("course", [{ id: "kept-lesson", course_id: "course", title: "Edited title", slug: "new-url", order: 0 }, { course_id: "course", title: "New lesson", slug: "new-url", order: 1 }]);
const inserts = lessonWrites.filter((q) => q.query.includes('INSERT INTO "Lesson"'));
assert.equal(inserts[0].args[0], "kept-lesson");
assert.equal(inserts[0].args[4], "unchanged-url");
assert.equal(inserts[1].args[0], "new-lesson");
assert(lessonWrites.some((q) => q.query.includes('DELETE FROM "Lesson"') && q.args.includes('["kept-lesson","new-lesson"]')));
const writesBefore = lessonWrites.length;
await assert.rejects(lessonModule.exports.saveCourseLessons("course", [{ id: "other-course-lesson", title: "Wrong", slug: "wrong", order: 0 }]), /INVALID_LESSON_IDS/);
assert.equal(lessonWrites.length, writesBefore);
console.log("PASS: category validation, certificate access checks, all-lesson eligibility, duplicate completion, immutable design snapshots, empty/disabled courses, role-based routes, escaped certificate rendering, and bilingual homepage text.");

if (process.argv.includes("--preview")) {
  const { createServer } = await import("node:http");
  const doc = renderToStaticMarkup(React.createElement(CertificateDocument, { design: designModule.DEFAULT_CERTIFICATE_DESIGN, studentName: "أحمد محمد", courseTitle: "التقديم الإذاعي وصناعة البودكاست", issuedAt: "2026-10-30T12:00:00Z", verificationId: "00000000-0000-4000-8000-000000000000" }));
  const certificateCss = readFileSync(path.join(root, "components/CertificateDocument.module.css"), "utf8");
  createServer((req, res) => {
    if (req.url === "/logo-1.png") { res.setHeader("Content-Type", "image/png"); res.end(readFileSync(path.join(root, "public/logo-1.png"))); return; }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#180c12;padding:24px;font-family:Arial,sans-serif}h2,h3,p{margin:0}article{max-width:1100px;margin:auto}${certificateCss}</style></head><body>${doc}</body></html>`);
  }).listen(3101, "127.0.0.1", () => console.log("Certificate QA preview: http://127.0.0.1:3101"));
}
