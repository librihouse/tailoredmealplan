/**
 * DELETE /api/family/members/[id]
 * Delete a family member
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { id: memberId } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Verify the member belongs to the user
    const { data: member, error: fetchError } = await supabaseAdmin
      .from("family_members")
      .select("id")
      .eq("id", memberId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Delete the member
    const { error: deleteError } = await supabaseAdmin
      .from("family_members")
      .delete()
      .eq("id", memberId)
      .eq("user_id", userId);

    if (deleteError) {
      log(`Error deleting family member: ${deleteError.message}`, "family");
      return NextResponse.json(
        { error: "Failed to delete family member" },
        { status: 500 }
      );
    }

    log(`Family member deleted: ${memberId} for user ${userId}`, "family");

    return NextResponse.json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error: any) {
    log(`Error in family/members/delete: ${error.message}`, "family");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

