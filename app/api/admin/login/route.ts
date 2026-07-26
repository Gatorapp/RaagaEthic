import { NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@server/api";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
