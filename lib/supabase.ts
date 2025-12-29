/**
 * Supabase Client Configuration
 * Creates a singleton Supabase client for use throughout the app
 */

import { createClient } from "@supabase/supabase-js";

// Next.js environment variables - NEXT_PUBLIC_ prefix makes them available on client
// Note: NEXT_PUBLIC_ variables are embedded at build/start time, so dev server must be restarted
// after creating/updating .env.local

// Helper to get and clean environment variable
const getEnvVar = (key: string): string => {
  // Try multiple sources for environment variables
  let value = '';
  
  // 1. Try process.env directly (works in both server and client for NEXT_PUBLIC_ vars)
  // In Next.js, NEXT_PUBLIC_ variables are embedded at build/start time
  if (typeof process !== 'undefined' && process.env) {
    value = process.env[key] || '';
  }
  
  // 2. Try window.__ENV__ (fallback for some setups)
  if (!value && typeof window !== 'undefined' && (window as any).__ENV__) {
    value = (window as any).__ENV__[key] || '';
  }
  
  // 3. Try window.__NEXT_DATA__ (Next.js runtime env)
  if (!value && typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env) {
    value = (window as any).__NEXT_DATA__.env[key] || '';
  }
  
  // Remove surrounding quotes and trim whitespace
  const cleaned = value.replace(/^["']|["']$/g, '').trim();
  
  // Debug in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !cleaned) {
    console.warn(`[Supabase Config] Environment variable ${key} not found. Checked:`, {
      processEnv: typeof process !== 'undefined' && process.env ? !!process.env[key] : false,
      windowEnv: typeof window !== 'undefined' && (window as any).__ENV__ ? !!(window as any).__ENV__[key] : false,
      nextData: typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env ? !!(window as any).__NEXT_DATA__.env[key] : false,
    });
  }
  
  return cleaned;
};

// Get environment variables - try direct access first for Next.js
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Debug: Log raw values (only in development, in browser)
// Removed - no public console logging

// Validate credentials - check for valid Supabase URL format
const isValidSupabaseUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  try {
    const urlObj = new URL(url);
    // Check for Supabase domains (including regional domains)
    const hostname = urlObj.hostname.toLowerCase();
    return (
      hostname.includes('supabase.co') || 
      hostname.includes('supabase.in') ||
      hostname.endsWith('.supabase.co') ||
      hostname.endsWith('.supabase.in')
    );
  } catch {
    return false;
  }
};

const hasValidCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  isValidSupabaseUrl(supabaseUrl) &&
  supabaseAnonKey.length > 20; // Anon keys are typically long strings

