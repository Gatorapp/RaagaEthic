"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { CATEGORIES } from "@shared/schema";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { assetPath } from "@/lib/utils";
import { Heart, Leaf, Gem, Truck } from "lucide-react";

const CATEGORY_IMAGES: Record<string, string> = {
  "Lehenga Choli": "/products/collection-17.png",
  Blouse: "/products/collection-12.jpg",
  Dupatta: "/products/collection-15.jpg",
  Kurtas: "/products/collection-09.jpg",
  Accessories: "/products/collection-03.jpg",
};

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const featured = (products || []).filter((p) => p.featured).slice(0, 4);
  const showcase = featured.length > 0 ? featured : (products || []).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-0 sm:px-4 md:px-8">
          <div className="relative aspect-[916/575] w-full overflow-hidden sm:aspect-[1290/575]">
            <img
              src={assetPath("/products/hero-banner.png")}
              alt="Raaga Ethnic Couture — brand story and signature lehenga"
              className="absolute inset-0 h-full w-full object-cover object-left sm:object-contain"
              data-testid="img-hero"
            />
          </div>

          {/* Brand Story — mobile only; desktop shows this inside the hero graphic */}
          <div className="bg-sidebar px-6 py-8 text-center sm:hidden" data-testid="section-brand-story-mobile">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sidebar-primary">
              Brand Story
            </p>
            <div className="mx-auto mt-2 h-px w-10 bg-sidebar-primary/60" />
            <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground">
              Raaga Ethnic Couture is a celebration of heritage, artistry and timeless
              elegance.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-sidebar-foreground">
              Inspired by traditional Indian crafts and contemporary silhouettes, we
              create outfits that make every woman feel confident, graceful and truly
              her own.
            </p>
            <Gem className="mx-auto mt-5 h-5 w-5 text-sidebar-primary" />
          </div>

          <div className="flex justify-center py-8">
            <Link href="/shop" data-testid="link-shop-now">
              <Button size="lg" className="rounded-full px-8">
                Shop the Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.25em] text-primary">SHOP BY CATEGORY</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl">Discover Your Style</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className="group block"
              data-testid={`link-home-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                <img
                  src={assetPath(CATEGORY_IMAGES[cat])}
                  alt={cat}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="font-serif text-sm text-white drop-shadow sm:text-base">{cat}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] text-primary">CURATED FOR YOU</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl">Featured Pieces</h2>
          </div>
          <Link href="/shop" className="hidden text-sm text-primary hover:underline sm:block" data-testid="link-view-all">
            View All
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : showcase.length === 0 ? (
          <p className="text-center text-muted-foreground" data-testid="text-no-products">
            New arrivals coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {showcase.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
      </section>

      {/* Brand story */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-8 md:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <img
              src={assetPath("/products/collection-18.png")}
              alt="Ivory and black folk-panel lehenga craftsmanship"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs tracking-[0.25em] text-primary">OUR STORY</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
              Where Heritage Meets Craft
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Raaga Ethnic Couture was born from a love of India's rich textile traditions.
              Every piece is hand-finished by skilled artisans, blending time-honored
              embroidery techniques with silhouettes made for the modern woman. We believe
              ethnic wear should feel like an heirloom in the making — beautiful, considered,
              and made to last.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { icon: Heart, label: "Handcrafted" },
                { icon: Leaf, label: "Heritage Fabrics" },
                { icon: Gem, label: "Timeless Design" },
                { icon: Truck, label: "Free Shipping $150+" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
