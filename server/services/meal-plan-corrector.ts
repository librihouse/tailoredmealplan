/**
 * Meal Plan Auto-Correction Service
 * Automatically fixes common issues in generated meal plans
 */

import { type MealPlanResponse } from "./openai";
import { log } from "@/lib/api-helpers";

export interface CorrectionLog {
  field: string;
  originalValue: any;
  correctedValue: any;
  reason: string;
}

/**
 * Correct calorie mismatch by adjusting portion sizes proportionally
 */
export function correctCalorieMismatch(
  mealPlan: MealPlanResponse,
  targetCalories: number
): { correctedPlan: MealPlanResponse; corrections: CorrectionLog[] } {
  const corrections: CorrectionLog[] = [];
  const correctedPlan = JSON.parse(JSON.stringify(mealPlan)) as MealPlanResponse; // Deep clone

  if (!correctedPlan.overview || !correctedPlan.days || correctedPlan.days.length === 0) {
    return { correctedPlan, corrections };
  }

  correctedPlan.days.forEach((day, dayIndex) => {
    if (!day.meals) return;

    const requiredMeals = ['breakfast', 'lunch', 'dinner'] as const;
    let dayCalories = requiredMeals.reduce((sum, mealType) => {
      const meal = day.meals[mealType];
      if (meal?.nutrition?.calories) {
        return sum + meal.nutrition.calories;
      }
      return sum;
    }, 0);

    // Add snacks if they exist
    if (day.meals.snacks && Array.isArray(day.meals.snacks)) {
      dayCalories += day.meals.snacks.reduce((sum: number, snack: any) => {
        return sum + (snack?.nutrition?.calories || 0);
      }, 0);
    }

    const difference = targetCalories - dayCalories;
    const tolerance = 50;

    // Only correct if difference is significant (>50 kcal)
    if (Math.abs(difference) > tolerance) {
      const adjustmentFactor = targetCalories / dayCalories;

      // Adjust each meal proportionally
      requiredMeals.forEach(mealType => {
        const meal = day.meals[mealType];
        if (meal?.nutrition) {
          const originalCalories = meal.nutrition.calories || 0;
          const adjustedCalories = Math.round(originalCalories * adjustmentFactor);
          
          // Adjust all nutrition values proportionally
          const originalProtein = meal.nutrition.protein || 0;
          const originalCarbs = meal.nutrition.carbs || 0;
          const originalFat = meal.nutrition.fat || 0;

          meal.nutrition.calories = adjustedCalories;
          meal.nutrition.protein = Math.round(originalProtein * adjustmentFactor);
          meal.nutrition.carbs = Math.round(originalCarbs * adjustmentFactor);
          meal.nutrition.fat = Math.round(originalFat * adjustmentFactor);

          corrections.push({
            field: `days[${dayIndex}].meals.${mealType}.nutrition`,
            originalValue: { calories: originalCalories, protein: originalProtein, carbs: originalCarbs, fat: originalFat },
            correctedValue: { calories: adjustedCalories, protein: meal.nutrition.protein, carbs: meal.nutrition.carbs, fat: meal.nutrition.fat },
            reason: `Adjusted to meet target calories (factor: ${adjustmentFactor.toFixed(2)})`
          });
        }
      });

      // Adjust snacks if they exist
      if (day.meals.snacks && Array.isArray(day.meals.snacks)) {
        day.meals.snacks.forEach((snack: any, snackIndex: number) => {
          if (snack?.nutrition) {
            const originalCalories = snack.nutrition.calories || 0;
            const adjustedCalories = Math.round(originalCalories * adjustmentFactor);
            
            const originalProtein = snack.nutrition.protein || 0;
            const originalCarbs = snack.nutrition.carbs || 0;
            const originalFat = snack.nutrition.fat || 0;

            snack.nutrition.calories = adjustedCalories;
            snack.nutrition.protein = Math.round(originalProtein * adjustmentFactor);
            snack.nutrition.carbs = Math.round(originalCarbs * adjustmentFactor);
            snack.nutrition.fat = Math.round(originalFat * adjustmentFactor);

            corrections.push({
              field: `days[${dayIndex}].meals.snacks[${snackIndex}].nutrition`,
              originalValue: { calories: originalCalories, protein: originalProtein, carbs: originalCarbs, fat: originalFat },
              correctedValue: { calories: adjustedCalories, protein: snack.nutrition.protein, carbs: snack.nutrition.carbs, fat: snack.nutrition.fat },
              reason: `Adjusted snack to meet target calories (factor: ${adjustmentFactor.toFixed(2)})`
            });
          }
        });
      }

      log(`Auto-corrected calories for day ${dayIndex + 1}: ${dayCalories} → ${targetCalories} kcal`, "corrector");
    }
  });

  return { correctedPlan, corrections };
}

/**
 * Fill missing nutrition data by estimating from ingredients
 */
