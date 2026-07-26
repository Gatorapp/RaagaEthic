import { NextResponse } from "next/server";
import { CATEGORIES } from "@shared/schema";

export async function GET() {
  return NextResponse.json(CATEGORIES);
}
