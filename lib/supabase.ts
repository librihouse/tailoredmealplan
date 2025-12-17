/**
 * Supabase Client Configuration
 * Creates a singleton Supabase client for use throughout the app
 */

import { createClient } from "@supabase/supabase-js";

// Next.js environment variables - NEXT_PUBLIC_ prefix makes them available on client
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

// Only log error in browser, not during build
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error("Missing Supabase environment variables.");
  console.error("Expected: VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  console.error("Expected: VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error("Please check your .env.local file.");
}

// Ensure we always pass strings to createClient to avoid .trim() errors
// Use placeholder values during build if env vars are missing
const url = String(supabaseUrl || 'https://placeholder.supabase.co');
const key = String(supabaseAnonKey || 'placeholder-key');

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

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

