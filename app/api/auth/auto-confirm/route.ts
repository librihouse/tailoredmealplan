/**
 * POST /api/auth/auto-confirm
 * Auto-confirm a user's email (for testing only)
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { log } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: "Service role key not configured. Please disable email confirmation in Supabase dashboard instead." 
        },
        { status: 500 }
      );
    }

    // Use admin client to update user's email_confirmed status
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      log(`Error auto-confirming user: ${error.message}`, "auth");
      return NextResponse.json(
        { error: "Failed to confirm user: " + error.message },
        { status: 500 }
      );
    }

    log(`User ${userId} auto-confirmed for testing`, "auth");

    return NextResponse.json({
      success: true,
      message: "User email confirmed successfully",
      user: data.user,
    });
  } catch (error: any) {
    log(`Error in auth/auto-confirm: ${error.message}`, "auth");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

