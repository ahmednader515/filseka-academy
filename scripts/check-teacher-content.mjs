import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
let session = null;
let created = [];
const database = {
  getUserById: async (id) => id === "teacher" ? { id, role: "TEACHER" } : id === "student" ? { id, role: "STUDENT" } : null,
  courseExistsBySlug: async () => false,
  createCourse: async (data) => { created.push(data); return { id: "course", ...data }; },
};
const filename = path.join(root, "app/api/courses/route.ts");
const mod = new Module(filename);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
const fallback = mod.require.bind(mod);
const mocks = {
  "next-auth": { getServerSession: async () => session },
  "@/lib/auth": { authOptions: {} },
  "@/lib/db": database,
};
mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const input = { titleAr: "كورس", titleEn: "Course", descriptionAr: "وصف", descriptionEn: "Description", slug: "course" };
const post = (extra = {}) => mod.exports.POST(new Request("http://localhost/api/courses", { method: "POST", body: JSON.stringify({ ...input, ...extra }) }));
assert.equal((await post({ teacherId: "teacher" })).status, 403);
for (const role of ["TEACHER", "ASSISTANT_ADMIN", "STUDENT"]) {
  session = { user: { id: "caller", role } };
  assert.equal((await post({ teacherId: "teacher" })).status, 403);
}
assert.equal(created.length, 0);
session = { user: { id: "admin", role: "ADMIN" } };
for (const teacherId of ["missing", "student", "", 123]) assert.equal((await post({ teacherId })).status, 400);
assert.equal(created.length, 0);
assert.equal((await post({ teacherId: "teacher" })).status, 200);
assert.equal(created.at(-1).created_by_id, "teacher");
assert.equal((await post()).status, 200);
assert.equal(created.at(-1).created_by_id, "admin");
session = { user: { id: "teacher", role: "TEACHER" } };
assert.equal((await post()).status, 200);
assert.equal(created.at(-1).created_by_id, "teacher");
console.log("Teacher course ownership and authorization checks passed.");
