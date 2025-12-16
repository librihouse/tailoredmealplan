/**
 * Authentication Hook
 * Provides auth state and methods for sign up, sign in, sign out
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

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

    if (error) throw error;
    
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
        console.warn("Email confirmation required. Please disable it in Supabase dashboard for testing.");
      }
    }
    
    return data;
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
    setLocation("/");
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

