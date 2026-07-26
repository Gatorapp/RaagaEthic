"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { CATEGORIES } from "@shared/schema";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function Shop() {
  const params = useSearchParams();
  const category = params.get("category") || "";

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: category ? ["/api/products", `?category=${category}`] : ["/api/products"],
    queryFn: async () => {
      const url = category ? `/api/products?category=${encodeURIComponent(category)}` : "/api/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 text-center">
        <p className="text-xs tracking-[0.25em] text-primary">THE COLLECTION</p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl" data-testid="text-shop-title">
          {category || "All Products"}
        </h1>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <Link href="/shop">
          <Button
            size="sm"
            variant={!category ? "default" : "outline"}
            className="rounded-full"
            data-testid="button-filter-all"
          >
            All
          </Button>
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/shop?category=${encodeURIComponent(cat)}`}>
            <Button
              size="sm"
              variant={category === cat ? "default" : "outline"}
              className="rounded-full"
              data-testid={`button-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {cat}
            </Button>
          </Link>
        ))}
        {category && (
          <Link href="/shop">
            <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" data-testid="button-clear-filter">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-md" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground" data-testid="text-empty-shop">
          No products found in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
