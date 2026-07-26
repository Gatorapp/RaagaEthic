import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { isAdmin, unauthorized } from "@server/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  return NextResponse.json(await storage.listOrders());
}
