import { z } from "zod";
import type { AcademyIconName } from "@/components/AcademyIcon";

export const PORTFOLIO_CATEGORIES = [
  { id: "programs", ar: "برامج تلفزيونية", en: "TV programs", icon: "video" },
  { id: "podcasts", ar: "بودكاست", en: "Podcasts", icon: "mic" },
  { id: "projects", ar: "مشاريع المتدربين", en: "Student projects", icon: "users" },
  { id: "events", ar: "تغطيات وفعاليات", en: "Events", icon: "broadcast" },
  { id: "backstage", ar: "كواليس الإنتاج", en: "Behind the scenes", icon: "camera" },
] satisfies { id: string; ar: string; en: string; icon: AcademyIconName }[];

export const portfolioCategorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/).refine((id) => id !== "all"),
  ar: z.string().trim().min(1).max(120),
  en: z.string().trim().min(1).max(120),
  icon: z.enum(["video", "mic", "users", "broadcast", "camera", "layers", "graduate", "book"]),
});
export const portfolioCategoriesSchema = z.array(portfolioCategorySchema).min(1).max(50).refine((items) => new Set(items.map((item) => item.id)).size === items.length);
export type PortfolioCategory = z.infer<typeof portfolioCategorySchema>;

export function portfolioMedia(value: string): { kind: "youtube" | "facebook" | "video"; src: string; isShort: boolean } | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(?:embed|shorts)\/([^/]+)\/?$/.exec(url.pathname)?.[1] || null;
    }
    if (id && /^[\w-]{11}$/.test(id)) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, isShort: url.pathname.startsWith("/shorts/") };
    if (["facebook.com", "m.facebook.com", "web.facebook.com"].includes(host)) {
      const reelId = /^\/reels?\/(\d+)\/?$/.exec(url.pathname)?.[1];
      const videoId = /^\/(?:[^/]+\/)?videos\/(?:[^/]+\/)?(\d+)\/?$/.exec(url.pathname)?.[1]
        || (/^\/(?:watch\/?|video\.php)$/.test(url.pathname) ? url.searchParams.get("v") : null);
      const facebookId = reelId || videoId;
      if (facebookId && /^\d+$/.test(facebookId)) {
        const href = reelId ? `https://www.facebook.com/reel/${facebookId}/` : `https://www.facebook.com/watch/?v=${facebookId}`;
        const params = new URLSearchParams({ href, show_text: "false", width: reelId ? "360" : "640", height: reelId ? "640" : "360" });
        return { kind: "facebook", src: `https://www.facebook.com/plugins/video.php?${params}`, isShort: !!reelId };
      }
      return null;
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { kind: "video", src: url.href, isShort: false };
  } catch { /* Unsupported media URLs stay out of the player. */ }
  return null;
}

const imageUrl = z.string().trim().min(1).max(2000).refine((value) => {
  if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return true;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
});
export const portfolioSchema = z.object({
  title: z.string().trim().min(2).max(150),
  titleEn: z.string().trim().max(150).default(""),
  description: z.string().trim().max(3000).default(""),
  descriptionEn: z.string().trim().max(3000).default(""),
  credit: z.string().trim().max(150).default(""),
  creditEn: z.string().trim().max(150).default(""),
  category: portfolioCategorySchema.shape.id,
  imageUrl,
  videoUrl: z.string().trim().max(2000).refine((value) => !value || !!portfolioMedia(value)).default(""),
  duration: z.string().trim().regex(/^(?:\d{1,3}:)?\d{1,2}:[0-5]\d$|^$/).default(""),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).max(10000).default(0),
}).refine((item) => !item.isPublished || !!portfolioMedia(item.videoUrl), { path: ["videoUrl"], message: "A published work needs a supported video URL" });

export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type PortfolioWork = PortfolioInput & { id: string; isDemo?: boolean };

// Illustrative layouts only: no invented videos, durations or production statistics.
export const PORTFOLIO_DEMOS: PortfolioWork[] = [
  { title: "حكاوي زمان", titleEn: "Stories from the past", category: "programs", imageUrl: "/category-artwork/presenting.webp" },
  { title: "من الفكرة للمايك", titleEn: "From idea to microphone", category: "podcasts", imageUrl: "/category-artwork/podcasting.webp" },
  { title: "أول خطوة قدام الكاميرا", titleEn: "A first step on camera", category: "projects", imageUrl: "/category-artwork/acting.webp" },
  { title: "كواليس التصوير", titleEn: "Behind the camera", category: "backstage", imageUrl: "/category-artwork/filmmaking.webp" },
  { title: "حوار في الاستوديو", titleEn: "Studio conversations", category: "programs", imageUrl: "/category-artwork/general.webp" },
  { title: "صوت وحكاية", titleEn: "A voice and a story", category: "podcasts", imageUrl: "/category-artwork/podcasting.webp" },
  { title: "يوم في الأكاديمية", titleEn: "A day at the academy", category: "events", imageUrl: "/category-artwork/filmmaking.webp" },
  { title: "من اللقطة للحكاية", titleEn: "From a shot to a story", category: "projects", imageUrl: "/category-artwork/content-editing.webp" },
].map((item, index) => ({ ...item, category: item.category as PortfolioInput["category"], id: `demo-work-${index + 1}`, description: "نموذج تجريبي لطريقة عرض أعمال الأكاديمية. ستظهر هنا الأعمال المصوّرة بعد نشرها من إدارة الأكاديمية.", descriptionEn: "An illustrative preview of the academy gallery. Published academy productions will appear here once added.", credit: "نموذج لعرض الأعمال", creditEn: "Gallery demo", videoUrl: "", duration: "", isPublished: false, order: index, isDemo: true }));
