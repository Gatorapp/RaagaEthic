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

  const fileName = `inventory-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=${fileName}`,
      "cache-control": "no-store",
    },
  });
}
