import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@shared/schema";
import { storage } from "@server/storage";
import { createCheckoutSession, isStripeConfigured } from "@server/stripe";
import { generateOrderNumber } from "@server/api";

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    const countryIssue = parsed.error.issues.find((issue) => issue.path[0] === "country");
    const message =
      countryIssue?.message || parsed.error.issues[0]?.message || "Invalid checkout details.";
    return NextResponse.json({ message }, { status: 400 });
  }

  const data = parsed.data;
  for (const item of data.items) {
    const product = await storage.getProduct(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { message: `Product unavailable: ${item.name}` },
        { status: 400 },
      );
    }
    if (product.stock < item.qty) {
      return NextResponse.json(
        { message: `Not enough stock for ${item.name} (${product.stock} left)` },
        { status: 400 },
      );
    }
  }

  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 15000 ? 0 : 999;
  const total = subtotal + shipping;
  const order = await storage.createOrder({
    orderNumber: generateOrderNumber(),
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || "",
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: data.country,
    items: JSON.stringify(data.items),
    subtotal,
    shipping,
    total,
    createdAt: new Date().toISOString(),
  });

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        message:
          "Payments are not connected yet. Add STRIPE_SECRET_KEY to .env.local to enable checkout.",
        orderNumber: order.orderNumber,
      },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  try {
    const session = await createCheckoutSession({
      lineItems: data.items.map((item) => ({
        name: `${item.name} (${item.size})`,
        images: item.image
          ? [new URL(item.image, origin).toString()]
          : [],
        amount: item.price,
        qty: item.qty,
      })),
      shippingAmount: shipping,
      customerEmail: data.email,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`,
      cancelUrl: `${origin}/cart`,
      metadata: { orderNumber: order.orderNumber, orderId: String(order.id) },
    });
    await storage.setOrderStripeSession(order.id, session.id);
    return NextResponse.json({ url: session.url, orderNumber: order.orderNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ message }, { status: 502 });
  }
}
