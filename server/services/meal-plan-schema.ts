/**
 * Meal Plan Schema
 * Strict TypeScript interfaces for meal plan validation
 */

export interface MealPlanSchema {
  overview: {
    dailyCalories: number;
    macros: {
      protein: number; // grams
      carbs: number; // grams
      fat: number; // grams
    };
    duration: number;
    type: string;
    personalization?: {
      targetCaloriesReason: string;
      targetProteinReason: string;
      restrictionsApplied: string[];
    };
  };
  days: Array<{
    day: number;
    meals: {
      breakfast: Meal;
      lunch: Meal;
      dinner: Meal;
      snacks?: Meal[];
    };
  }>;
  groceryList: {
    Produce?: string[];
    Protein?: string[];
    Dairy?: string[];
    Pantry?: string[];
    Spices?: string[];
    [key: string]: string[] | undefined;
  };
  validationNotes?: string[]; // Simple customer-friendly notes about any quality issues
}

export interface Meal {
  name: string;
  ingredients: string[]; // Format: "quantity unit ingredient"
  instructions: string;
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    sodium?: number; // mg
  };
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  allergens?: string[]; // Allergens present (e.g., ["tree nuts", "dairy"])
  portionSize?: string; // Portion size description (e.g., "1 medium apple (150g) + 2 tbsp almond butter (32g)")
  swaps?: {
    budget?: {
      name: string;
      reason: string;
    };
    allergySafe?: {
      name: string;
      reason: string;
    };
  };
}

