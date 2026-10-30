import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "app/dashboard/add-balance/balance.module.css"), "utf8");
const classes = { __esModule: true, default: Object.fromEntries([...css.matchAll(/\.([a-zA-Z]\w*)/g)].map((match) => [match[1], match[1]])) };
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) };
const image = { __esModule: true, default: (props) => { const next = { ...props }; delete next.priority; delete next.sizes; delete next.fill; return React.createElement("img", { ...next, ...(props.fill ? { style: { position: "absolute", inset: 0, width: "100%", height: "100%" } } : {}) }); } };
const locale = { useLocale: () => "ar" };
function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const mod = new Module(filename); mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => Object.hasOwn(overrides, name) ? overrides[name] : name.endsWith(".module.css") ? classes : name === "next/link" ? link : name === "next/image" ? image : name === "@/components/LocaleProvider" ? locale : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const icons = load("app/dashboard/add-balance/BalanceIcon.tsx");
const support = load("app/support/SupportIcon.tsx");
const copy = load("app/dashboard/add-balance/CopyButton.tsx", { "./BalanceIcon": icons });
let selectedId;
const hooks = { ...React, useId: () => "balance-test", useState: (initial) => [selectedId ?? initial, (value) => { selectedId = value; }] };
const card = load("app/dashboard/add-balance/PaymentMethodCards.tsx", { react: hooks, "./BalanceIcon": icons, "@/app/support/SupportIcon": support, "./CopyButton": copy });
const methods = [{ id: "vodafone", title: "Vodafone Cash", transferInstruction: "تعليمات المحفظة", destination: "01000000000", copyLabel: "نسخ", copiedLabel: "تم النسخ", copyAriaLabel: "نسخ رقم المحفظة" }, { id: "instapay", title: "InstaPay", transferInstruction: "تعليمات إنستا باي", destination: "test@instapay", copyLabel: "نسخ", copiedLabel: "تم النسخ", copyAriaLabel: "نسخ عنوان التحويل" }];
const props = { methods, confirmationNote: "أرسل صورة الإيصال بعد التحويل.", waitingNote: "تتم إضافة الرصيد بعد المراجعة.", whatsappNumber: "201000000000", whatsappButtonText: "إرسال تأكيد التحويل عبر واتساب" };
const render = (data) => renderToStaticMarkup(React.createElement(card.PaymentMethodCards, data));
let html = render(props);
assert(html.includes("01000000000")); assert(!html.includes("test@instapay")); assert(html.includes("https://wa.me/201000000000"));
function find(element, predicate) { if (!element || typeof element !== "object") return null; if (predicate(element)) return element; for (const child of React.Children.toArray(element.props?.children)) { const result = find(child, predicate); if (result) return result; } return null; }
const selector = find(card.PaymentMethodCards(props), (element) => element.type === "button" && String(element.key).endsWith("instapay"));
assert(selector); selector.props.onClick();
html = render(props); assert(html.includes("test@instapay")); assert(!html.includes('dir="ltr">01000000000</strong>')); assert(html.includes("تعليمات إنستا باي"));
html = render({ ...props, methods: [{ ...methods[0], destination: "" }, methods[1]] }); assert(!html.includes("Vodafone Cash")); assert(html.includes("test@instapay"));
html = render({ ...props, methods: [] }); assert(html.includes('href="/support"')); assert(!html.includes("wa.me"));
html = render({ ...props, whatsappNumber: "" }); assert(!html.includes("wa.me")); assert(html.includes('href="/support"'));
console.log("PASS: method switching, exact destination copying targets, unavailable methods and confirmation fallbacks");

let states = []; let cursor = 0; let copiedText;
const copyHooks = { ...React, useState: (initial) => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], (value) => { states[index] = value; }]; }, useRef: () => ({ current: null }), useEffect: () => {} };
const isolatedCopy = load("app/dashboard/add-balance/CopyButton.tsx", { react: copyHooks, "./BalanceIcon": icons });
function copyTree() { cursor = 0; return isolatedCopy.CopyButton({ text: "test@instapay", copyLabel: "نسخ", copiedLabel: "تم النسخ", ariaLabel: "نسخ العنوان" }); }
const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
try {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async (value) => { copiedText = value; } } } });
  await find(copyTree(), (element) => element.type === "button").props.onClick();
  assert.equal(copiedText, "test@instapay"); assert.equal(states[0], true); assert.equal(states[1], false);
  states = [];
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async () => { throw new Error("denied"); } } } });
  await find(copyTree(), (element) => element.type === "button").props.onClick();
  assert.equal(states[0], false); assert.equal(states[1], true);
} finally { if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator); else delete globalThis.navigator; }
console.log("PASS: clipboard success and failure feedback");

if (process.argv.includes("--preview")) {
  selectedId = undefined;
  const view = load("app/dashboard/add-balance/BalancePageView.tsx", { "./PaymentMethodCards": card, "./BalanceIcon": icons, "@/app/support/SupportIcon": support });
  const markup = renderToStaticMarkup(React.createElement(view.BalancePageView, { ...props, locale: "ar", title: "شحن الرصيد", subtitle: "اختر طريقة الشحن واتبع خطوات تأكيد التحويل لإضافة الرصيد إلى حسابك.", balance: 125.5 }));
  const font = readFileSync(path.join(root, "public/fonts/Cairo-VariableFont_slnt,wght.ttf")).toString("base64");
  const base = `@font-face{font-family:Cairo;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#080506;color:#fff4f8;font-family:Cairo,Arial,sans-serif}h1,h2,h3,p{margin:0}a{color:inherit;text-decoration:none}button{font:inherit}svg{display:block}.studentArea{padding:0 28px 40px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:640px){.studentArea{padding:0 14px 30px}}`;
  const file = path.join(os.tmpdir(), "filseka-balance-preview.html");
  writeFileSync(file, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="http://localhost:3000/"><style>${base}\n${css}</style></head><body><div class="studentArea">${markup}</div></body></html>`);
  console.log(`Preview: ${file}`);
}
