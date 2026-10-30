"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StoreProduct } from "@/lib/types";
import { AcademyIcon } from "@/components/AcademyIcon";
import { useLocale } from "@/components/LocaleProvider";
import styles from "./store.module.css";

export function StoreBrowseClient({
  products,
  isSubscribed,
  isLoggedIn,
  purchasedProductIds,
}: {
  products: StoreProduct[];
  isSubscribed: boolean;
  isLoggedIn: boolean;
  purchasedProductIds: string[];
}) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const [query, setQuery] = useState("");
  const [ownedIds, setOwnedIds] = useState<string[]>(purchasedProductIds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  async function buy(productId: string) {
    setError("");
    setLoadingId(productId);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الشراء");
      setOwnedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الشراء");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <header className={styles.header}>
        <nav aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/dashboard">{text("لوحة تعلمي", "My dashboard")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("المكتبة الإعلامية", "Media library")}</span></nav>
        <div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name="book" /></span><div><h1>{text("المكتبة الإعلامية", "Media library")}</h1><p>{text("اكتشف الكتب والملزمات والموارد التي تدعم رحلتك مع الأكاديمية.", "Explore books, study guides and resources for your academy journey.")}</p></div></div>
      </header>
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div><h2>{text("استكشف المكتبة", "Explore the library")}</h2><p>{text("ابحث باسم الملزمة أو الكتاب ثم اختر المنتج المناسب.", "Search for a book or study guide to find the right resource.")}</p></div>
          <label className={styles.search}>
          <span className="sr-only">{text("ابحث في المكتبة", "Search the library")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={text("ابحث باسم الملزمة أو الكتاب...", "Search books and study guides…")}
          />
          </label>
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <div className={styles.grid}>
          {filtered.map((p) => (
            <article key={p.id} id={`product-${p.id}`} className={styles.card}>
              {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className={styles.image} /> : <div className={styles.placeholder}><AcademyIcon name="book" /></div>}
              <div className={styles.cardBody}>
                <h3>{p.title}</h3>
                <p className={styles.description}>{p.description}</p>
                <div className={styles.cardFooter}>
                  {(() => {
                    const canAccess = isSubscribed || ownedIds.includes(p.id);
                    const canDownload = canAccess && !!p.pdfUrl;
                    return (
                      <>
                  {isSubscribed ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
                      {text("مجاني ضمن اشتراكك", "Included in your subscription")}
                    </span>
                  ) : ownedIds.includes(p.id) ? (
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">
                      {text("تم الشراء بنجاح", "Purchased")}
                    </span>
                  ) : (
                    <span className={styles.price}>{Number(p.price).toFixed(2)} <small>{text("ج.م", "EGP")}</small></span>
                  )}
                  {canDownload ? (
                    <a href={p.pdfUrl ?? undefined} target="_blank" rel="noopener noreferrer" className={styles.button}>{text("تحميل PDF", "Download PDF")}</a>
                  ) : canAccess ? (
                    <span className={styles.unavailable}>{text("الملف غير متاح حالياً", "File currently unavailable")}</span>
                  ) : (
                    isLoggedIn ? (
                      <button
                        onClick={() => void buy(p.id)}
                        disabled={loadingId === p.id}
                        className={styles.button}
                      >
                        {loadingId === p.id ? text("جاري الشراء...", "Purchasing…") : text("شراء المنتج", "Buy resource")}
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className={styles.button}
                      >
                        {text("تسجيل الدخول للشراء", "Sign in to purchase")}
                      </Link>
                    )
                  )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? <div className={styles.empty}><AcademyIcon name="book" /><h3>{text("لا توجد نتائج", "No resources found")}</h3><p>{text("جرّب البحث باسم آخر للعثور على ما تحتاجه.", "Try another search to find the resource you need.")}</p></div> : null}
        </div>
      </div>
    </section>
  );
}
