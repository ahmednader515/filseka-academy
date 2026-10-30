import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "app/dashboard/student-dashboard.module.css"), "utf8");
const styles = { __esModule: true, default: Object.fromEntries([...css.matchAll(/\.([a-zA-Z]\w*)/g)].map((match) => [match[1], match[1]])) };
const link = { __esModule: true, default: ({ children, href, ...props }) => React.createElement("a", { href, ...props }, children) };
const image = { __esModule: true, default: (imageProps) => {
  const props = { ...imageProps }; delete props.priority; delete props.sizes;
  const { src, alt, fill, ...rest } = props;
  return React.createElement("img", { src, alt, ...rest, ...(fill ? { style: { position: "absolute", inset: 0, width: "100%", height: "100%" } } : {}) });
} };
function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const mod = new Module(filename);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => Object.hasOwn(overrides, name) ? overrides[name] : name === "@/lib/ui-features" ? load("lib/ui-features.ts") : name.endsWith(".module.css") ? styles : name === "next/link" ? link : name === "next/image" ? image : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { getSidebarGroups } = load("lib/sidebar-navigation.ts");
const groups = getSidebarGroups("STUDENT");
assert.equal(groups.length, 1);
const hrefs = groups[0].items.map((item) => item.href);
for (const href of ["/store", "/support", "/blog", "/dashboard/profile"]) assert(hrefs.includes(href));
for (const href of ["/", "/courses", "/teachers", "/portfolio", "/contact", "/about", "/dashboard#my-courses", "/dashboard#my-subscriptions", "/dashboard#activate-code"]) assert(!hrefs.includes(href));
assert.equal(new Set(hrefs).size, hrefs.length);

const locale = { useLocale: () => "ar", useT: () => (key, fallback) => fallback || key };
const icon = load("components/AcademyIcon.tsx");
const localized = { pickLocalizedText: (language, arabic, english) => language === "ar" ? arabic || english || "" : english || arabic || "" };
const clientMocks = { "@/components/LocaleProvider": locale, "@/lib/i18n/core": { getDir: () => "rtl" }, "next/navigation": { useRouter: () => ({ refresh() {} }), usePathname: () => "/dashboard" }, "@/components/AcademyIcon": icon };
const activate = load("app/dashboard/ActivateCodeSection.tsx", clientMocks);
const myCourses = load("app/dashboard/MyCoursesSection.tsx", clientMocks);
const subscriptions = { StudentSubscriptionsPanel: () => React.createElement("section", { id: "my-subscriptions", className: "student-panel" }, "الاشتراكات") };
let fullAccess = false;
const fixtureLessons = [{ id: "allowed", slug: "allowed-lesson", title: "Allowed lesson", title_ar: "درس متاح", duration: 12 }, { id: "locked", slug: "locked-lesson", title: "Locked lesson", title_ar: "درس مغلق", duration: 14 }];
const db = {
  getLessonsByCourseId: async () => fixtureLessons,
  getLiveStreamsByCourseId: async () => [{ id: "future", title: "موعد قادم", scheduledAt: "2099-01-01T10:00:00.000Z" }, { id: "past", title: "موعد قديم", scheduledAt: "2000-01-01T10:00:00.000Z" }],
  hasFullCourseAccessAsStudent: async () => fullAccess,
  getAllowedLessonIdsForUserCourse: async () => ["allowed"],
};
const { StudentDashboard } = load("app/dashboard/StudentDashboard.tsx", { "@/components/AcademyIcon": icon, "@/lib/i18n/server": { getLocaleFromCookie: async () => "ar" }, "@/lib/i18n/localized-field": localized, "@/lib/db": db, "./MyCoursesSection": myCourses, "./ActivateCodeSection": activate, "./StudentSubscriptionsPanel": subscriptions });
const course = { id: "course", slug: "test-course", title: "Test course", titleAr: "التقديم الإذاعي الاحترافي", shortDesc: "تجربة تدريبية لتطوير مهاراتك في الإعداد والتقديم.", imageUrl: "/category-artwork/presenting.webp" };
const props = { userId: "test-student", userName: "طالب تجريبي", balance: 125.5, courses: [course], purchases: [], subscriptionsEnabled: true, plans: [], hasActiveSubscription: false, subscriptionExpiry: null };
const html = renderToStaticMarkup(await StudentDashboard(props));
assert(html.includes("/courses/test-course/lessons/allowed-lesson"));
assert(!html.includes("/courses/test-course/lessons/locked-lesson"));
assert(html.includes("موعد قادم")); assert(!html.includes("موعد قديم"));
assert(html.includes('id="activate-code"')); assert(html.includes('id="my-subscriptions"')); assert(html.includes('id="my-courses"'));
assert(!html.includes("70%"));
fullAccess = true;
const full = renderToStaticMarkup(await StudentDashboard(props));
assert(full.includes("/courses/test-course/lessons/locked-lesson"));
const empty = renderToStaticMarkup(await StudentDashboard({ ...props, courses: [], subscriptionsEnabled: false }));
assert(empty.includes("رحلتك تبدأ بخطوة")); assert(!empty.includes('id="my-subscriptions"')); assert(empty.includes('href="/courses"'));
console.log("PASS: merged student menu, lesson-access boundaries, upcoming sessions, anchors and empty states");

if (process.argv.includes("--preview")) {
  const globalCss = `*{box-sizing:border-box}body{margin:0;background:#080506;color:#fff5f8;font-family:Cairo,Arial,sans-serif}h1,h2,h3,p{margin:0}a{color:inherit;text-decoration:none}button,input,textarea{font:inherit}button{cursor:pointer}ul{list-style:none;margin:0;padding:0}.student-panel{padding:24px}.space-y-4>*+*{margin-top:16px}.mb-4{margin-bottom:16px}.mt-1{margin-top:4px}.flex{display:flex}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.gap-3{gap:12px}.px-4{padding-inline:16px}.py-2{padding-block:8px}.rounded-\\[var\\(--radius-btn\\)\\]{border-radius:12px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@font-face{font-family:Cairo;src:url(http://localhost:3000/fonts/Cairo-VariableFont_slnt,wght.ttf)}`;
  const previewPath = path.join(os.tmpdir(), "filseka-student-dashboard-preview.html");
  const theme = css.replace(/:global\(([^)]+)\)/g, "$1");
  writeFileSync(previewPath, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="http://localhost:3000/"><style>${globalCss}\n${theme}</style></head><body><div class="studentArea">${html}</div></body></html>`);
  console.log(`Preview: ${previewPath}`);
}
