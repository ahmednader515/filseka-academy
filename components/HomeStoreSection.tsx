"use client";

import Link from "next/link";
import { useStoreSplash } from "@/components/StoreSplashProvider";
import type { StoreProductRow } from "@/lib/db";

export function HomeStoreSection({
  productsCount,
  sectionTitle,
  sectionDescription,
  products,
}: {
  productsCount: number;
  sectionTitle: string;
  sectionDescription: string;
  products: StoreProductRow[];
}) {
  const { startStoreSplashTransition } = useStoreSplash();

  const handleStoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    startStoreSplashTransition();
  };

  return (
    <>
      <section className="home-teachers-hero-blend border-t border-[var(--color-border)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <div className="bg-gradient-to-l from-[var(--color-primary)]/20 via-[var(--color-primary)]/10 to-transparent p-8 sm:p-10">
              <h2 className="text-3xl font-bold text-[var(--color-foreground)]">{sectionTitle}</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-7 text-[var(--color-muted)]">
                {sectionDescription}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/store"
                  onClick={handleStoreClick}
                  className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[var(--color-primary-hover)]"
                >
                  دخول متجر المنصة
                </Link>
                <span className="text-sm text-[var(--color-muted)]">عدد المنتجات المتاحة الآن: {productsCount}</span>
              </div>
            </div>
          </div>
          {products.length ? (
            <div className="filseka-course-track flex snap-x gap-4 overflow-x-auto p-5 sm:p-7">
              {products.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href="/store"
                  onClick={handleStoreClick}
                  className="group w-[min(74vw,250px)] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:border-[var(--color-primary)]/55 sm:w-[250px]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="p-4 text-white">
                    <h3 className="line-clamp-1 font-semibold">{product.title}</h3>
                    <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-white/50">{product.description}</p>
                    <p className="mt-3 text-sm font-bold text-red-200">{product.price.toLocaleString("en-US")} EGP</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
