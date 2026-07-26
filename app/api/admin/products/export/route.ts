import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { isAdmin, unauthorized } from "@server/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized();

  const products = await storage.exportProducts();
  const payload = {
    exportedAt: new Date().toISOString(),
    products,
  };

  return NextResponse.json(payload, {
    headers: {
      "content-disposition": `attachment; filename=inventory-${Date.now()}.json`,
    },
  });
}
