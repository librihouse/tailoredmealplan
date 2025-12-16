/**
 * POST /api/profile/business/save
 * Save professional business profile
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const {
      businessName,
      businessType,
      website,
      phone,
      logoUrl,
      brandColors,
      themeColors,
      tagline,
      freeDailyPlan,
    } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("business_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const profileData: any = {
      user_id: userId,
      business_name: businessName,
      business_type: businessType || null,
      website: website || null,
      phone: phone || null,
      logo_url: logoUrl || null,
      brand_colors: brandColors ? JSON.stringify(brandColors) : null,
      theme_colors: themeColors ? JSON.stringify(themeColors) : null,
      tagline: tagline || null,
      free_daily_plan_generated: freeDailyPlan === true,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from("business_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        log(`Error updating business profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to update business profile" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseAdmin
        .from("business_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log(`Error creating business profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to create business profile" },
          { status: 500 }
        );
      }

      result = data;
    }

    log(`Business profile saved for user: ${userId}`, "profile");

    return NextResponse.json({
      success: true,
      profile: result,
    });
  } catch (error: any) {
    log(`Error in profile/business/save: ${error.message}`, "profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

