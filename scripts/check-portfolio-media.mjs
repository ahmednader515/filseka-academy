import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

function load(relative, mocks = {}) {
  const filename = path.resolve(import.meta.dirname, "..", relative);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const content = load("lib/portfolio-content.ts");
const cases = [
  ["https://www.youtube.com/shorts/dQw4w9WgXcQ?si=example", "youtube", true],
  ["https://m.youtube.com/shorts/dQw4w9WgXcQ/", "youtube", true],
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", false],
  ["https://youtu.be/dQw4w9WgXcQ?si=example", "youtube", false],
  ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "youtube", false],
  ["https://www.facebook.com/reel/123456789012345/?mibextid=example", "facebook", true],
  ["https://m.facebook.com/reel/123456789012345", "facebook", true],
  ["https://web.facebook.com/reels/123456789012345/", "facebook", true],
  ["https://www.facebook.com/academy/videos/123456789012345/", "facebook", false],
  ["https://www.facebook.com/watch/?v=123456789012345", "facebook", false],
  ["https://www.facebook.com/video.php?v=123456789012345", "facebook", false],
  ["https://cdn.example/video.mp4?token=example", "video", false],
  ["https://cdn.example/video.webm", "video", false],
];
const base = { title: "Portfolio video", category: "programs", imageUrl: "/cover.jpg", isPublished: true };
for (const [url, kind, isShort] of cases) {
  const media = content.portfolioMedia(url);
  assert.equal(media?.kind, kind, url);
  assert.equal(media.isShort, isShort, url);
  assert(content.portfolioSchema.safeParse({ ...base, videoUrl: url }).success, `Published video must accept ${url}`);
  if (kind === "facebook") {
    const embed = new URL(media.src);
    assert.equal(embed.origin + embed.pathname, "https://www.facebook.com/plugins/video.php");
    const target = new URL(embed.searchParams.get("href"));
    assert.equal(target.hostname, "www.facebook.com");
    assert.equal(target.pathname, isShort ? "/reel/123456789012345/" : "/watch/");
    assert.equal(embed.searchParams.get("show_text"), "false");
  }
}
for (const url of ["javascript:alert(1)", "https://facebook.com.evil.example/reel/123", "https://youtube.com.evil.example/shorts/dQw4w9WgXcQ", "https://user:secret@facebook.com/reel/123", "https://facebook.com/reel/not-a-video", "https://facebook.com/share/r/short-token/", "https://youtube.com/shorts/invalid", "https://facebook.com/profile.php?id=123"]) {
  assert.equal(content.portfolioMedia(url), null, url);
  assert(!content.portfolioSchema.safeParse({ ...base, videoUrl: url }).success, `Reject unsupported URL ${url}`);
}

// Render both the gallery card and the selected player's dialog for each format.
for (const [url, kind, isShort] of cases) {
  const work = { ...content.portfolioSchema.parse({ ...base, videoUrl: url }), id: "work-1" };
  const { PortfolioGallery } = load("app/portfolio/PortfolioGallery.tsx", {
    react: { ...React, useEffect() {}, useRef: () => ({ current: null }), useMemo: (fn) => fn(), useState: (value) => [value === null ? work : value, () => {}] },
    "next/image": { __esModule: true, default: () => null },
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "@/components/LocaleProvider": { useLocale: () => "en" },
    "@/components/AcademyIcon": { AcademyIcon: () => null },
    "@/lib/portfolio-content": content,
    "./portfolio.module.css": { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) },
  });
  const html = renderToStaticMarkup(React.createElement(PortfolioGallery, { works: [work], categories: content.PORTFOLIO_CATEGORIES }));
  assert(!html.includes("cardPortrait"), `Gallery thumbnails stay horizontal: ${url}`);
  assert.equal(html.includes("dialogPortrait"), isShort, `Player orientation: ${url}`);
  assert(html.includes(kind === "video" ? "<video" : "<iframe"), `Player type: ${url}`);
  assert(!html.includes("demoPreview"), `Supported media must render a player: ${url}`);
}
console.log("PASS: YouTube Shorts, Facebook Reels, URL validation, publication, horizontal gallery thumbnails, and portrait/landscape video popups.");
