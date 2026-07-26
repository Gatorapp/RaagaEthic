import { NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") || undefined;
  const products = await storage.listProducts({ category, activeOnly: true });
  return NextResponse.json(products);
}
