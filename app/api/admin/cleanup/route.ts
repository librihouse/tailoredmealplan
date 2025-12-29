/**
 * Admin Cleanup API Route
 * Triggers cleanup of expired free tier meal plans and share links
 * Can be called by cron jobs or scheduled tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { runCleanupTasks } from "@/server/services/cleanup";
import { log } from "@/lib/api-helpers";

/**
 * POST /api/admin/cleanup
 * Trigger cleanup tasks
 * 
 * Optional: Add authentication check for admin users
 * For now, we'll use a simple API key check via header
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.CLEANUP_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    log("Cleanup task triggered via API", "cleanup");

    const results = await runCleanupTasks();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    log(`Error in admin/cleanup: ${error.message}`, "cleanup");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cleanup endpoint is available",
    timestamp: new Date().toISOString(),
  });
}

