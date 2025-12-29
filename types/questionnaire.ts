/**
 * TypeScript type definitions for questionnaire form data
 */

export interface QuestionnaireFormData {
  // Section 1: Basic Dietary Information
  dietaryPreferences: string[];
  religiousDiet: string;
  religiousDietOther: string;
  dietaryRestrictions: string[];
  foodIntolerances: string[];
  foodIntolerancesOther: string;
  healthGoal: string[];
  healthGoalCustom: string;
  secondaryGoals: string[];
  allergies: string[];
  calorieTarget: string;
  cuisinePreference: string;
  cuisinePreferenceOther: string;

  // Section 2: Meal Timing & Frequency
  mealsPerDay: string;
  includeSnacks: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  snackPreferences: string[];
  snackPreferencesOther: string;
  intermittentFasting: string;
  intermittentFastingOther: string;

  // Section 3: Food Preferences
  foodsLoved: string[];
  foodsDisliked: string[];
  flavorPreferences: string[];
  texturePreferences: string[];

  // Section 4: Cooking & Preparation
  mealSource: string;
  cookingSkillLevel: string;
  cookingTimeAvailable: string;
  cookingMethods: string[];
  mealPrepPreference: string;
  kitchenEquipment: string[];
  restaurantTypes: string[];
  deliveryServices: string[];
  orderingBudget: string;
  orderingFrequency: string;
  mealPrepServices: string[];

  // Section 5: Lifestyle & Schedule
  typicalDaySchedule: string;
  workSchedule: string;
  lunchLocation: string;
  dinnerLocation: string;
  weekendEatingHabits: string;

  // Section 6: Budget & Shopping
  budgetLevel: string;
  shoppingFrequency: string;
  shoppingPreferences: string[];
  specialtyStoresAccess: string;

  // Section 7: Health & Nutrition Details
  weightChangeTimeline: string;
  macroPreferences: string;
  customMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  fiberTarget: string;
  sodiumSensitivity: string;

  // Section 8: Medical & Health Conditions
  healthConditions: string[];
  healthConditionsOther: string;
  medications: string[];
  medicationsOther: string;
  pregnancyStatus: string;
  recentSurgeries: string;

  // Section 9: Cultural & Regional Preferences
  culturalBackground: string;
  culturalBackgroundOther: string;
  traditionalFoodsToInclude: string;
  foodsFromCultureToAvoid: string;
  spiceTolerance: string;

  // Section 10: Special Requests & Notes
  specialOccasions: string;
  specialDietaryNotes: string;
  mealPlanFocus: string[];
  varietyPreference: string;

  // NEW: Dietitian-Critical Fields
  activityLevel: string;
  currentWeight: string;
  height: string;
  bodyFatGoal: string;
  muscleMassGoal: string;
  hydrationPreferences: string;
  waterIntake: string;
  beveragePreferences: string[];
  digestiveHealth: string[];
  sleepSchedule: string;
  stressLevel: string;
  previousDietHistory: string;
  whatWorkedBefore: string;
  whatDidntWorkBefore: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface FieldConfig {
  name: keyof QuestionnaireFormData;
  type: "single-select" | "multi-select" | "text" | "number" | "time" | "textarea";
  label: string;
  description?: string;
  options?: SelectOption[];
  allowOther?: boolean;
  allowNone?: boolean;
  noneValue?: string;
  validation?: FieldValidation;
  gridCols?: "2" | "3" | "4" | "auto";
}

export interface SectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  order: number;
}

