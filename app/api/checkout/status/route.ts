import { NextResponse } from "next/server";
import { isStripeConfigured } from "@server/stripe";

export async function GET() {
  return NextResponse.json({ configured: isStripeConfigured() });
}
