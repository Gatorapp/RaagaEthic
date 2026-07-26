"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { assetPath, DEFAULT_PRODUCT_IMAGE, parseProductList } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, ChevronLeft } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-lg text-muted-foreground" data-testid="text-product-not-found">
          Sorry, we couldn't find that product.
        </p>
        <Link href="/shop">
          <Button className="mt-6">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const images = parseProductList(product.images, [DEFAULT_PRODUCT_IMAGE]);
  const sizes = parseProductList(product.sizes, ["One Size"]);
  const outOfStock = product.stock <= 0;
  const selectedSize = size || sizes[0] || "";

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    addToCart(product, selectedSize, qty);
    toast({ title: "Added to cart", description: `${product.name} (${selectedSize}) x${qty}` });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/shop" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary" data-testid="link-back-to-shop">
        <ChevronLeft className="h-4 w-4" /> Back to Shop
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <img
              src={assetPath(images[activeImage] || images[0])}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
              }}
              data-testid="img-product-main"
            />
            {outOfStock && (
              <Badge variant="secondary" className="absolute left-3 top-3">
                Sold Out
              </Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border-2 ${
                    activeImage === i ? "border-primary" : "border-transparent"
                  }`}
                  data-testid={`button-thumbnail-${i}`}
                >
                  <img
                    src={assetPath(img)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl" data-testid="text-product-name">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-medium" data-testid="text-product-price">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground" data-testid="text-product-description">
            {product.description}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Fabric</dt>
              <dd data-testid="text-product-fabric">{product.fabric}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Color</dt>
              <dd data-testid="text-product-color">{product.color}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">SKU</dt>
              <dd>{product.sku}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Availability</dt>
              <dd data-testid="text-product-stock">
                {outOfStock ? "Sold out" : `${product.stock} in stock`}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Size</label>
              <Select value={selectedSize} onValueChange={setSize} disabled={outOfStock}>
                <SelectTrigger className="w-40" data-testid="select-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Quantity</label>
              <div className="flex w-32 items-center rounded-md border border-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={outOfStock}
                  data-testid="button-qty-decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="flex-1 text-center text-sm" data-testid="text-qty">
                  {qty}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={outOfStock}
                  data-testid="button-qty-increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={handleAddToCart}
              disabled={outOfStock}
              data-testid="button-add-to-cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {outOfStock ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
