"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { assetPath } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart() {
  const { lines, updateQty, removeLine, subtotal } = useCart();
  const router = useRouter();

  const shipping = subtotal >= 15000 || subtotal === 0 ? 0 : 999;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-8">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover our latest collection of ethnic wear.
        </p>
        <Link href="/shop">
          <Button className="mt-6" data-testid="button-continue-shopping">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <h1 className="mb-8 font-serif text-2xl sm:text-3xl" data-testid="text-cart-title">
        Your Cart
      </h1>

      <div className="grid gap-10 md:grid-cols-3">
        <div className="space-y-5 md:col-span-2">
          {lines.map((line) => (
            <div
              key={`${line.productId}-${line.size}`}
              className="flex gap-4 border-b border-border pb-5"
              data-testid={`row-cart-item-${line.productId}-${line.size}`}
            >
              <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img src={assetPath(line.image)} alt={line.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-serif text-sm sm:text-base" data-testid={`text-cart-name-${line.productId}`}>
                    {line.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">Size: {line.size}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-input">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQty(line.productId, line.size, line.qty - 1)}
                      data-testid={`button-decrease-${line.productId}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-xs" data-testid={`text-line-qty-${line.productId}`}>
                      {line.qty}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQty(line.productId, line.size, line.qty + 1)}
                      data-testid={`button-increase-${line.productId}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-medium" data-testid={`text-line-total-${line.productId}`}>
                    {formatPrice(line.price * line.qty)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeLine(line.productId, line.size)}
                className="self-start text-muted-foreground hover:text-destructive"
                aria-label="Remove item"
                data-testid={`button-remove-${line.productId}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span data-testid="text-subtotal">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span data-testid="text-shipping">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">
                Free shipping on orders over $150
              </p>
            )}
            <div className="flex justify-between border-t border-border pt-3 font-medium">
              <span>Total</span>
              <span data-testid="text-total">{formatPrice(total)}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/checkout")} data-testid="button-checkout">
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
