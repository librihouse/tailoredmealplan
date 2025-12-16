/**
 * Shared TypeScript types for meal plans and user data
 */

export interface Meal {
  name: string;
  ingredients: string[];
  instructions: string;
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
}

export interface MealPlanOverview {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  duration: number;
  type: string;
}

export interface MealPlanDay {
  day: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks?: Meal[];
  };
}

export interface GroceryList {
  produce?: string[];
  protein?: string[];
  dairy?: string[];
  pantry?: string[];
  [key: string]: string[] | undefined;
}

export interface MealPlanData {
  id?: string;
  overview: MealPlanOverview;
  days: MealPlanDay[];
  groceryList: GroceryList;
  generatedAt?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface MealPlan {
  id: string;
  user_id: string;
  plan_type: "daily" | "weekly" | "monthly";
  plan_data: MealPlanData;
  created_at: string;
}

export interface QuotaInfo {
  weeklyPlans: {
    used: number;
    limit: number;
  };
  monthlyPlans: {
    used: number;
    limit: number;
  };
  clients: {
    used: number;
    limit: number;
  };
  resetDate: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

