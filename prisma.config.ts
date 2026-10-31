import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Match Next.js environment loading, including .env.local and shell overrides.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Generation works before database credentials are configured; database commands require a URL.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
