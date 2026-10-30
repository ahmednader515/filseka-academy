import { z } from "zod";

export const categoryInput = z.object({
  name: z.string().trim().min(1).max(150),
  nameAr: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(160).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u).optional(),
  description: z.string().trim().max(2000).default(""),
  imageUrl: z.string().trim().max(4000).refine((v) => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v), "Use an image URL or uploaded image").default(""),
  order: z.number().int().min(0).max(10000).default(0),
});

export function generateCategorySlug(name: string, uniqueSuffix: string) {
  const base = name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "")
    .slice(0, 120).replace(/-+$/, "") || "category";
  return `${base}-${uniqueSuffix}`;
}
