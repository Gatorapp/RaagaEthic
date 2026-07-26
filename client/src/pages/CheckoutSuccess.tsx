"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutSuccess() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderNumber = params.get("order");
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/api/checkout/verify/${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error("verify failed");
        const data = await res.json();
        if (cancelled) return;
        setOrder(data.order);
        if (data.paid) {
          setStatus("paid");
          clearCart();
          return;
        }
        attempts += 1;
        if (attempts < 6) {
          setTimeout(poll, 2000);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center md:px-8">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 font-serif text-2xl">Confirming your payment...</h1>
          <p className="mt-2 text-sm text-muted-foreground">This will just take a moment.</p>
        </>
      )}

      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-serif text-2xl" data-testid="text-order-confirmed">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-order-number">
            Order #{order?.orderNumber || orderNumber} has been confirmed. A receipt has been sent to your email.
          </p>
          {order && (
            <div className="mt-6 rounded-md border border-border bg-card p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium" data-testid="text-order-total">{formatPrice(order.total)}</span>
              </div>
            </div>
          )}
          <Link href="/shop">
            <Button className="mt-8">Continue Shopping</Button>
          </Link>
        </>
      )}

      {status === "pending" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-serif text-2xl">Payment processing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We're still confirming your payment with Stripe. Order #{order?.orderNumber || orderNumber} will update
            automatically once confirmed — check your email shortly.
          </p>
          <Link href="/shop">
            <Button className="mt-8" variant="outline">Back to Shop</Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-serif text-2xl">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't confirm this order. If you were charged, please contact us with your order number.
          </p>
          <Link href="/shop">
            <Button className="mt-8" variant="outline">Back to Shop</Button>
          </Link>
        </>
      )}
    </div>
  );
}
