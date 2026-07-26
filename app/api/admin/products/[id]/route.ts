import { NextResponse } from "next/server";
import { insertProductSchema } from "@shared/schema";
import { storage } from "@server/storage";
import { errorResponse, isAdmin, unauthorized } from "@server/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorized();
  const parsed = insertProductSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.message }, { status: 400 });
  }
  try {
    const product = await storage.updateProduct(Number((await params).id), parsed.data);
    return product
      ? NextResponse.json(product)
      : NextResponse.json({ message: "Product not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error, "Could not update product");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorized();
  const id = Number((await params).id);
  return (await storage.deleteProduct(id))
    ? NextResponse.json({ deleted: id })
    : NextResponse.json({ message: "Product not found" }, { status: 404 });
}
