import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const filename = path.resolve(import.meta.dirname, "../app/api/dashboard/portfolio/route.ts");
const mod = new Module(filename);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
const fallback = mod.require.bind(mod);
let session = null;
let exists = true;
let calls = 0;
const refreshed = [];
const mocks = {
  "next-auth": { getServerSession: async () => session },
  "@/lib/auth": { authOptions: {} },
  "@/lib/portfolio-content": {},
  "@/lib/portfolio-db": { deletePortfolioWork: async () => { calls++; const found = exists; exists = false; return found; } },
  "next/cache": { revalidatePath: (url) => refreshed.push(url) },
};
mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const id = "12345678-1234-1234-1234-123456789abc";
const request = (value = id, origin = "http://localhost") => new NextRequest(`http://localhost/api/dashboard/portfolio?id=${value}`, { method: "DELETE", headers: { origin } });
for (const role of [null, "STUDENT", "TEACHER"]) {
  session = role ? { user: { role } } : null;
  assert.equal((await mod.exports.DELETE(request())).status, 403);
}
session = { user: { role: "ADMIN" } };
assert.equal((await mod.exports.DELETE(request(id, "https://other.example"))).status, 403);
assert.equal((await mod.exports.DELETE(request("invalid"))).status, 400);
assert.equal(calls, 0);
assert.equal((await mod.exports.DELETE(request())).status, 200);
assert.deepEqual(refreshed, ["/portfolio", "/dashboard/portfolio"]);
assert.equal((await mod.exports.DELETE(request())).status, 404);
exists = true;
session = { user: { role: "ASSISTANT_ADMIN" } };
assert.equal((await mod.exports.DELETE(request())).status, 200);
console.log("PASS: portfolio deletion permissions, origin checks, ID validation, deletion, missing items, and page refresh.");
