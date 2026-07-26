import { NextResponse } from "next/server";

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function isAdmin(request: Request) {
  return Boolean(ADMIN_PASSWORD) && request.headers.get("x-admin-key") === ADMIN_PASSWORD;
}

export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function errorResponse(error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ message: message || fallback }, { status });
}

export function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RG-${Date.now().toString().slice(-6)}${random}`;
}
