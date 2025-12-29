/**
 * GET /api/plans
 * Fetch all active plans (public endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import { getPlans } from "@/server/services/plans";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") as "b2c" | "b2b" | null;

    const plans = await getPlans(category || undefined);

    return NextResponse.json({
      plans,
      count: plans.length,
    });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

