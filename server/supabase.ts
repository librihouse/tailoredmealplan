/**
 * Supabase Server Client
 * Creates a Supabase client for server-side operations
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') as string;
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '') as string;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Some features may not work.");
}

// Client for user operations (uses anon key)
// Ensure we always pass strings to createClient to avoid .trim() errors
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(String(supabaseUrl), String(supabaseAnonKey))
  : null;

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(String(supabaseUrl), String(supabaseServiceKey), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Get user from Supabase session token
 * Uses admin client for proper server-side token verification
 */
export async function getUserFromToken(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase not configured");
    return null;
  }

  try {
    // Use admin client if available (most reliable)
    if (supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error) {
        console.error("Error verifying token with admin client:", error.message);
        return null;
      }
      
      if (!user) {
        console.error("No user found for token");
        return null;
      }
      
      return user;
    }
    
    // Fallback: Use anon client with token
    if (supabase) {
      // Set the session manually
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error("Error verifying token with anon client:", error.message);
        return null;
      }
      
      if (!user) {
        console.error("No user found for token");
        return null;
      }
      
      return user;
    }
    
    return null;
  } catch (error: any) {
    console.error("Exception verifying token:", error?.message || error);
    return null;
  }
}

/**
 * Get user ID from request headers (Authorization bearer token)
 */
export function getUserIdFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  // In a real implementation, you'd verify the token here
  // For now, we'll extract it and verify in the route handler
  return token;
}

