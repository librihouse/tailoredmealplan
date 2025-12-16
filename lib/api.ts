/**
 * API Client Utilities
 * Helper functions for making authenticated API requests
 */

import { supabase } from "./supabase";

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Always refresh session first to ensure we have a valid token
  let { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
  
  // If refresh fails, try getting current session
  if (sessionError || !session) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData.session;
  }
  
  // If still no session, user needs to sign in
  if (!session) {
    throw new Error("Not authenticated. Please sign in again.");
  }
  
  const token = session.access_token;

  if (!token) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If 401, try refreshing the session once more and retry
    if (response.status === 401) {
      console.log("Received 401, attempting to refresh session again...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshData.session?.access_token && !refreshError) {
        console.log("Session refreshed, retrying request...");
        // Retry the request with the new token
        const retryResponse = await fetch(`/api${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshData.session.access_token}`,
          },
        });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: "Authentication failed" }));
          throw new Error(error.error || `HTTP ${retryResponse.status}`);
        }
        
        return retryResponse.json();
      } else {
        // Refresh failed, user needs to sign in again
        throw new Error("Your session has expired. Please sign in again.");
      }
    }
    
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get quota information
 */
export async function getQuota() {
  return apiRequest<{
    weeklyPlans: { used: number; limit: number };
    monthlyPlans: { used: number; limit: number };
    clients: { used: number; limit: number };
    resetDate: string;
  }>("/mealplan/quota");
}

/**
 * Generate a meal plan
 */
export async function generateMealPlan(data: {
  planType: "daily" | "weekly" | "monthly";
  userProfile?: any;
  options?: {
    dietaryPreferences?: string[];
    allergies?: string[];
    goals?: string[];
    calories?: number;
    duration?: number;
  };
}) {
  return apiRequest<{
    success: boolean;
    mealPlan: any;
    quota: any;
    tokenUsage?: any;
  }>("/mealplan/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get all meal plans for the current user
 */
export async function getMealPlans(filters?: {
  type?: "daily" | "weekly" | "monthly";
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const query = params.toString();
  return apiRequest<{
    plans: any[];
    total: number;
  }>(`/mealplan/list${query ? `?${query}` : ""}`);
}

/**
 * Get a single meal plan by ID
 */
export async function getMealPlan(id: string) {
  return apiRequest<any>(`/mealplan/${id}`);
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/mealplan/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.user) {
    throw new Error("Not authenticated");
  }
  
  // Get user from users table
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.data.session.user.id)
    .single();

  if (error) {
    throw new Error("Failed to fetch user");
  }

  return data;
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(data: {
  planId: string;
  billingInterval: "monthly" | "annual";
}) {
  return apiRequest<{
    orderId: string;
    amount: number;
    currency: string;
    planId: string;
  }>("/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify Razorpay payment
 */
export async function verifyRazorpayPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
  billingInterval: "monthly" | "annual";
}) {
  return apiRequest<{
    success: boolean;
    message: string;
    subscription: any;
  }>("/razorpay/verify-payment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus() {
  return apiRequest<{
    hasSubscription: boolean;
    subscription: {
      id: string;
      planId: string;
      status: string;
      billingInterval: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    } | null;
  }>("/razorpay/subscription-status");
}

/**
 * Cancel subscription
 */
export async function cancelSubscription() {
  return apiRequest<{
    success: boolean;
    message: string;
  }>("/razorpay/cancel-subscription", {
    method: "POST",
  });
}

/**
 * Save individual user profile (onboarding data)
 * For simplified onboarding, we just mark it as complete
 * Detailed questionnaire will be asked when generating meal plans
 */
export async function saveUserProfile(data: {
  // Simplified onboarding - just mark as complete
  onboardingCompleted?: boolean;
  // Optional: can still accept detailed data if needed later
  gender?: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  goal?: string;
  activity?: string;
  diet?: string[];
  religious?: string;
  conditions?: string[];
  allergies?: string[];
  // Transition-related information for trans-friendly support
  transitionInfo?: {
    genderSpecify?: string;
    isTransitioning?: string;
    transitionMedications?: string;
    additionalHealthInfo?: string;
  };
}) {
  return apiRequest<{
    success: boolean;
    profile: any;
  }>("/profile/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Save business profile (professional onboarding)
 */
export async function saveBusinessProfile(data: {
  businessName: string;
  businessType?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
  brandColors?: any;
  themeColors?: {
    primary: string;
    secondary: string;
    background: "light" | "dark";
  };
  tagline?: string;
  freeDailyPlan?: boolean;
}) {
  return apiRequest<{
    success: boolean;
    profile: any;
  }>("/profile/business/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get current user's profile
 */
export async function getUserProfile() {
  return apiRequest<{
    type: "individual" | "business";
    profile: any;
    onboardingCompleted: boolean;
  }>("/profile");
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus() {
  return apiRequest<{
    completed: boolean;
    type: "individual" | "business";
  }>("/profile/onboarding-status");
}

