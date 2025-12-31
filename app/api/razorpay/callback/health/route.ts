/**
 * Health check endpoint for Razorpay callback URL
 * Razorpay may check if callback URL is accessible before processing payment
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Razorpay callback endpoint is accessible" },
    { status: 200 }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