// Debug logging (only in development, only in browser, not during build)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only log in development mode
  const diagnostics = {
    hasUrl: !!supabaseUrl && supabaseUrl.trim() !== '',
    hasKey: !!supabaseAnonKey && supabaseAnonKey.trim() !== '',
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlIsValid: isValidSupabaseUrl(supabaseUrl || ''),
    keyIsValid: (supabaseAnonKey || '').length > 20,
    hasValidCredentials,
    rawProcessEnv: {
      hasUrl: !!(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL),
      hasKey: !!(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  };

  if (!hasValidCredentials) {
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
    console.error("1. Create a .env.local file in the project root directory");
    console.error("2. Add the following lines (no quotes, no spaces around =):");
    console.error("   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here");
    console.error("3. Get your credentials from: https://app.supabase.com → Your Project → Settings → API");
    console.error("4. ⚠️ IMPORTANT: Restart your dev server after creating/updating .env.local");
    console.error("   Run: npm run dev (or stop current server with Ctrl+C and restart)");
    console.error("");
    console.error("CURRENT VALUES:");
    console.error("  URL:", supabaseUrl || "(empty - NOT SET)");
    console.error("  URL Valid:", diagnostics.urlIsValid ? "✓" : "✗");
    console.error("  Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : "(empty - NOT SET)");
    console.error("  Key Valid:", diagnostics.keyIsValid ? "✓" : "✗");
    console.error("  In process.env:", diagnostics.rawProcessEnv.hasUrl && diagnostics.rawProcessEnv.hasKey ? "✓" : "✗");
    console.error("");
    if (!diagnostics.rawProcessEnv.hasUrl || !diagnostics.rawProcessEnv.hasKey) {
      console.error("⚠️ Environment variables not found in process.env");
      console.error("   This usually means:");
      console.error("   - .env.local file doesn't exist or is in wrong location");
      console.error("   - Dev server wasn't restarted after creating .env.local");
      console.error("   - Variables are named incorrectly (must be NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    if (diagnostics.hasUrl && !diagnostics.urlIsValid) {
      console.error("⚠️ URL is set but doesn't appear to be a valid Supabase URL.");
      console.error("   Current URL:", supabaseUrl);
      console.error("   Expected format: https://xxxxx.supabase.co or https://xxxxx.supabase.in");
    }
    if (diagnostics.hasKey && !diagnostics.keyIsValid) {
      console.error("⚠️ Key is set but appears to be too short (should be > 20 characters).");
      console.error("   Current key length:", diagnostics.keyLength);
    }
    console.error("");
    console.error("See ENV_SETUP.md or SUPABASE_SETUP.md for detailed instructions.");
  } else {
    console.log("✓ Supabase configuration loaded successfully");
    console.log("  URL:", supabaseUrl.substring(0, 30) + "...");
    console.log("  Key:", supabaseAnonKey.substring(0, 10) + "...");
  }
}

// Create client only with valid credentials
// This prevents "Failed to fetch" errors from invalid URLs
export const supabase = hasValidCredentials
  ? createClient(String(supabaseUrl), String(supabaseAnonKey), {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient(
      String(supabaseUrl || 'https://placeholder.supabase.co'),
      String(supabaseAnonKey || 'placeholder-key'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

/**
 * Check if Supabase is properly configured with valid credentials
 * @returns true if Supabase has valid credentials, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  return hasValidCredentials;
}

/**
 * Check if Supabase is using placeholder credentials
 * @returns true if using placeholder credentials, false otherwise
 */
export function isUsingPlaceholderCredentials(): boolean {
  const url = supabaseUrl || '';
  const key = supabaseAnonKey || '';
  return url.includes('placeholder') || 
         key.includes('placeholder') || 
         !hasValidCredentials ||
         url === '' ||
         key === '';
}

/**
 * Get diagnostic information about Supabase configuration
 * Useful for debugging configuration issues
 */
export function getSupabaseConfigDiagnostics() {
  const url = supabaseUrl || '';
  const key = supabaseAnonKey || '';
  
  // Check for common formatting issues
  const urlHasQuotes = (url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"));
  const keyHasQuotes = (key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"));
  const urlHasSpaces = url.includes(' ') && !url.trim().startsWith('http');
  const keyHasSpaces = key.includes(' ');
  
  // Detailed error breakdown
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!url || url.trim() === '') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else {
    if (urlHasQuotes) {
      warnings.push('NEXT_PUBLIC_SUPABASE_URL has quotes around it (remove quotes)');
    }
    if (urlHasSpaces) {
      warnings.push('NEXT_PUBLIC_SUPABASE_URL has spaces (remove spaces)');
    }
    if (!isValidSupabaseUrl(url)) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase URL (should contain supabase.co or supabase.in)');
    }
  }
  
  if (!key || key.trim() === '') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else {
    if (keyHasQuotes) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY has quotes around it (remove quotes)');
    }
    if (keyHasSpaces) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY has spaces (remove spaces)');
    }
    if (key.length <= 20) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is too short (should be > 20 characters)');
    }
  }
  
  // Check if variables are in process.env
  const inProcessEnv = typeof process !== 'undefined' && process.env;
  const urlInProcessEnv = inProcessEnv && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyInProcessEnv = inProcessEnv && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!urlInProcessEnv || !keyInProcessEnv) {
    warnings.push('Environment variables not found in process.env (dev server may need restart)');
  }
  
  return {
    hasUrl: !!url && url.trim() !== '',
    hasKey: !!key && key.trim() !== '',
    urlLength: url?.length || 0,
    keyLength: key?.length || 0,
    urlIsValid: isValidSupabaseUrl(url),
    keyIsValid: key.length > 20,
    hasValidCredentials,
    isUsingPlaceholder: isUsingPlaceholderCredentials(),
    urlPreview: url ? `${url.substring(0, 30)}...` : '(empty)',
    keyPreview: key ? `${key.substring(0, 10)}...` : '(empty)',
    errors,
    warnings,
    formattingIssues: {
      urlHasQuotes,
      keyHasQuotes,
      urlHasSpaces,
      keyHasSpaces,
    },
    inProcessEnv: {
      url: urlInProcessEnv,
      key: keyInProcessEnv,
    },
  };
}

// Database types (you can generate these with Supabase CLI)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_usage: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          billing_period_start: string;
          billing_period_end: string;
          weekly_plans_used: number;
          monthly_plans_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          billing_period_start: string;
          billing_period_end: string;
          weekly_plans_used?: number;
          monthly_plans_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          billing_period_start?: string;
          billing_period_end?: string;
          weekly_plans_used?: number;
          monthly_plans_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_type: string;
          plan_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: string;
          plan_data: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: string;
          plan_data?: any;
          created_at?: string;
        };
      };
    };
  };
};

