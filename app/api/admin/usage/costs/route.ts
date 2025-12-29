/**
 * GET /api/admin/usage/costs
 * Get cost analytics for admin dashboard
 * Protected by admin API key
 */

import { NextRequest, NextResponse } from "next/server";
import { getCostAnalytics } from "@/server/services/usage-monitoring";

/**
 * Verify admin API key
 */
function verifyAdminKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === apiKey;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month"); // Format: "2025-01"

    let startDate: string;
    let endDate: string;

    if (month) {
      // Use provided month
      startDate = `${month}-01T00:00:00Z`;
      const date = new Date(`${month}-01`);
      date.setMonth(date.getMonth() + 1);
      endDate = date.toISOString().split('T')[0] + 'T00:00:00Z';
    } else {
      // Use current month
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      startDate = `${monthStr}-01T00:00:00Z`;
      const end = new Date(`${monthStr}-01`);
      end.setMonth(end.getMonth() + 1);
      endDate = end.toISOString().split('T')[0] + 'T00:00:00Z';
    }

    const analytics = await getCostAnalytics(startDate, endDate);

    return NextResponse.json({
      period: {
        start: startDate,
        end: endDate,
        month: month || null,
      },
      analytics,
    });
  } catch (error: any) {
    console.error("Error fetching cost analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cost analytics",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

