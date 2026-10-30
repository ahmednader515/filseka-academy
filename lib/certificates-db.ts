import { randomUUID } from "node:crypto";
import { sql, getAllowedLessonIdsForUserCourse, hasFullCourseAccessAsStudent } from "@/lib/db";
import { DEFAULT_CERTIFICATE_DESIGN, type CertificateDesign } from "./certificate-design";

let schema: Promise<void> | undefined;
export function ensureCertificateSchema() {
  if (!schema) schema = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS "CertificateSettings" (id TEXT PRIMARY KEY, design JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS "CertificateCourse" (course_id TEXT PRIMARY KEY REFERENCES "Course"(id) ON DELETE CASCADE)`;
    await sql`CREATE TABLE IF NOT EXISTS "LessonCompletion" (user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id, lesson_id))`;
    await sql`CREATE TABLE IF NOT EXISTS "CourseCertificate" (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, course_id TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE, student_name TEXT NOT NULL, course_title TEXT NOT NULL, design JSONB NOT NULL, issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, course_id))`;
  })().catch((error) => { schema = undefined; throw error; });
  return schema;
}
export async function getCertificateSettings() {
  await ensureCertificateSchema();
  const [settings, courses] = await Promise.all([sql`SELECT design FROM "CertificateSettings" WHERE id = 'default'`, sql`SELECT course_id FROM "CertificateCourse"`]);
  return { design: (settings[0]?.design ?? DEFAULT_CERTIFICATE_DESIGN) as CertificateDesign, courseIds: courses.map((c) => String(c.course_id)) };
}
export async function saveCertificateSettings(design: CertificateDesign, courseIds: string[]) {
  await ensureCertificateSchema();
  const ids = JSON.stringify(courseIds);
  await sql.transaction([
    sql`INSERT INTO "CertificateSettings" (id, design) VALUES ('default', ${JSON.stringify(design)}::jsonb) ON CONFLICT (id) DO UPDATE SET design = EXCLUDED.design, updated_at = NOW()`,
    sql`DELETE FROM "CertificateCourse" WHERE course_id NOT IN (SELECT jsonb_array_elements_text(${ids}::jsonb))`,
    sql`INSERT INTO "CertificateCourse" (course_id) SELECT id FROM "Course" WHERE id IN (SELECT jsonb_array_elements_text(${ids}::jsonb)) ON CONFLICT DO NOTHING`,
  ]);
}
export async function canCompleteLesson(userId: string, courseId: string, lessonId: string) {
  const exists = await sql`SELECT id FROM "Lesson" WHERE id = ${lessonId} AND course_id = ${courseId}`;
  if (!exists.length) return false;
  return await hasFullCourseAccessAsStudent(userId, courseId) || (await getAllowedLessonIdsForUserCourse(userId, courseId)).includes(lessonId);
}
export async function completeLesson(userId: string, courseId: string, lessonId: string) {
  await ensureCertificateSchema();
  if (!await canCompleteLesson(userId, courseId, lessonId)) throw new Error("FORBIDDEN");
  await sql`INSERT INTO "LessonCompletion" (user_id, lesson_id) VALUES (${userId}, ${lessonId}) ON CONFLICT DO NOTHING`;
  return getCertificateProgress(userId, courseId, true);
}
export async function getCertificateProgress(userId: string, courseId: string, issue = false) {
  await ensureCertificateSchema();
  const rows = await sql`SELECT l.id, lc.lesson_id IS NOT NULL AS completed FROM "Lesson" l LEFT JOIN "LessonCompletion" lc ON lc.lesson_id = l.id AND lc.user_id = ${userId} WHERE l.course_id = ${courseId}`;
  const enabledRows = await sql`SELECT course_id FROM "CertificateCourse" WHERE course_id = ${courseId}`;
  const enabled = enabledRows.length > 0;
  const completedIds = rows.filter((r) => r.completed).map((r) => String(r.id));
  if (issue && enabled && rows.length > 0 && completedIds.length === rows.length) {
    const { design } = await getCertificateSettings();
    // Eligibility is rechecked in the INSERT; concurrent requests issue only one certificate.
    await sql`INSERT INTO "CourseCertificate" (id, user_id, course_id, student_name, course_title, design)
      SELECT ${randomUUID()}, u.id, c.id, u.name, COALESCE(NULLIF(c.title_ar, ''), c.title), ${JSON.stringify(design)}::jsonb
      FROM "User" u CROSS JOIN "Course" c
      WHERE u.id = ${userId} AND u.role = 'STUDENT' AND c.id = ${courseId}
      AND EXISTS (SELECT 1 FROM "CertificateCourse" cc WHERE cc.course_id = c.id)
      AND EXISTS (SELECT 1 FROM "Lesson" l WHERE l.course_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l.course_id = c.id AND NOT EXISTS (SELECT 1 FROM "LessonCompletion" lc WHERE lc.lesson_id = l.id AND lc.user_id = u.id))
      ON CONFLICT (user_id, course_id) DO NOTHING`;
  }
  const certs = await sql`SELECT id FROM "CourseCertificate" WHERE user_id = ${userId} AND course_id = ${courseId}`;
  return { enabled, total: rows.length, completedIds, certificateId: certs[0]?.id ? String(certs[0].id) : null };
}
export type IssuedCertificate = { id: string; student_name: string; course_title: string; design: CertificateDesign; issued_at: string };
export async function getIssuedCertificate(id: string): Promise<IssuedCertificate | null> {
  if (!/^[a-f\d-]{36}$/i.test(id)) return null;
  await ensureCertificateSchema();
  const rows = await sql`SELECT id, student_name, course_title, design, issued_at FROM "CourseCertificate" WHERE id = ${id}`;
  return (rows[0] as IssuedCertificate | undefined) ?? null;
}
