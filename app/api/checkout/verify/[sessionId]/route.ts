import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { retrieveCheckoutSession } from "@server/stripe";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  try {
    const order = await storage.getOrderByStripeSessionId(sessionId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    if (order.status === "paid" || order.status === "fulfilled") {
      return NextResponse.json({ order, paid: true });
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status === "paid") {
      const items = JSON.parse(order.items);
      for (const item of items) {
        await storage.decrementStock(item.productId, item.qty);
      }
      const updated = await storage.updateOrderStatus(order.id, "paid");
      return NextResponse.json({ order: updated, paid: true });
    }
    return NextResponse.json({ order, paid: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify payment";
    return NextResponse.json({ message }, { status: 502 });
  }
}
