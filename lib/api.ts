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

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout for meal plan generation (weekly/monthly plans need more time)

  let response: Response;
  try {
    response = await fetch(`/api${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      throw new Error("Request timeout: The meal plan generation is taking longer than expected. Please try again.");
    }
    throw fetchError;
  }

    if (!response.ok) {
      // If 401, try refreshing the session once more and retry
      if (response.status === 401) {
        console.log("Received 401, attempting to refresh session again...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshData.session?.access_token && !refreshError) {
          console.log("Session refreshed, retrying request...");
          // Retry the request with the new token (with timeout)
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 300000);
          
          let retryResponse: Response;
          try {
            retryResponse = await fetch(`/api${endpoint}`, {
              ...options,
              signal: retryController.signal,
              headers: {
                ...options.headers,
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshData.session.access_token}`,
              },
            });
            clearTimeout(retryTimeoutId);
          } catch (retryFetchError: any) {
            clearTimeout(retryTimeoutId);
            if (retryFetchError.name === 'AbortError') {
              throw new Error("Request timeout: The meal plan generation is taking longer than expected. Please try again.");
            }
            throw retryFetchError;
          }
          
          if (!retryResponse.ok) {
            // Try to extract error message from response
            let errorMessage = "Authentication failed";
            try {
              const errorData = await retryResponse.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If JSON parsing fails, try to get text
              try {
                const errorText = await retryResponse.text();
                if (errorText) {
                  errorMessage = errorText.substring(0, 200); // Limit length
                }
              } catch {
                // Fallback to status-based message
                errorMessage = `HTTP ${retryResponse.status}: ${retryResponse.statusText}`;
              }
            }
            throw new Error(errorMessage);
          }
          
          return retryResponse.json();
        } else {
          // Refresh failed, user needs to sign in again
          throw new Error("Your session has expired. Please sign in again.");
        }
      }
      
      // Try to extract error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        // First try to parse as JSON
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            // Try to extract meaningful error from HTML or plain text
            const textMatch = errorText.match(/(?:error|message)[\s:=]+([^\n<]+)/i);
            errorMessage = textMatch ? textMatch[1].trim().substring(0, 200) : errorText.substring(0, 200);
          } else {
            // No error text, use status-based message
            errorMessage = `Request failed with status ${response.status}`;
          }
        } catch {
          // If all else fails, use status-based message
          errorMessage = `Request failed with status ${response.status}`;
        }
      }
      
      // Provide more context based on status code
      if (response.status === 429) {
        // Rate limit or quota exceeded
        errorMessage = errorMessage.includes("quota") || errorMessage.includes("limit") 
          ? errorMessage 
          : `Weekly plan limit reached. Please check your input and try again.`;
      } else if (response.status === 500) {
        errorMessage = `Server error: ${errorMessage}. Please try again later or contact support.`;
      } else if (response.status === 403) {
        errorMessage = `Access denied: ${errorMessage}. You may not have permission to perform this action.`;
      } else if (response.status === 404) {
        errorMessage = `Not found: ${errorMessage}. The requested resource could not be found.`;
      } else if (response.status >= 400 && response.status < 500) {
        errorMessage = `Request error: ${errorMessage}. Please check your input and try again.`;
      }
      
      throw new Error(errorMessage);
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
    credits: { used: number; limit: number };
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
  familyMemberId?: string;
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
 * Export meal plan as PDF
 */
export async function exportMealPlanPDF(planId: string): Promise<Blob> {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.access_token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/mealplan/${planId}/export-pdf`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.data.session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to export PDF" }));
    throw new Error(errorData.error || "Failed to export PDF");
  }

  return response.blob();
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
  }>("/profile", {
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

/**
 * Get all family members for the current user
 */
export async function getFamilyMembers() {
  return apiRequest<{
    members: Array<{
      id: string;
      name: string;
      age?: number;
      gender?: string;
      height?: number;
      current_weight?: number;
      target_weight?: number;
      activity_level?: string;
      religious_diet?: string;
      medical_conditions?: string[];
      created_at: string;
    }>;
  }>("/family/members");
}

/**
 * Add a new family member
 */
export async function addFamilyMember(data: {
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  religiousDiet?: string;
  medicalConditions?: string[];
}) {
  return apiRequest<{
    success: boolean;
    member: any;
  }>("/family/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(memberId: string) {
  return apiRequest<{
    success: boolean;
    message: string;
  }>(`/family/members/${memberId}`, {
    method: "DELETE",
  });
}

/**
 * Get meal plan history
 */
export async function getMealPlanHistory(filters?: {
  type?: "daily" | "weekly" | "monthly";
  familyMemberId?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.familyMemberId) params.append("familyMemberId", filters.familyMemberId);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const query = params.toString();
  return apiRequest<{
    plans: any[];
    total: number;
    isFreeTier?: boolean;
  }>(`/mealplan/history${query ? `?${query}` : ""}`);
}