export function fillMissingNutrition(
  mealPlan: MealPlanResponse
): { correctedPlan: MealPlanResponse; corrections: CorrectionLog[] } {
  const corrections: CorrectionLog[] = [];
  const correctedPlan = JSON.parse(JSON.stringify(mealPlan)) as MealPlanResponse;

  if (!correctedPlan.days) return { correctedPlan, corrections };

  correctedPlan.days.forEach((day, dayIndex) => {
    if (!day.meals) return;

    const requiredMeals = ['breakfast', 'lunch', 'dinner'] as const;
    requiredMeals.forEach(mealType => {
      const meal = day.meals[mealType];
      if (!meal) return;

      // If nutrition is missing or incomplete, estimate from ingredients
      if (!meal.nutrition || !meal.nutrition.calories) {
        const estimated = estimateNutritionFromIngredients(meal.ingredients || []);
        
        const originalCalories = meal.nutrition?.calories || null;
        meal.nutrition = {
          calories: estimated.calories,
          protein: meal.nutrition?.protein || estimated.protein,
          carbs: meal.nutrition?.carbs || estimated.carbs,
          fat: meal.nutrition?.fat || estimated.fat,
        };

        corrections.push({
          field: `days[${dayIndex}].meals.${mealType}.nutrition`,
          originalValue: originalCalories,
          correctedValue: estimated,
          reason: "Estimated nutrition from ingredients"
        });
      }
    });

    // Handle snacks
    if (day.meals.snacks && Array.isArray(day.meals.snacks)) {
      day.meals.snacks.forEach((snack: any, snackIndex: number) => {
        if (!snack.nutrition || !snack.nutrition.calories) {
          const estimated = estimateNutritionFromIngredients(snack.ingredients || []);
          
          const originalCalories = snack.nutrition?.calories || null;
          snack.nutrition = {
            calories: estimated.calories,
            protein: snack.nutrition?.protein || estimated.protein,
            carbs: snack.nutrition?.carbs || estimated.carbs,
            fat: snack.nutrition?.fat || estimated.fat,
          };

          corrections.push({
            field: `days[${dayIndex}].meals.snacks[${snackIndex}].nutrition`,
            originalValue: originalCalories,
            correctedValue: estimated,
            reason: "Estimated nutrition from ingredients"
          });
        }
      });
    }
  });

  return { correctedPlan, corrections };
}

/**
 * Estimate nutrition from ingredients (simple heuristic)
 */
function estimateNutritionFromIngredients(ingredients: string[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Simple estimation: assume average 100 calories per ingredient
  // This is a rough estimate - in production, you'd use a nutrition database
  const baseCalories = ingredients.length * 100;
  const baseProtein = Math.round(baseCalories * 0.15 / 4); // 15% protein, 4 cal/g
  const baseCarbs = Math.round(baseCalories * 0.50 / 4); // 50% carbs, 4 cal/g
  const baseFat = Math.round(baseCalories * 0.35 / 9); // 35% fat, 9 cal/g

  return {
    calories: baseCalories,
    protein: baseProtein,
    carbs: baseCarbs,
    fat: baseFat,
  };
}

/**
 * Ensure all meals have complete data
 */
export function ensureCompleteMeals(
  mealPlan: MealPlanResponse
): { correctedPlan: MealPlanResponse; corrections: CorrectionLog[] } {
  const corrections: CorrectionLog[] = [];
  const correctedPlan = JSON.parse(JSON.stringify(mealPlan)) as MealPlanResponse;

  if (!correctedPlan.days) return { correctedPlan, corrections };

  correctedPlan.days.forEach((day, dayIndex) => {
    if (!day.meals) return;

    const requiredMeals = ['breakfast', 'lunch', 'dinner'] as const;
    requiredMeals.forEach(mealType => {
      const meal = day.meals[mealType];
      if (!meal) return;

      // Generate name from ingredients if missing
      if (!meal.name || meal.name.trim().length === 0) {
        const generatedName = generateMealName(meal.ingredients || []);
        corrections.push({
          field: `days[${dayIndex}].meals.${mealType}.name`,
          originalValue: meal.name,
          correctedValue: generatedName,
          reason: "Generated name from ingredients"
        });
        meal.name = generatedName;
      }

      // Add basic instructions if missing or too short
      if (!meal.instructions || meal.instructions.trim().length < 50) {
        const basicInstructions = generateBasicInstructions(meal.name, meal.ingredients || []);
        corrections.push({
          field: `days[${dayIndex}].meals.${mealType}.instructions`,
          originalValue: meal.instructions,
          correctedValue: basicInstructions,
          reason: "Generated basic cooking instructions"
        });
        meal.instructions = basicInstructions;
      }

      // Ensure ingredients array exists and has items
      if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
        const extractedIngredients = extractIngredientsFromName(meal.name);
        corrections.push({
          field: `days[${dayIndex}].meals.${mealType}.ingredients`,
          originalValue: meal.ingredients,
          correctedValue: extractedIngredients,
          reason: "Extracted ingredients from meal name"
        });
        meal.ingredients = extractedIngredients;
      }
    });
  });

  return { correctedPlan, corrections };
}

