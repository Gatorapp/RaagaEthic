import { NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await storage.getProductBySlug(slug);
  if (!product || !product.active) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}
