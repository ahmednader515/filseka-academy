import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";

function load(relative, mocks) {
  const filename = path.resolve(import.meta.dirname, "..", relative);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
let session = null;
let setting = { url: null, name: null, enabled: false };
let uploads = 0;
const originChecks = load("lib/request-origin.ts", {});
const route = load("app/api/dashboard/settings/homepage-sound/route.ts", {
  "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} },
  "@/lib/r2": { isR2Configured: () => true, uploadToR2: async () => { uploads++; return { url: "https://cdn.example/sound.mp3" }; } },
  "@/lib/homepage-sound": {
    saveHomepageSound: async (url, name) => { setting = { url, name, enabled: true }; },
    changeHomepageSound: async (enabled, remove) => { setting = remove ? { url: null, name: null, enabled: false } : { ...setting, enabled }; },
    getHomepageSound: async () => setting,
  },
  "@/lib/revalidate-homepage": { revalidateHomepageCaches() {} },
  "@/lib/request-origin": originChecks,
});
const priorPublicUrl = process.env.R2_PUBLIC_URL;
process.env.R2_PUBLIC_URL = "https://cdn.example";
const upload = (type = "audio/mpeg", contents = "ID3audio", origin = "http://localhost") => {
  const body = new FormData(); body.set("file", new File([contents], "welcome.mp3", { type }));
  return route.POST(new Request("http://localhost/api/dashboard/settings/homepage-sound", { method: "POST", headers: { origin }, body }));
};
for (const role of [null, "TEACHER", "STUDENT"]) {
  session = role ? { user: { role } } : null;
  assert.equal((await upload()).status, role ? 403 : 401);
}
session = { user: { role: "ADMIN" } };
assert.equal((await upload("audio/mpeg", "ID3audio", "https://other.example")).status, 403);
assert.equal((await upload("text/html")).status, 400);
assert.equal((await upload("audio/mpeg", "invalid")).status, 400);
assert.equal(uploads, 0);
assert.equal((await upload()).status, 200);
assert.equal(setting.enabled, true);
const patch = (body) => route.PATCH(new Request("http://localhost/api/dashboard/settings/homepage-sound", { method: "PATCH", body: JSON.stringify(body) }));
assert.equal((await patch({ enabled: false })).status, 200);
assert.equal(setting.enabled, false);
assert.equal((await patch({ remove: true })).status, 200);
assert.equal(setting.url, null);
const oldAuthUrl = process.env.NEXTAUTH_URL;
const oldAuthAlias = process.env.AUTH_URL;
delete process.env.AUTH_URL;
process.env.NEXTAUTH_URL = "https://academy.example";
const proxiedUpload = (origin, extra = {}) => {
  const body = new FormData(); body.set("file", new File(["ID3audio"], "welcome.mp3", { type: "audio/mpeg" }));
  return route.POST(new Request("http://localhost:3000/api/dashboard/settings/homepage-sound", { method: "POST", headers: { origin, ...extra }, body }));
};
assert.equal((await proxiedUpload("https://academy.example")).status, 200);
assert.equal((await proxiedUpload("https://evil.example")).status, 403);
delete process.env.NEXTAUTH_URL;
assert.equal((await proxiedUpload("https://academy.example", { host: "academy.example", "x-forwarded-proto": "https" })).status, 200);
assert.equal((await proxiedUpload("https://evil.example", { host: "academy.example", "x-forwarded-proto": "https", "x-forwarded-host": "evil.example" })).status, 403);
if (oldAuthUrl === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = oldAuthUrl;
if (oldAuthAlias === undefined) delete process.env.AUTH_URL; else process.env.AUTH_URL = oldAuthAlias;
if (priorPublicUrl === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = priorPublicUrl;

let effect;
let blocked = true;
let attempts = 0;
let pauses = 0;
const listeners = new Map();
const audioListeners = new Map();
const sessionValues = new Map();
globalThis.window = { sessionStorage: { getItem: (key) => sessionValues.get(key) ?? null, setItem: (key, value) => sessionValues.set(key, value) } };
globalThis.document = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
globalThis.Element = class {};
const audio = {
  currentTime: 10,
  play: () => { attempts++; if (blocked) return Promise.reject(new Error("NotAllowedError")); audioListeners.get("play")?.(); return Promise.resolve(); },
  pause: () => { pauses++; },
  addEventListener: (name, fn) => audioListeners.set(name, fn), removeEventListener: (name) => audioListeners.delete(name),
};
const { HomepageWelcomeSound } = load("components/HomepageWelcomeSound.tsx", { "./HeaderControls.module.css": {}, react: { useRef: () => ({ current: audio }), useEffect: (fn) => { effect = fn; }, useState: (value) => [value, () => {}] } });
const soundTree = HomepageWelcomeSound({ url: "/sound.mp3", locale: "en" });
function elements(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)];
}
const rendered = elements(soundTree);
const mute = rendered.find((element) => element.props?.["aria-label"] === "Mute sound");
const slider = rendered.find((element) => element.props?.type === "range");
assert(mute && slider);
const cleanup = effect();
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 1);
assert(listeners.has("click"));
assert.equal(sessionValues.size, 0, "Blocked autoplay must not consume the session playback");
blocked = false;
listeners.get("click")({ target: null });
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 2);
assert.equal(listeners.size, 0);
cleanup();
assert.equal(audio.currentTime, 0);
assert.equal(pauses, 1);
assert.equal(audioListeners.size, 0);
const storedSession = new Map(sessionValues);
assert.equal(storedSession.size, 1);
const cleanupReturn = effect();
assert.equal(attempts, 2, "Returning to the homepage must not autoplay again");
assert.equal(listeners.size, 0);
cleanupReturn();
// A fresh module with the same session storage simulates a full-page reload.
const componentMocks = { "./HeaderControls.module.css": {}, react: { useRef: () => ({ current: audio }), useEffect: (fn) => { effect = fn; }, useState: (value) => [value, () => {}] } };
const refreshed = load("components/HomepageWelcomeSound.tsx", componentMocks);
refreshed.HomepageWelcomeSound({ url: "/sound.mp3", locale: "en" });
const cleanupReload = effect();
assert.equal(attempts, 2, "Refreshing must preserve the once-per-session flag");
cleanupReload();
sessionValues.clear();
const cleanupNewSession = effect();
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 3, "A new tab session must allow autoplay again");
cleanupNewSession();
mute.props.onClick();
assert.equal(audio.muted, true);
slider.props.onChange({ target: { value: "25" } });
assert.equal(audio.volume, 0.25);
assert.equal(audio.muted, false);
console.log("PASS: uploads, autoplay fallback, once-per-session playback across navigation/reloads, new sessions, cleanup, mute, and volume.");
