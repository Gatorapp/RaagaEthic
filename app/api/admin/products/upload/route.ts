import { NextResponse } from "next/server";
import { errorResponse, isAdmin, unauthorized } from "@server/api";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

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
    const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

    return NextResponse.json({
      path: dataUrl,
      storage: "inline",
    });
  } catch (error) {
    return errorResponse(error, "Could not upload image");
  }
}
