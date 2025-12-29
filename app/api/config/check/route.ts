import { NextResponse } from "next/server";
import { getSupabaseConfigDiagnostics, isSupabaseConfigured, isUsingPlaceholderCredentials } from "@/lib/supabase";

/**
 * GET /api/config/check
 * 
 * Development-only endpoint to check Supabase configuration status
 * Returns diagnostic information without exposing sensitive values
 */
export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  const diagnostics = getSupabaseConfigDiagnostics();
  const isConfigured = isSupabaseConfigured();
  const isUsingPlaceholder = isUsingPlaceholderCredentials();

  return NextResponse.json({
    configured: isConfigured,
    usingPlaceholder: isUsingPlaceholder,
    diagnostics: {
      hasUrl: diagnostics.hasUrl,
      hasKey: diagnostics.hasKey,
      urlLength: diagnostics.urlLength,
      keyLength: diagnostics.keyLength,
      urlIsValid: diagnostics.urlIsValid,
      keyIsValid: diagnostics.keyIsValid,
      urlPreview: diagnostics.urlPreview,
      keyPreview: diagnostics.keyPreview,
      errors: diagnostics.errors,
      warnings: diagnostics.warnings,
      formattingIssues: diagnostics.formattingIssues,
      inProcessEnv: diagnostics.inProcessEnv,
    },
    setupInstructions: {
      step1: "Create a .env.local file in the project root directory",
      step2: "Add: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
      step3: "Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here",
      step4: "Get credentials from: https://app.supabase.com → Your Project → Settings → API",
      step5: "⚠️ IMPORTANT: Restart your dev server after creating/updating .env.local",
    },
    documentation: {
      envSetup: "See ENV_SETUP.md for detailed instructions",
      supabaseSetup: "See SUPABASE_SETUP.md for Supabase-specific setup",
    },
  });
}

