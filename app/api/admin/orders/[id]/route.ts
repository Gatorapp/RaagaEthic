import { NextResponse } from "next/server";
import { ORDER_STATUSES } from "@shared/schema";
import { storage } from "@server/storage";
import { isAdmin, unauthorized } from "@server/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorized();
  const { status } = await request.json();
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }
  const order = await storage.updateOrderStatus(Number((await params).id), status);
  return order
    ? NextResponse.json(order)
    : NextResponse.json({ message: "Order not found" }, { status: 404 });
}
