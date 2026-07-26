import { NextResponse } from "next/server";
import { insertProductSchema } from "@shared/schema";
import { storage } from "@server/storage";
import { errorResponse, isAdmin, unauthorized } from "@server/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  products: z.array(insertProductSchema).min(1, "At least one product is required"),
  replaceExisting: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();

  const parsed = importSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.message }, { status: 400 });
  }

  try {
    const result = await storage.importProducts(parsed.data.products, {
      replaceExisting: parsed.data.replaceExisting,
    });

    return NextResponse.json({
      message: "Inventory import complete",
      imported: result.imported,
      replacedAll: result.replacedAll,
    });
  } catch (error) {
    return errorResponse(error, "Could not import inventory");
  }
}
