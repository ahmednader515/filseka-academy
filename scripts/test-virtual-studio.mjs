// Isolated API checks; no database or storage writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, mocks) {
  const context = { exports: {}, console, URL, require(name) {
    if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}

async function main() {
  const shared = load("lib/studio-shared.ts", {});
  assert.equal(shared.studioAudioType("clip.mp3", ""), "audio/mpeg");
  assert.equal(shared.studioAudioType("clip.wav", "application/octet-stream"), "audio/wav");
  assert.equal(shared.studioAudioType("clip.webm", "audio/webm;codecs=opus"), "audio/webm");
  assert.equal(shared.studioAudioType("clip.custom", "audio/custom"), "audio/custom");
  assert.equal(shared.studioAudioType("clip.txt", "text/plain"), null);
  assert.equal(shared.STUDIO_MAX_BYTES, 104857600);

  let session, calls = [], file, head, exists = true;
  const next = { NextResponse: {
    json: (body, options) => ({ body, status: options?.status ?? 200 }),
    redirect: (url, options) => ({ url, status: options?.status ?? 307, headers: options?.headers }),
  }};
  const db = {
    getStudioData: async (...args) => { calls.push(["load", ...args]); return { exercises: [], recordings: [] }; },
    createStudioUpload: async (data) => { calls.push(["upload", data]); return exists ? { id: "recording-1", key: "studio/student-1/recording-1" } : null; },
    getStudioFile: async (...args) => { calls.push(["file", ...args]); return file; },
    completeStudioUpload: async (...args) => { calls.push(["complete", ...args]); },
    reviewStudioRecording: async (...args) => { calls.push(["review", ...args]); return exists; },
    saveStudioExercise: async (...args) => { calls.push(["exercise", ...args]); return exists; },
    editStudioRecording: async (...args) => { calls.push(["edit", ...args]); return exists; },
    deleteStudioRecording: async (...args) => { calls.push(["delete", ...args]); return exists; },
    replaceStudioRecording: async (...args) => { calls.push(["replace", ...args]); return exists ? "old-object-key" : undefined; },
  };
  const storage = {
    isR2Configured: () => true,
    signStudioUpload: async (...args) => { calls.push(["sign", ...args]); return "signed-upload"; },
    inspectStudioUpload: async () => head,
    signStudioPlayback: async (...args) => { calls.push(["playback", ...args]); return "signed-playback"; },
    deleteStudioAudio: async (...args) => { calls.push(["delete-audio", ...args]); },
  };
  const mocks = { "next/server": next, "next-auth": { getServerSession: async () => session }, "@/lib/auth": { authOptions: {} }, "@/lib/studio": db, "@/lib/r2": storage, "@/lib/studio-shared": shared };
  const api = load("app/api/studio/route.ts", mocks);
  async function post(role, body, expected) {
    session = role ? { user: { role, id: role === "ADMIN" ? "admin-1" : "student-1" } } : null;
    calls = [];
    const response = await api.POST({ json: async () => body });
    assert.equal(response.status, expected, JSON.stringify(body));
    return response;
  }
  const upload = { action: "upload", fileName: "clip.wav", mime: "audio/wav", size: 100, title: "Practice", source: "upload", exerciseId: null };
  for (const role of [null, "TEACHER", "ASSISTANT_ADMIN"]) {
    await post(role, upload, 403); assert.equal(calls.length, 0);
    assert.equal((await api.GET()).status, 403);
  }
  await post("ADMIN", upload, 403);
  await post("STUDENT", { action: "exercise" }, 403);
  await post("STUDENT", { action: "review" }, 403);
  for (const size of [0, -1, 1.5, 104857601]) {
    await post("STUDENT", { ...upload, size }, 400); assert.equal(calls.length, 0);
  }
  await post("STUDENT", { ...upload, size: 104857600 }, 200);
  assert.equal(calls[0][1].studentId, "student-1");
  await post("STUDENT", { ...upload, title: " " }, 400);
  await post("STUDENT", { ...upload, fileName: "clip.html", mime: "text/html" }, 400);
  await post("STUDENT", null, 400);
  exists = false; await post("STUDENT", upload, 400); exists = true;
  file = undefined;
  await post("STUDENT", { action: "complete", id: "other-student-file" }, 404);
  assert.deepEqual(calls[0], ["file", "other-student-file", "student-1", false]);
  file = { object_key: "owned-key", size_bytes: 100, mime_type: "audio/wav", status: "pending" };
  head = { ContentLength: 99, ContentType: "audio/wav" };
  await post("STUDENT", { action: "complete", id: "recording-1" }, 400);
  assert(!calls.some(call => call[0] === "complete"));
  head = { ContentLength: 100, ContentType: "text/html" };
  await post("STUDENT", { action: "complete", id: "recording-1" }, 400);
  head.ContentType = "audio/wav";
  await post("STUDENT", { action: "complete", id: "recording-1" }, 200);
  assert(calls.some(call => call[0] === "complete" && call[2] === "student-1"));
  for (const score of [-1, 101, 2.5, "90"]) await post("ADMIN", { action: "review", id: "recording-1", feedback: "Good", score }, 400);
  for (const score of [0, 100, null]) await post("ADMIN", { action: "review", id: "recording-1", feedback: "Good", score }, 200);
  assert.equal(calls[0][4], "admin-1");
  await post("ADMIN", { action: "exercise", title: "Practice", instructions: "Read aloud", active: true }, 200);
  await post("ADMIN", { action: "exercise", title: " ", instructions: "Read aloud", active: true }, 400);
  session = { user: { role: "STUDENT", id: "student-1" } }; calls = [];
  await api.GET(); assert.deepEqual(calls[0], ["load", "student-1", false]);
  session = { user: { role: "ADMIN", id: "admin-1" } }; calls = [];
  await api.GET(); assert.deepEqual(calls[0], ["load", "admin-1", true]);
  for (const action of ["edit", "delete", "replace"]) {
    for (const role of [null, "TEACHER", "ASSISTANT_ADMIN", "ADMIN"]) {
      await post(role, { action, id: "recording-1" }, 403);
      assert.equal(calls.length, 0);
    }
  }
  await post("STUDENT", { action: "edit", id: "recording-1", title: " Updated ", exerciseId: null }, 200);
  assert.deepEqual(calls[0], ["edit", "recording-1", "student-1", "Updated", null]);
  await post("STUDENT", { action: "edit", id: "recording-1", title: " ", exerciseId: null }, 400);
  exists = false;
  await post("STUDENT", { action: "edit", id: "someone-elses", title: "Updated", exerciseId: null }, 404);
  exists = true; file = undefined;
  await post("STUDENT", { action: "delete", id: "someone-elses" }, 404);
  assert(!calls.some(call => call[0] === "delete-audio"));
  file = { object_key: "owned-key", size_bytes: 100, mime_type: "audio/wav", status: "ready" };
  await post("STUDENT", { action: "delete", id: "recording-1" }, 200);
  assert.deepEqual(calls.find(call => call[0] === "delete"), ["delete", "recording-1", "student-1", "owned-key"]);
  assert.deepEqual(calls.find(call => call[0] === "delete-audio"), ["delete-audio", "owned-key"]);
  await post("STUDENT", { action: "replace", id: "same", originalId: "same" }, 400);
  await post("STUDENT", { action: "replace", id: "candidate", originalId: "recording-1" }, 409);
  file.status = "pending"; head = { ContentLength: 99, ContentType: "audio/wav" };
  await post("STUDENT", { action: "replace", id: "candidate", originalId: "recording-1" }, 400);
  assert(!calls.some(call => ["replace", "delete-audio"].includes(call[0])));
  head.ContentLength = 100; exists = false;
  await post("STUDENT", { action: "replace", id: "candidate", originalId: "someone-elses" }, 409);
  assert(!calls.some(call => call[0] === "delete-audio"));
  exists = true;
  await post("STUDENT", { action: "replace", id: "candidate", originalId: "recording-1" }, 200);
  assert.deepEqual(calls.find(call => call[0] === "replace"), ["replace", "recording-1", "candidate", "student-1"]);
  assert.deepEqual(calls.find(call => call[0] === "delete-audio"), ["delete-audio", "old-object-key"]);
  class AudioResponse {
    constructor(body, options) { this.body = body; this.status = options?.status ?? 200; }
    static redirect(url, options) { return { url, ...options }; }
  }
  const playback = load("app/api/studio/audio/[id]/route.ts", { ...mocks, "next/server": { NextResponse: AudioResponse } });
  const params = { params: Promise.resolve({ id: "recording-1" }) };
  session = null;
  assert.equal((await playback.GET({}, params)).status, 403);
  session = { user: { role: "STUDENT", id: "student-1" } }; calls = []; file = undefined;
  assert.equal((await playback.GET({}, params)).status, 404);
  assert.deepEqual(calls[0], ["file", "recording-1", "student-1", false]);
  file = { object_key: "owned-key", mime_type: "audio/wav", status: "pending" };
  assert.equal((await playback.GET({}, params)).status, 404);
  file.status = "ready";
  const playable = await playback.GET({ url: "http://localhost/api/studio/audio/recording-1" }, params);
  assert.equal(playable.status, 307);
  assert.equal(playable.url, "signed-playback");
  assert.equal(playable.headers["Cache-Control"], "private, no-store");
  assert.equal(calls.find(call => call[0] === "playback")[3], undefined);
  calls = []; file.title = "مقدمة البرنامج";
  const downloadable = await playback.GET({ url: "http://localhost/api/studio/audio/recording-1?download=1" }, params);
  assert.equal(downloadable.status, 307);
  assert.deepEqual(calls.find(call => call[0] === "playback"), ["playback", "owned-key", "audio/wav", "مقدمة البرنامج.wav"]);
  assert.equal(downloadable.headers["Cache-Control"], "private, no-store");
  calls = []; file = undefined;
  assert.equal((await playback.GET({ url: "http://localhost/api/studio/audio/other?download=1" }, params)).status, 404);
  assert(!calls.some(call => call[0] === "playback"));
  console.log("Studio checks passed: audio formats, 100 MB boundary, roles, student ownership, upload verification, exercise validation and review scores.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
