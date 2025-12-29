"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { isSupabaseConfigured, isUsingPlaceholderCredentials, getSupabaseConfigDiagnostics } from "@/lib/supabase";
import Link from "next/link";

/**
 * SupabaseConfigCheck Component
 * 
 * Checks Supabase configuration and displays helpful error messages
 * Only shows in development mode
 */
export function SupabaseConfigCheck() {
  const [configError, setConfigError] = useState<{
    errors: string[];
    warnings: string[];
    setupSteps: string[];
  } | null>(null);

  useEffect(() => {
    // Only check in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const checkConfiguration = () => {
      if (!isSupabaseConfigured() || isUsingPlaceholderCredentials()) {
        const diagnostics = getSupabaseConfigDiagnostics();
        
        const setupSteps = [
          "Create a `.env.local` file in the project root directory",
          "Add: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
          "Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here",
          "Get credentials from: https://app.supabase.com → Settings → API",
          "⚠️ Restart dev server after updating .env.local",
        ];

        setConfigError({
          errors: diagnostics.errors,
          warnings: diagnostics.warnings,
          setupSteps,
        });
      } else {
        setConfigError(null);
      }
    };

    checkConfiguration();
  }, []);

  // Don't render anything if no error or not in development
  if (!configError || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Alert variant="destructive" className="bg-red-900/50 border-red-500 m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-red-200 space-y-2">
        <div className="font-semibold">Supabase Configuration Error</div>
        {configError.errors.length > 0 && (
          <div>
            <div className="font-medium mb-1 text-sm">Issues:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {configError.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {configError.warnings.length > 0 && (
          <div>
            <div className="font-medium mb-1 text-sm">Warnings:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {configError.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <div className="font-medium mb-1 text-sm">Quick Fix:</div>
          <ul className="list-disc list-inside space-y-1 text-xs font-mono">
            {configError.setupSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="text-xs mt-2 pt-2 border-t border-red-700">
          See <Link href="/help" className="underline">ENV_SETUP.md</Link> for detailed instructions.
        </div>
      </AlertDescription>
    </Alert>
  );
}

