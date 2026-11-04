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
let setting = { tracks: [], enabled: false };
let uploads = 0;
let concurrentEdit = false;
const soundStorage = load("lib/homepage-sound.ts", {
  "@/lib/db": { sql: async (strings, ...values) => {
    const query = strings.join("?");
    if (query.startsWith("SELECT")) return [{ ...setting }];
    if (query.startsWith('UPDATE "HomepageSound" SET tracks =')) {
      if (concurrentEdit) return [];
      assert.deepEqual(JSON.parse(values[2]), setting.tracks, "Update checks the previous playlist before saving");
      setting = { tracks: JSON.parse(values[0]), enabled: values[1] === 0 ? false : setting.enabled };
      return [{ id: "default" }];
    }
    return [];
  } },
});
const originChecks = load("lib/request-origin.ts", {});
const route = load("app/api/dashboard/settings/homepage-sound/route.ts", {
  "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} },
  "@/lib/r2": { isR2Configured: () => true, uploadToR2: async () => { uploads++; return { url: `https://cdn.example/sound-${uploads}.mp3` }; } },
  "@/lib/homepage-sound": {
    saveHomepageSound: async (url, name) => { setting = { tracks: [...setting.tracks, { url, name }], enabled: true }; },
    changeHomepageSound: async (enabled, remove) => { setting = remove ? { tracks: [], enabled: false } : { ...setting, enabled }; },
    getHomepageSound: async () => setting,
    editHomepageSoundTrack: soundStorage.editHomepageSoundTrack,
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
assert.equal((await upload()).status, 200);
assert.equal(setting.tracks.length, 2, "Uploads append instead of replacing previous sounds");
for (const [size, status] of [[11 * 1024 * 1024, 200], [100 * 1024 * 1024, 200], [100 * 1024 * 1024 + 1, 400]]) {
  const contents = new Uint8Array(size);
  contents.set(new TextEncoder().encode("ID3"));
  const data = new FormData();
  data.set("file", new File([contents], "large.mp3", { type: "audio/mpeg" }));
  const request = new Request("http://localhost/api/dashboard/settings/homepage-sound", { method: "POST" });
  request.formData = async () => data;
  assert.equal((await route.POST(request)).status, status, `Upload size ${size}`);
}
const patch = (body) => route.PATCH(new Request("http://localhost/api/dashboard/settings/homepage-sound", { method: "PATCH", body: JSON.stringify(body) }));
assert.equal((await patch({ enabled: false })).status, 200);
assert.equal(setting.enabled, false);
setting = { tracks: ["a", "b", "c"].map((name) => ({ name, url: `/${name}.mp3` })), enabled: false };
for (const body of [null, [], "bad", { action: "up" }, { trackUrl: "/a.mp3" }, { trackUrl: "/a.mp3", action: "invalid" }, { trackUrl: "/a.mp3", action: "remove", remove: true }]) {
  assert.equal((await patch(body)).status, 400);
}
session = { user: { role: "STUDENT" } };
assert.equal((await patch({ trackUrl: "/a.mp3", action: "remove" })).status, 403);
session = { user: { role: "ADMIN" } };
assert.equal((await patch({ trackUrl: "/a.mp3", action: "up" })).status, 200);
assert.deepEqual(setting.tracks.map((track) => track.name), ["a", "b", "c"], "First track cannot move up");
assert.equal((await patch({ trackUrl: "/b.mp3", action: "up" })).status, 200);
assert.deepEqual(setting.tracks.map((track) => track.name), ["b", "a", "c"]);
assert.equal(setting.enabled, false, "Reordering does not enable a disabled playlist");
assert.equal((await patch({ trackUrl: "/b.mp3", action: "down" })).status, 200);
assert.deepEqual(setting.tracks.map((track) => track.name), ["a", "b", "c"]);
assert.equal((await patch({ trackUrl: "/c.mp3", action: "down" })).status, 200);
assert.deepEqual(setting.tracks.map((track) => track.name), ["a", "b", "c"], "Last track cannot move down");
concurrentEdit = true;
assert.equal((await patch({ trackUrl: "/a.mp3", action: "remove" })).status, 409);
assert.equal(setting.tracks.length, 3, "Concurrent changes are not overwritten");
concurrentEdit = false;
assert.equal((await patch({ trackUrl: "/missing.mp3", action: "remove" })).status, 409);
setting.enabled = true;
for (const name of ["b", "a", "c"]) {
  assert.equal((await patch({ trackUrl: `/${name}.mp3`, action: "remove" })).status, 200);
  assert(!setting.tracks.some((track) => track.name === name));
  assert.equal(setting.enabled, setting.tracks.length > 0, "Deleting the last sound disables playback");
}
assert.equal((await patch({ remove: true })).status, 200);
assert.equal(setting.tracks.length, 0);
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

let blocked = true;
let attempts = 0;
let pauses = 0;
let pathname = "/";
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
function elements(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)];
}
// Preserve hook state and dependencies across renders to exercise track transitions.
function mount(tracks) {
  const slots = [];
  let cursor = 0;
  let pending = [];
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value === null ? audio : value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
    useEffect(fn, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || deps.some((dep, j) => !Object.is(dep, previous.deps[j]))) {
        pending.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const { HomepageWelcomeSound } = load("components/HomepageWelcomeSound.tsx", { "./HeaderControls.module.css": {}, react, "next/navigation": { usePathname: () => pathname } });
  return {
    render() {
      cursor = 0; pending = [];
      const tree = HomepageWelcomeSound({ tracks, locale: "en" });
      pending.forEach((fn) => fn());
      return elements(tree);
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}
const tracks = [{ url: "/first.mp3", name: "First" }, { url: "/second.mp3", name: "Second" }, { url: "/third.mp3", name: "Third" }];
const player = mount(tracks);
let rendered = player.render();
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 1);
assert(listeners.has("click"));
assert.equal(sessionValues.size, 0, "Blocked autoplay must not consume the session playback");
blocked = false;
listeners.get("click")({ target: null });
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 2);
assert.equal(listeners.size, 0);
const slider = rendered.find((element) => element.props?.type === "range");
slider.props.onChange({ target: { value: "25" } });
assert.equal(audio.volume, 0.25);
assert.equal(audio.muted, false);
rendered = player.render();
rendered.find((element) => element.props?.["aria-label"] === "Mute sound").props.onClick();
assert.equal(audio.muted, true);
for (const expected of ["/second.mp3", "/third.mp3", "/first.mp3", "/second.mp3"]) {
  rendered.find((element) => element.type === "audio").props.onEnded();
  rendered = player.render();
  assert.equal(rendered.find((element) => element.type === "audio").props.src, expected);
  assert.equal(audio.volume, 0.25, "Volume persists across tracks");
  assert.equal(audio.muted, true, "Mute persists across tracks");
}
assert.equal(attempts, 6, "Every transition plays the next track, including wrapping to the first");
const previousPauses = pauses;
pathname = "/courses";
player.render();
assert.equal(pauses, previousPauses, "Ordinary navigation preserves playback");
pathname = "/courses/course/lessons/lesson";
rendered = player.render();
assert(pauses > previousPauses, "Opening a lesson pauses site audio");
rendered.find((element) => element.type === "audio").props.onEnded();
player.render();
assert.equal(attempts, 6, "A lesson must not advance the playlist");
player.unmount();
pathname = "/";
const reload = mount(tracks);
reload.render();
assert.equal(attempts, 6, "Reloading preserves the once-per-session flag");
reload.unmount();
sessionValues.clear();
const newSession = mount([tracks[0]]);
rendered = newSession.render();
await Promise.resolve(); await Promise.resolve();
assert.equal(attempts, 7, "A new session allows autoplay again");
assert.equal(rendered.find((element) => element.type === "audio").props.loop, true, "A single track repeats too");
newSession.unmount();
assert.equal(listeners.size, 0);
assert.equal(audioListeners.size, 0);
console.log("PASS: upload authorization, validation, append, 100 MB boundary, sequential playback, playlist wrap, single-track loop, autoplay fallback, sessions, navigation, lesson pause, mute, and volume.");
