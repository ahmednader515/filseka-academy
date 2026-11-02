import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(import.meta.dirname, "..");
function load(relative, mocks) {
  const filename = path.join(root, relative);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const fallback = mod.require.bind(mod);
  mod.require = (name) => name in mocks ? mocks[name] : fallback(name);
  mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
  return mod.exports;
}
let record;
const sql = async (strings, ...values) => {
  const query = strings.join("?").replace(/\s+/g, " ");
  if (query.startsWith("CREATE TABLE")) return [];
  if (query.startsWith("ALTER TABLE") || query.includes("SET recipient_id = NULL")) return [];
  if (query.startsWith('INSERT INTO "UploadedCertificate"')) {
    record = { id: values[0], title: values[1], recipient_id: null, student_name: null, code: values[4], redeemed_at: null, file_key: "certificates/file.pdf", file_type: "application/pdf" };
    return [{ id: record.id, code: record.code }];
  }
  if (query.startsWith('UPDATE "UploadedCertificate"')) {
    assert(query.includes("redeemed_at IS NULL"));
    assert(query.includes("role = 'STUDENT'"));
    assert(query.includes("recipient_id = student.id"));
    if (values[0] !== record.code || record.redeemed_at) return [];
    record.recipient_id = values[1]; record.student_name = "Redeeming student";
    record.redeemed_at = new Date().toISOString(); return [{ id: record.id }];
  }
  if (query.startsWith("SELECT file_key")) {
    assert(query.includes("redeemed_at IS NOT NULL"));
    return values[0] === record.id && (values[1] || (values[2] === record.recipient_id && record.redeemed_at)) ? [record] : [];
  }
  throw new Error(`Unexpected query: ${query}`);
};
const db = load("lib/uploaded-certificates-db.ts", { "@/lib/db": { sql } });
const cert = await db.createUploadedCertificate({ title: "Certificate", fileKey: "certificates/file.pdf", fileType: "application/pdf", adminId: "admin" });
assert.match(cert.code, /^CERT-[A-F0-9]{24}$/);
assert.equal(record.recipient_id, null);
assert.equal(await db.getUploadedCertificateFile(cert.id, "student", false), undefined);
assert(await db.getUploadedCertificateFile(cert.id, "admin", true));
assert.equal(await db.redeemUploadedCertificate("student", "CERT-000000000000000000000000"), null);
const results = await Promise.all([db.redeemUploadedCertificate("student", ` ${cert.code.toLowerCase()} `), db.redeemUploadedCertificate("other", cert.code)]);
assert.equal(results.filter(Boolean).length, 1);
assert.equal(record.recipient_id, "student");
assert.equal(await db.redeemUploadedCertificate("student", cert.code), null);
assert(await db.getUploadedCertificateFile(cert.id, "student", false));
assert.equal(await db.getUploadedCertificateFile(cert.id, "other", false), undefined);

let session;
const mocks = { "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} }, "@/lib/uploaded-certificates-db": db };
const redeem = load("app/api/certificates/redeem/route.ts", mocks);
const request = (code) => new Request("http://localhost", { method: "POST", body: JSON.stringify({ code }) });
for (const role of [undefined, "ADMIN", "TEACHER", "ASSISTANT_ADMIN"]) {
  session = role ? { user: { id: "student", role } } : null;
  assert.equal((await redeem.POST(request(cert.code))).status, 403);
}
session = { user: { id: "student", role: "STUDENT" } };
assert.equal((await redeem.POST(request("bad"))).status, 400);
assert.equal((await redeem.POST(request(cert.code))).status, 400);

const files = load("app/api/certificates/uploads/[id]/file/route.ts", { ...mocks, "@/lib/r2": { readR2File: async () => new TextEncoder().encode("%PDF-file") } });
const params = { params: Promise.resolve({ id: cert.id }) };
let response = await files.GET(new Request("http://localhost?download=1"), params);
assert.equal(response.status, 200);
assert.equal(response.headers.get("content-type"), "application/pdf");
assert.match(response.headers.get("content-disposition"), /attachment/);
assert.equal(response.headers.get("cache-control"), "private, no-store");
session = { user: { id: "other", role: "STUDENT" } };
assert.equal((await files.GET(new Request("http://localhost"), params)).status, 404);

let uploaded = 0;
const upload = load("app/api/dashboard/certificates/uploads/route.ts", {
  ...mocks,
  "@/lib/r2": { isR2Configured: () => true, uploadToR2: async () => { uploaded++; } },
});
const uploadRequest = (type = "application/pdf", contents = "%PDF-1.7 test") => {
  const form = new FormData();
  form.set("file", new File([contents], "certificate.pdf", { type }));
  return new Request("http://localhost", { method: "POST", body: form });
};
assert.equal((await upload.POST(uploadRequest())).status, 403);
session = { user: { id: "admin", role: "ADMIN" } };
assert.equal((await upload.POST(uploadRequest("text/html"))).status, 400);
assert.equal((await upload.POST(uploadRequest("application/pdf", "fake PDF"))).status, 400);
assert.equal(uploaded, 0);
response = await upload.POST(uploadRequest());
assert.equal(response.status, 201);
assert.match((await response.json()).code, /^CERT-[A-F0-9]{24}$/);
assert.equal(uploaded, 1);
assert.equal(record.recipient_id, null);
assert.equal(record.title, "certificate.pdf");

const { UploadedCertificates } = load("app/dashboard/certificates/UploadedCertificates.tsx", {
  "next/navigation": { useRouter: () => ({ refresh() {} }) },
  "@/components/LocaleProvider": { useLocale: () => "en" },
  "../management.module.css": {},
  "./uploaded-certificates.module.css": {},
});
const props = { certificates: [{ id: cert.id, title: "Radio award", student_name: "Student", file_type: "image/png", redeemed_at: null, code: cert.code }] };
const adminHtml = renderToStaticMarkup(React.createElement(UploadedCertificates, { ...props, admin: true }));
assert(adminHtml.includes("Upload and generate code") && adminHtml.includes(cert.code));
assert(!adminHtml.includes('name="recipientId"') && !adminHtml.includes('name="title"'));
const studentHtml = renderToStaticMarkup(React.createElement(UploadedCertificates, props));
assert(studentHtml.includes("Redeem certificate") && studentHtml.includes("Download certificate"));
assert(!studentHtml.includes(cert.code));
assert(studentHtml.includes(`<img`) && studentHtml.includes(`/api/certificates/uploads/${cert.id}/file`));
const pdfHtml = renderToStaticMarkup(React.createElement(UploadedCertificates, { certificates: [{ ...props.certificates[0], file_type: "application/pdf" }] }));
assert(pdfHtml.includes("<iframe") && pdfHtml.includes("#view=FitH"));
console.log("PASS: file-only upload, random codes, first student claims ownership, single redemption across students, roles, file access, and UI rendering.");
