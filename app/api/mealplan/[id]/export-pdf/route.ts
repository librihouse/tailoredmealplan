/**
 * PDF Export API Route
 * Generates and returns a PDF of the meal plan
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";
import { generateMealPlanPDF } from "@/server/services/pdf-generator";
import { getPlan } from "@shared/plans";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

/**
 * GET /api/mealplan/[id]/export-pdf
 * Generate and download PDF for a meal plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const planId = params.id;

    // Fetch the meal plan
    const { data: plan, error: planError } = await dbClient
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    // Check user's subscription status to determine if free tier
    const { data: subscriptions, error: subError } = await dbClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    let isFreeTier = true;
    if (!subError && subscriptions && subscriptions.length > 0) {
      const subscription = subscriptions[0];
      const planId = subscription.plan_id as string;
      isFreeTier = planId === "free";
    } else {
      // No active subscription means free tier
      isFreeTier = true;
    }

    // Generate PDF
    try {
      const pdfBuffer = await generateMealPlanPDF({
        planData: plan.plan_data as any,
        planType: plan.plan_type as 'daily' | 'weekly' | 'monthly',
        createdAt: plan.created_at,
        isFreeTier,
      });

      // Return PDF as response
      const filename = `meal-plan-${planId}-${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (pdfError: any) {
      log(`Error generating PDF: ${pdfError.message}`, "pdf-export");
      
      // Provide more specific error messages
      let errorMessage = "Failed to generate PDF";
      if (pdfError.message?.includes('font') || pdfError.message?.includes('.afm') || pdfError.message?.includes('ENOENT')) {
        errorMessage = "PDF generation failed due to font configuration issue. Please try regenerating the plan or contact support if this persists.";
        log(`Font-related PDF error: ${pdfError.message}`, "pdf-export");
        log(`Full error details: ${JSON.stringify(pdfError)}`, "pdf-export");
      } else if (pdfError.message?.includes('plan_data') || pdfError.message?.includes('structure')) {
        errorMessage = "PDF generation failed due to invalid meal plan data. Please try regenerating the plan.";
        log(`Data structure PDF error: ${pdfError.message}`, "pdf-export");
        log(`Full error details: ${JSON.stringify(pdfError)}`, "pdf-export");
      } else {
        errorMessage = pdfError.message || "Failed to generate PDF. Please try again or contact support.";
        log(`PDF generation error: ${pdfError.message}`, "pdf-export");
        log(`Full error details: ${JSON.stringify(pdfError)}`, "pdf-export");
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    log(`Error in mealplan/export-pdf: ${error.message}`, "pdf-export");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

