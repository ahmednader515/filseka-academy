import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { prisma } = await import("../lib/prisma");
  try {
    // Read-only checks against representative existing and newly added tables.
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
    if (result[0]?.ok !== 1) throw new Error("Connection check failed.");
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.course.count(),
      prisma.courseCertificate.count(),
    ]);
    console.log("PASS: Prisma Client connects and reads users, categories, courses, and certificates.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Avoid exposing connection strings or credentials in command output.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
  console.error(`Prisma connection check failed (code: ${code}). Check database configuration.`);
  process.exitCode = 1;
});
