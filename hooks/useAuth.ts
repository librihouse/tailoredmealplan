/**
 * Authentication Hook
 * Provides auth state and methods for sign up, sign in, sign out
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, isUsingPlaceholderCredentials, getSupabaseConfigDiagnostics } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    // Check if Supabase is properly configured before attempting signup
    if (!isSupabaseConfigured() || isUsingPlaceholderCredentials()) {
      const diagnostics = getSupabaseConfigDiagnostics();
      
      // Log detailed diagnostics in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("⚠️ ⚠️ ⚠️ SUPABASE CONFIGURATION ERROR ⚠️ ⚠️ ⚠️");
        console.error("Missing or invalid Supabase environment variables.");
        console.error("");
        console.error("DIAGNOSTICS:", JSON.stringify(diagnostics, null, 2));
        console.error("");
        console.error("REQUIRED ENVIRONMENT VARIABLES:");
        console.error("  NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL");
        console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon/public key");
        console.error("");
        console.error("SETUP INSTRUCTIONS:");
        console.error("1. Go to https://app.supabase.com and sign in");
        console.error("2. Select your project (or create a new one)");
        console.error("3. Go to Settings → API");
        console.error("4. Copy the 'Project URL' and add it to .env.local as:");
        console.error("   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
        console.error("5. Copy the 'anon public' key and add it to .env.local as:");
        console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here");
        console.error("6. Save the .env.local file");
        console.error("7. ⚠️ IMPORTANT: Restart your dev server (stop with Ctrl+C and run npm run dev again)");
        console.error("");
        console.error("CURRENT STATUS:");
        console.error("  URL:", diagnostics.hasUrl ? `Set (${diagnostics.urlPreview})` : "NOT SET");
        console.error("  URL Valid:", diagnostics.urlIsValid ? "✓" : "✗");
        console.error("  Key:", diagnostics.hasKey ? `Set (${diagnostics.keyPreview})` : "NOT SET");
        console.error("  Key Valid:", diagnostics.keyIsValid ? "✓" : "✗");
        if (diagnostics.errors.length > 0) {
          console.error("");
          console.error("ISSUES FOUND:");
          diagnostics.errors.forEach((err, idx) => {
            console.error(`  ${idx + 1}. ${err}`);
          });
        }
        console.error("");
        console.error("See ENV_SETUP.md or SUPABASE_SETUP.md for detailed instructions.");
      }
      
      // Always throw generic user-friendly error (details logged to console in dev)
      // This ensures customers never see technical configuration details
      throw new Error("Unable to connect to authentication service. Please try again later or contact support.");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || "",
          },
          // For testing: auto-confirm email (requires Supabase email confirmation to be disabled)
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        // Enhanced error logging for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.error("Supabase signup error details:", {
            message: error.message,
            status: (error as any).status,
            statusCode: (error as any).statusCode,
            error_description: (error as any).error_description,
            fullError: error,
            errorType: error.constructor.name,
          });
        }
        
        // Extract error message with priority:
        // 1. Supabase error message (most specific)
        // 2. error_description (OAuth/API errors)
        // 3. Generic fallback
        const errorMessage = 
          error.message ||
          (error as any).error_description ||
          "Failed to create account. Please try again.";
        
        throw new Error(errorMessage);
      }
      
      // For testing: If user is created but email not confirmed, try to sign in anyway
      // This is a workaround - ideally disable email confirmation in Supabase dashboard
      if (data.user && !data.session) {
        // Try to sign in immediately (will work if email confirmation is disabled)
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInError && signInData.session) {
            return signInData;
          }
        } catch (e) {
          // If sign in fails, user needs to confirm email or disable email confirmation in Supabase
          if (process.env.NODE_ENV === 'development') {
            console.warn("Email confirmation required. Please disable it in Supabase dashboard for testing.");
          }
        }
      }
      
      return data;
    } catch (error: any) {
      // Enhanced error logging - log full error structure (only in development)
      if (process.env.NODE_ENV === 'development') {
        const diagnostics = getSupabaseConfigDiagnostics();
        console.error("Signup error caught:", {
          error,
          errorType: error?.constructor?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorProperties: Object.keys(error || {}),
          isTypeError: error instanceof TypeError,
          isError: error instanceof Error,
          hasMessage: !!error?.message,
          hasStatus: !!(error as any)?.status,
          hasStatusCode: !!(error as any)?.statusCode,
          hasErrorDescription: !!(error as any)?.error_description,
          supabaseConfig: diagnostics,
        });
      }

      // First check if this is a configuration issue (should have been caught earlier, but double-check)
      if (isUsingPlaceholderCredentials() || !isSupabaseConfigured()) {
        const diagnostics = getSupabaseConfigDiagnostics();
        
        // Log detailed info to console in development only
        if (process.env.NODE_ENV === 'development') {
          console.error("⚠️ Supabase Configuration Error (detected in error handler):");
          console.error("Missing or invalid Supabase environment variables.");
          console.error("Configuration Diagnostics:", diagnostics);
          console.error("Please create .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
        }
        
        // Always throw generic user-friendly error (never expose technical details to users)
        throw new Error("Unable to connect to authentication service. Please try again later or contact support.");
      }

      // Check if this is actually a Supabase error (has error.message from Supabase)
      // Supabase errors typically have a message property and are not TypeErrors
      if (error?.message && !(error instanceof TypeError)) {
        // This is likely a Supabase API error, use its message
        // Check if it's a network-related Supabase error
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("cors")) {
          // This might be a CORS or network issue with Supabase
          if (process.env.NODE_ENV === 'development') {
            console.error("Network/CORS error with Supabase:", error);
          }
          throw new Error("Unable to connect to authentication service. Please check your internet connection and try again.");
        }
        
        // Otherwise, it's a Supabase API error (e.g., "User already registered", "Invalid email")
        throw error;
      }

      // Handle actual network errors (TypeError with fetch-related messages)
      if (error instanceof TypeError) {
        const errorMsg = error.message?.toLowerCase() || "";
        if (errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("failed to fetch")) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Network error detected during signup:", error);
          }
          // Check if it's actually a configuration issue masquerading as network error
          if (isUsingPlaceholderCredentials()) {
            if (process.env.NODE_ENV === 'development') {
              const diagnostics = getSupabaseConfigDiagnostics();
              console.error("Configuration issue detected:", diagnostics);
            }
            // Always throw generic error (never expose technical details)
            throw new Error("Unable to connect to authentication service. Please try again later or contact support.");
          }
          throw new Error("Unable to connect to authentication service. Please check your internet connection and try again.");
        }
      }

      // If error already has a meaningful message, check what type it is
      if (error?.message) {
        // Check if it's a generic "Failed to fetch" that we should transform
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          if (isUsingPlaceholderCredentials()) {
            if (process.env.NODE_ENV === 'development') {
              const diagnostics = getSupabaseConfigDiagnostics();
              console.error("Configuration issue detected:", diagnostics);
            }
            // Always throw generic error (never expose technical details)
            throw new Error("Unable to connect to authentication service. Please try again later or contact support.");
          }
          throw new Error("Unable to connect to authentication service. Please check your internet connection and try again.");
        }
        
        // Otherwise, use the actual error message (likely from Supabase)
        throw error;
      }

      // Extract error message from various possible properties
      const extractedMessage = 
        (error as any)?.error_description ||
        (error as any)?.error?.message ||
        (error as any)?.response?.data?.message ||
        (error as any)?.statusText ||
        error?.toString();

      if (extractedMessage && extractedMessage !== "[object Object]") {
        throw new Error(extractedMessage);
      }

      // Last resort: generic message with detailed logging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error("Unexpected error format during signup. Full error:", JSON.stringify(error, null, 2));
      }
      throw new Error("Failed to create account. Please try again.");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle email not confirmed error - show user-friendly message
    if (error) {
      // If error is about email not confirmed, provide user-friendly message
      if (error.message?.toLowerCase().includes("email not confirmed") || 
          error.message?.toLowerCase().includes("email_not_confirmed") ||
          error.message?.toLowerCase().includes("email_not_verified")) {
        throw new Error(
          "Please check your email and click the confirmation link to verify your account before signing in."
        );
      }
      throw error;
    }
    
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/");
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}

