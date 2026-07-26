"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart-context";
import { apiRequest } from "@/lib/queryClient";
import { assetPath } from "@/lib/utils";
import { SHIP_COUNTRIES, SHIP_COUNTRY_CODES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Lock } from "lucide-react";

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(3, "ZIP/postal code is required"),
  country: z.enum(SHIP_COUNTRY_CODES, {
    errorMap: () => ({ message: "We currently only ship to the United States and Canada" }),
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Checkout() {
  const { lines, subtotal } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentsUnavailable, setPaymentsUnavailable] = useState<string | null>(null);

  const shipping = subtotal >= 15000 ? 0 : 999;
  const total = subtotal + shipping;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
    },
  });

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-8">
        <h1 className="font-serif text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add something beautiful before checking out.</p>
        <Link href="/shop">
          <Button className="mt-6">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    setPaymentsUnavailable(null);
    try {
      const res = await apiRequest("POST", "/api/checkout/create-session", {
        ...values,
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          image: l.image,
          price: l.price,
          size: l.size,
          qty: l.qty,
        })),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/checkout/success");
      }
    } catch (e: any) {
      // Server returns 503 with a friendly message when Stripe isn't connected yet.
      const rawMessage: string = e?.message || "";
      const bodyText = rawMessage.replace(/^\d+:\s*/, "");
      let friendlyMessage = bodyText;
      try {
        const parsedBody = JSON.parse(bodyText);
        if (parsedBody?.message) friendlyMessage = parsedBody.message;
      } catch {
        // body wasn't JSON, use as-is
      }
      if (rawMessage.includes("503") || friendlyMessage.toLowerCase().includes("not connected")) {
        setPaymentsUnavailable(
          "Payments are not connected yet. Your order has been saved — the store owner needs to connect Stripe to complete checkout."
        );
      } else {
        toast({
          title: "Checkout failed",
          description: friendlyMessage || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <h1 className="mb-8 font-serif text-2xl sm:text-3xl" data-testid="text-checkout-title">
        Checkout
      </h1>

      {paymentsUnavailable && (
        <div
          className="mb-6 flex items-start gap-3 rounded-md border border-primary/30 bg-accent p-4 text-sm"
          data-testid="alert-payments-unavailable"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p>{paymentsUnavailable}</p>
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h2 className="mb-4 text-sm font-medium tracking-wide">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Priya Sharma" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-sm font-medium tracking-wide">Shipping Address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Boutique Lane" {...field} data-testid="input-address1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address Line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt, suite, etc." {...field} data-testid="input-address2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Biloxi" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="MS" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="39530" {...field} data-testid="input-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SHIP_COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  We currently ship to the United States and Canada only.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting} data-testid="button-place-order">
                <Lock className="h-4 w-4" />
                {submitting ? "Processing..." : `Pay ${formatPrice(total)} with Stripe`}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg">Order Summary</h2>
          <div className="mb-4 space-y-3">
            {lines.map((line) => (
              <div key={`${line.productId}-${line.size}`} className="flex items-center gap-3 text-sm">
                <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <img src={assetPath(line.image)} alt={line.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="line-clamp-1">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.size} × {line.qty}
                  </p>
                </div>
                <span className="font-medium">{formatPrice(line.price * line.qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-medium">
              <span>Total</span>
              <span data-testid="text-checkout-total">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
