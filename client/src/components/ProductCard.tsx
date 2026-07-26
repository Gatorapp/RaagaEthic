import Link from "next/link";
import type { Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { assetPath, DEFAULT_PRODUCT_IMAGE, parseProductList } from "@/lib/utils";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const images = parseProductList(product.images, [DEFAULT_PRODUCT_IMAGE]);
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      data-testid={`card-product-${product.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
        <img
          src={assetPath(images[0])}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
          }}
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="secondary" data-testid={`badge-outofstock-${product.id}`}>
              Sold Out
            </Badge>
          </div>
        )}
        {product.compareAtPrice && !outOfStock && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">Sale</Badge>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
        <h3 className="font-serif text-base leading-snug" data-testid={`text-name-${product.id}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" data-testid={`text-price-${product.id}`}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
