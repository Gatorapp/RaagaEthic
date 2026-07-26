import { NextResponse } from "next/server";
import { insertProductSchema } from "@shared/schema";
import { storage } from "@server/storage";
import { errorResponse, isAdmin, unauthorized } from "@server/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  return NextResponse.json(await storage.listProducts());
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  const parsed = insertProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.message }, { status: 400 });
  }
  try {
    return NextResponse.json(await storage.createProduct(parsed.data), { status: 201 });
  } catch (error) {
    return errorResponse(error, "Could not create product");
  }
}
