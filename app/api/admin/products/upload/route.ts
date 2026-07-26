import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { errorResponse, isAdmin, unauthorized } from "@server/api";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

function sanitizeFileBaseName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "product";
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No image file was provided" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, and WebP images are supported" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const baseName = sanitizeFileBaseName(file.name);
    const fileName = `${baseName}-${Date.now()}${extension}`;
    const productsDir = path.join(process.cwd(), "public", "products");
    const destination = path.join(productsDir, fileName);

    await mkdir(productsDir, { recursive: true });
    await writeFile(destination, bytes);

    return NextResponse.json({
      path: `/products/${fileName}`,
      fileName,
    });
  } catch (error) {
    return errorResponse(error, "Could not upload image");
  }
}
