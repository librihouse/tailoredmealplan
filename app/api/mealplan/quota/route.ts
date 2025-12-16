/**
 * GET /api/mealplan/quota
 * Get current quota information
 */

import { NextRequest, NextResponse } from "next/server";
import { getQuotaInfo } from "@/server/quota-supabase";
import { authenticateRequest } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const quotaInfo = await getQuotaInfo(userId);
    
    if (!quotaInfo) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error("Error fetching quota:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