/**
 * Generate meal name from ingredients
 */
function generateMealName(ingredients: string[]): string {
  if (ingredients.length === 0) return "Custom Meal";
  // Take first 2-3 ingredients and create a name
  const mainIngredients = ingredients.slice(0, 3).map(ing => {
    // Remove quantities and extract ingredient name
    return ing.replace(/^\d+\s*/, '').replace(/\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l)\s*/gi, '').trim();
  }).filter(Boolean);
  
  if (mainIngredients.length === 0) return "Custom Meal";
  return mainIngredients.join(" & ") + " Meal";
}

/**
 * Generate basic cooking instructions
 */
function generateBasicInstructions(mealName: string, ingredients: string[]): string {
  return `1. Gather all ingredients: ${ingredients.slice(0, 5).join(", ")}${ingredients.length > 5 ? " and more" : ""}
2. Prepare ingredients according to standard cooking practices
3. Cook following traditional methods for ${mealName || "this dish"}
4. Season to taste and serve hot
5. Enjoy your meal!`;
}

/**
 * Extract ingredients from meal name (fallback)
 */
function extractIngredientsFromName(mealName: string): string[] {
  // Simple extraction - split by common separators
  const parts = mealName.split(/[&,with,]/i).map(p => p.trim()).filter(Boolean);
  return parts.slice(0, 5).map(part => `1 portion ${part}`);
}

/**
 * Validate and fix structure issues
 */
export function validateAndFixStructure(
  mealPlan: MealPlanResponse
): { correctedPlan: MealPlanResponse; corrections: CorrectionLog[] } {
  const corrections: CorrectionLog[] = [];
  const correctedPlan = JSON.parse(JSON.stringify(mealPlan)) as MealPlanResponse;

  // Ensure overview exists
  if (!correctedPlan.overview) {
    correctedPlan.overview = {
      dailyCalories: 2000,
      macros: { protein: 150, carbs: 200, fat: 67 },
      duration: correctedPlan.days?.length || 1,
      type: "daily"
    };
    corrections.push({
      field: "overview",
      originalValue: null,
      correctedValue: correctedPlan.overview,
      reason: "Created default overview"
    });
  }

  // Ensure days is an array
  if (!Array.isArray(correctedPlan.days)) {
    correctedPlan.days = [];
    corrections.push({
      field: "days",
      originalValue: correctedPlan.days,
      correctedValue: [],
      reason: "Converted days to array"
    });
  }

  // Ensure groceryList exists
  if (!correctedPlan.groceryList || typeof correctedPlan.groceryList !== 'object') {
    correctedPlan.groceryList = {};
    corrections.push({
      field: "groceryList",
      originalValue: correctedPlan.groceryList,
      correctedValue: {},
      reason: "Created default grocery list"
    });
  }

  return { correctedPlan, corrections };
}

/**
 * Main correction function that applies all corrections
 */
export async function correctMealPlan(
  mealPlan: MealPlanResponse,
  validationErrors: Array<{ field: string; message: string }>,
  targetCalories: number
): Promise<MealPlanResponse | null> {
  // Only attempt correction for fixable errors
  const fixableErrors = validationErrors.filter(e => 
    e.field.includes('calories') || 
    e.field.includes('nutrition') ||
    e.field.includes('ingredients') ||
    e.field.includes('instructions') ||
    e.field.includes('name')
  );

  if (fixableErrors.length === 0) {
    return null;
  }

  let correctedPlan = JSON.parse(JSON.stringify(mealPlan)) as MealPlanResponse;
  const allCorrections: CorrectionLog[] = [];

  // Apply structure fixes first
  const structureResult = validateAndFixStructure(correctedPlan);
  correctedPlan = structureResult.correctedPlan;
  allCorrections.push(...structureResult.corrections);

  // Fill missing nutrition
  const nutritionResult = fillMissingNutrition(correctedPlan);
  correctedPlan = nutritionResult.correctedPlan;
  allCorrections.push(...nutritionResult.corrections);

  // Ensure complete meals
  const completenessResult = ensureCompleteMeals(correctedPlan);
  correctedPlan = completenessResult.correctedPlan;
  allCorrections.push(...completenessResult.corrections);

  // Correct calorie mismatches (do this last as it adjusts nutrition)
  const calorieResult = correctCalorieMismatch(correctedPlan, targetCalories);
  correctedPlan = calorieResult.correctedPlan;
  allCorrections.push(...calorieResult.corrections);

  if (allCorrections.length > 0) {
    log(`Applied ${allCorrections.length} corrections to meal plan`, "corrector");
    allCorrections.forEach(correction => {
      log(`  - ${correction.field}: ${correction.reason}`, "corrector");
    });
  }

  return correctedPlan;
}

