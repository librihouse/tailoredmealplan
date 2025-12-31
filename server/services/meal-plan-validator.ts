/**
 * Meal Plan Validator
 * Validates meal plans against quality requirements
 */

import { type MealPlanSchema } from "./meal-plan-schema";
import { type UserProfile } from "./openai";

export interface ValidationViolation {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  fieldPath: string;
  suggestedFix?: string;
}

export interface ValidationResult {
  pass: boolean;
  violations: ValidationViolation[];
}

/**
 * Get goal-adaptive calorie distribution rules
 */
function getGoalDistributionRules(goal: string): {
  breakfastMin: number;
  breakfastMax: number;
  lunchMin: number;
  lunchMax: number;
  dinnerMin: number;
  dinnerMax: number;
  snacksMin: number;
  snacksMax: number;
  maxSnackPercent: number;
} {
  const goalLower = (goal || "health").toLowerCase();
  
  if (goalLower === "lose_weight" || goalLower === "maintain" || goalLower === "health") {
    return {
      breakfastMin: 0.25,
      breakfastMax: 0.30,
      lunchMin: 0.30,
      lunchMax: 0.35,
      dinnerMin: 0.30,
      dinnerMax: 0.35,
      snacksMin: 0.10,
      snacksMax: 0.15,
      maxSnackPercent: 0.20,
    };
  } else if (goalLower === "weight_gain") {
    return {
      breakfastMin: 0.25,
      breakfastMax: 0.30,
      lunchMin: 0.30,
      lunchMax: 0.35,
      dinnerMin: 0.30,
      dinnerMax: 0.35,
      snacksMin: 0.15,
      snacksMax: 0.25,
      maxSnackPercent: 0.30,
    };
  } else if (goalLower === "build_muscle") {
    return {
      breakfastMin: 0.25,
      breakfastMax: 0.30,
      lunchMin: 0.30,
      lunchMax: 0.35,
      dinnerMin: 0.30,
      dinnerMax: 0.35,
      snacksMin: 0.15,
      snacksMax: 0.20,
      maxSnackPercent: 0.25,
    };
  } else {
    // Default to maintenance/health
    return {
      breakfastMin: 0.25,
      breakfastMax: 0.30,
      lunchMin: 0.30,
      lunchMax: 0.35,
      dinnerMin: 0.30,
      dinnerMax: 0.35,
      snacksMin: 0.10,
      snacksMax: 0.15,
      maxSnackPercent: 0.20,
    };
  }
}

/**
 * Extract ingredient name from ingredient string (e.g., "150g bell peppers" -> "bell peppers")
 * Handles malformed ingredients like "g canned chickpeas" or "/cumin"
 */
function extractIngredientName(ingredient: string): string {
  if (!ingredient || typeof ingredient !== 'string') {
    return '';
  }
  
  // Remove quantities and units - handle various formats
  let cleaned = ingredient
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .replace(/^\d+\/\d+\s*/, '') // Remove fractions like "1/2"
    .replace(/^\d+\.\d+\s*/, '') // Remove decimals like "1.5"
    .replace(/\d+\s*(g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|piece|pieces|bunch|head|serving|servings)\s*/gi, '') // Remove quantity + unit
    .replace(/\s*\([^)]*\)/g, '') // Remove parentheses content
    .trim();
  
  // Handle malformed ingredients that start with just a unit or slash
  // Also handle standalone unit words (e.g., "teaspoon cumin seeds" after removing "2")
  cleaned = cleaned
    .replace(/^\/\s*/, '') // Remove leading slash like "/cumin"
    .replace(/^g\s+/i, '') // Remove leading "g " like "g canned chickpeas"
    .replace(/^kg\s+/i, '') // Remove leading "kg "
    .replace(/^ml\s+/i, '') // Remove leading "ml "
    .replace(/^tbsp\s+/i, '') // Remove leading "tbsp "
    .replace(/^tsp\s+/i, '') // Remove leading "tsp "
    .replace(/^cup\s+/i, '') // Remove leading "cup "
    .replace(/^(teaspoon|teaspoons|tablespoon|tablespoons|cups?|tbsp|tsp)\s+/i, '') // Remove standalone unit words
    .trim();
  
  // Skip if result is empty or just punctuation/units
  if (!cleaned || cleaned.length < 2 || /^[\s\/\-]+$/.test(cleaned)) {
    return '';
  }
  
  // Remove common prefixes that might be left over (but keep the core ingredient)
  cleaned = cleaned
    .replace(/,\s*(drained|rinsed|chopped|diced|sliced|minced|grated|crushed|halved|seeded).*$/i, '') // Remove trailing preparation words after comma
    .replace(/\s+(drained|rinsed|chopped|diced|sliced|minced|grated|crushed|halved|seeded)(\s|$)/gi, ' ') // Remove preparation words
    .replace(/^(canned|fresh|dried|frozen)\s+/i, '') // Remove state descriptors at start
    .replace(/^(medium|large|small|extra)\s+/i, '') // Remove size descriptors at start
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Final cleanup - remove any remaining trailing descriptors
  cleaned = cleaned.replace(/,\s*.*$/, '').trim();
  
  return cleaned.toLowerCase();
}

/**
 * Check if unit is forbidden for vegetables/solid foods
 */
function isForbiddenUnit(ingredient: string): boolean {
  const lowerIngredient = ingredient.toLowerCase();
  // Check if it's a vegetable/fruit/solid food with tbsp/tsp
  const hasForbiddenUnit = /\d+\s*(tbsp|tsp)\s+(chopped|diced|sliced|minced)?\s*(bell pepper|pepper|cucumber|tomato|onion|carrot|vegetable|fruit|spinach|lettuce|celery|broccoli|cauliflower|zucchini|eggplant|mushroom|potato|sweet potato|beet|radish|turnip|parsnip|apple|banana|orange|berry|grape|mango|pineapple)/i.test(lowerIngredient);
  return hasForbiddenUnit;
}

/**
 * Validate meal plan
 */
export function validatePlan(
  plan: MealPlanSchema,
  userProfile: UserProfile,
  targetCalories: number,
  planType?: "daily" | "weekly" | "monthly"
): ValidationResult {
  const violations: ValidationViolation[] = [];
  
  if (!plan || !plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
    violations.push({
      severity: 'critical',
      code: 'MISSING_DAYS',
      message: 'Meal plan must have at least one day',
      fieldPath: 'days',
    });
    return { pass: false, violations };
  }

  const goal = userProfile.goal || "health";
  const distributionRules = getGoalDistributionRules(goal);
  
  // Collect all ingredients from all meals for grocery list validation
  const allIngredients = new Map<string, number>(); // ingredient name -> count
  
  // Validate each day
  plan.days.forEach((day, dayIndex) => {
    if (!day.meals) {
      violations.push({
        severity: 'critical',
        code: 'MISSING_MEALS',
        message: `Day ${day.day || dayIndex + 1} is missing meals`,
        fieldPath: `days[${dayIndex}].meals`,
      });
      return;
    }

    const { breakfast, lunch, dinner, snacks } = day.meals;
    
    // Validate required meals
    if (!breakfast) {
      violations.push({
        severity: 'critical',
        code: 'MISSING_BREAKFAST',
        message: `Day ${day.day || dayIndex + 1} is missing breakfast`,
        fieldPath: `days[${dayIndex}].meals.breakfast`,
      });
    }
    
    if (!lunch) {
      violations.push({
        severity: 'critical',
        code: 'MISSING_LUNCH',
        message: `Day ${day.day || dayIndex + 1} is missing lunch`,
        fieldPath: `days[${dayIndex}].meals.lunch`,
      });
    }
    
    if (!dinner) {
      violations.push({
        severity: 'critical',
        code: 'MISSING_DINNER',
        message: `Day ${day.day || dayIndex + 1} is missing dinner`,
        fieldPath: `days[${dayIndex}].meals.dinner`,
      });
    }

    // Calculate daily totals
    const breakfastCal = breakfast?.nutrition?.calories || 0;
    const lunchCal = lunch?.nutrition?.calories || 0;
    const dinnerCal = dinner?.nutrition?.calories || 0;
    const snacksCal = Array.isArray(snacks) 
      ? snacks.reduce((sum, snack) => sum + (snack?.nutrition?.calories || 0), 0)
      : 0;
    
    const dailyTotal = breakfastCal + lunchCal + dinnerCal + snacksCal;
    
    // 1. Calorie Validation (CRITICAL - plan-type dependent tolerance)
    const tolerance = planType === "daily" ? 25 : 50; // Daily: ±25, Weekly/Monthly: ±50
    const calorieDiff = Math.abs(dailyTotal - targetCalories);
    if (calorieDiff > tolerance) {
      violations.push({
        severity: 'critical',
        code: 'CALORIE_MISMATCH',
        message: `Day ${day.day || dayIndex + 1} total calories (${dailyTotal}) does not match target (${targetCalories}). Difference: ${calorieDiff} kcal (must be within ±${tolerance} kcal)`,
        fieldPath: `days[${dayIndex}]`,
        suggestedFix: `Adjust meal portions to reach exactly ${targetCalories} kcal total`,
      });
    }
    
    // 1.1. Macro Consistency Validation (CRITICAL)
    const breakfastProtein = breakfast?.nutrition?.protein || 0;
    const lunchProtein = lunch?.nutrition?.protein || 0;
    const dinnerProtein = dinner?.nutrition?.protein || 0;
    const snacksProtein = Array.isArray(snacks) 
      ? snacks.reduce((sum, snack) => sum + (snack?.nutrition?.protein || 0), 0)
      : 0;
    const totalProtein = breakfastProtein + lunchProtein + dinnerProtein + snacksProtein;
    
    const breakfastCarbs = breakfast?.nutrition?.carbs || 0;
    const lunchCarbs = lunch?.nutrition?.carbs || 0;
    const dinnerCarbs = dinner?.nutrition?.carbs || 0;
    const snacksCarbs = Array.isArray(snacks) 
      ? snacks.reduce((sum, snack) => sum + (snack?.nutrition?.carbs || 0), 0)
      : 0;
    const totalCarbs = breakfastCarbs + lunchCarbs + dinnerCarbs + snacksCarbs;
    
    const breakfastFat = breakfast?.nutrition?.fat || 0;
    const lunchFat = lunch?.nutrition?.fat || 0;
    const dinnerFat = dinner?.nutrition?.fat || 0;
    const snacksFat = Array.isArray(snacks) 
      ? snacks.reduce((sum, snack) => sum + (snack?.nutrition?.fat || 0), 0)
      : 0;
    const totalFat = breakfastFat + lunchFat + dinnerFat + snacksFat;
    
    const overviewMacros = plan.overview?.macros;
    if (overviewMacros) {
      const proteinDiff = Math.abs(totalProtein - overviewMacros.protein);
      const carbsDiff = Math.abs(totalCarbs - overviewMacros.carbs);
      const fatDiff = Math.abs(totalFat - overviewMacros.fat);
      
      if (proteinDiff > (overviewMacros.protein * 0.05)) {
        violations.push({
          severity: 'critical',
          code: 'MACRO_MISMATCH_PROTEIN',
          message: `Day ${day.day || dayIndex + 1} protein total (${totalProtein}g) does not match overview (${overviewMacros.protein}g). Difference: ${proteinDiff}g (must be within ±5%)`,
          fieldPath: `days[${dayIndex}]`,
          suggestedFix: `Adjust meal protein to match overview target of ${overviewMacros.protein}g`,
        });
      }
      
      if (carbsDiff > (overviewMacros.carbs * 0.05)) {
        violations.push({
          severity: 'critical',
          code: 'MACRO_MISMATCH_CARBS',
          message: `Day ${day.day || dayIndex + 1} carbs total (${totalCarbs}g) does not match overview (${overviewMacros.carbs}g). Difference: ${carbsDiff}g (must be within ±5%)`,
          fieldPath: `days[${dayIndex}]`,
          suggestedFix: `Adjust meal carbs to match overview target of ${overviewMacros.carbs}g`,
        });
      }
      
      if (fatDiff > (overviewMacros.fat * 0.05)) {
        violations.push({
          severity: 'critical',
          code: 'MACRO_MISMATCH_FAT',
          message: `Day ${day.day || dayIndex + 1} fat total (${totalFat}g) does not match overview (${overviewMacros.fat}g). Difference: ${fatDiff}g (must be within ±5%)`,
          fieldPath: `days[${dayIndex}]`,
          suggestedFix: `Adjust meal fat to match overview target of ${overviewMacros.fat}g`,
        });
      }
    }

    // 2. Calorie Distribution (CRITICAL - GOAL-ADAPTIVE)
    if (dailyTotal > 0) {
      const breakfastPercent = breakfastCal / dailyTotal;
      const lunchPercent = lunchCal / dailyTotal;
      const dinnerPercent = dinnerCal / dailyTotal;
      const snacksPercent = snacksCal / dailyTotal;

      if (breakfastPercent < distributionRules.breakfastMin || breakfastPercent > distributionRules.breakfastMax) {
        violations.push({
          severity: 'critical',
          code: 'BREAKFAST_DISTRIBUTION',
          message: `Day ${day.day || dayIndex + 1} breakfast is ${(breakfastPercent * 100).toFixed(1)}% of daily calories. Should be ${(distributionRules.breakfastMin * 100).toFixed(0)}-${(distributionRules.breakfastMax * 100).toFixed(0)}% for ${goal} goal`,
          fieldPath: `days[${dayIndex}].meals.breakfast`,
        });
      }

      if (lunchPercent < distributionRules.lunchMin || lunchPercent > distributionRules.lunchMax) {
        violations.push({
          severity: 'critical',
          code: 'LUNCH_DISTRIBUTION',
          message: `Day ${day.day || dayIndex + 1} lunch is ${(lunchPercent * 100).toFixed(1)}% of daily calories. Should be ${(distributionRules.lunchMin * 100).toFixed(0)}-${(distributionRules.lunchMax * 100).toFixed(0)}% for ${goal} goal`,
          fieldPath: `days[${dayIndex}].meals.lunch`,
        });
      }

      if (dinnerPercent < distributionRules.dinnerMin || dinnerPercent > distributionRules.dinnerMax) {
        violations.push({
          severity: 'critical',
          code: 'DINNER_DISTRIBUTION',
          message: `Day ${day.day || dayIndex + 1} dinner is ${(dinnerPercent * 100).toFixed(1)}% of daily calories. Should be ${(distributionRules.dinnerMin * 100).toFixed(0)}-${(distributionRules.dinnerMax * 100).toFixed(0)}% for ${goal} goal`,
          fieldPath: `days[${dayIndex}].meals.dinner`,
        });
      }

      if (snacksPercent < distributionRules.snacksMin || snacksPercent > distributionRules.snacksMax) {
        violations.push({
          severity: 'critical',
          code: 'SNACKS_DISTRIBUTION',
          message: `Day ${day.day || dayIndex + 1} snacks are ${(snacksPercent * 100).toFixed(1)}% of daily calories. Should be ${(distributionRules.snacksMin * 100).toFixed(0)}-${(distributionRules.snacksMax * 100).toFixed(0)}% for ${goal} goal`,
          fieldPath: `days[${dayIndex}].meals.snacks`,
        });
      }

      // Check individual snack limits
      if (Array.isArray(snacks)) {
        snacks.forEach((snack, snackIndex) => {
          if (snack?.nutrition?.calories) {
            const snackPercent = snack.nutrition.calories / dailyTotal;
            if (snackPercent > distributionRules.maxSnackPercent) {
              violations.push({
                severity: 'critical',
                code: 'SNACK_TOO_LARGE',
                message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is ${(snackPercent * 100).toFixed(1)}% of daily calories. Maximum allowed: ${(distributionRules.maxSnackPercent * 100).toFixed(0)}% for ${goal} goal`,
                fieldPath: `days[${dayIndex}].meals.snacks[${snackIndex}]`,
                suggestedFix: `Reduce snack portion size or split into multiple smaller snacks`,
              });
            }
          }
        });
      }
    }

    // Validate each meal
    const validateMeal = (meal: any, mealType: string, mealPath: string) => {
      if (!meal) return;

      // Required fields
      if (!meal.name || meal.name.trim().length === 0) {
        violations.push({
          severity: 'critical',
          code: 'MISSING_MEAL_NAME',
          message: `Day ${day.day || dayIndex + 1} ${mealType} is missing name`,
          fieldPath: `${mealPath}.name`,
        });
      }

      if (!Array.isArray(meal.ingredients) || meal.ingredients.length < 3) {
        violations.push({
          severity: 'critical',
          code: 'INSUFFICIENT_INGREDIENTS',
          message: `Day ${day.day || dayIndex + 1} ${mealType} must have at least 3 ingredients`,
          fieldPath: `${mealPath}.ingredients`,
        });
      }

      if (!meal.instructions || meal.instructions.trim().length < 50) {
        violations.push({
          severity: 'critical',
          code: 'INSUFFICIENT_INSTRUCTIONS',
          message: `Day ${day.day || dayIndex + 1} ${mealType} instructions must be at least 50 characters`,
          fieldPath: `${mealPath}.instructions`,
        });
      }

      if (!meal.nutrition || typeof meal.nutrition !== 'object') {
        violations.push({
          severity: 'critical',
          code: 'MISSING_NUTRITION',
          message: `Day ${day.day || dayIndex + 1} ${mealType} is missing nutrition information`,
          fieldPath: `${mealPath}.nutrition`,
        });
      } else {
        if (typeof meal.nutrition.calories !== 'number') {
          violations.push({
            severity: 'critical',
            code: 'MISSING_CALORIES',
            message: `Day ${day.day || dayIndex + 1} ${mealType} is missing calories`,
            fieldPath: `${mealPath}.nutrition.calories`,
          });
        }
        if (typeof meal.nutrition.protein !== 'number') {
          violations.push({
            severity: 'critical',
            code: 'MISSING_PROTEIN',
            message: `Day ${day.day || dayIndex + 1} ${mealType} is missing protein`,
            fieldPath: `${mealPath}.nutrition.protein`,
          });
        }
        if (typeof meal.nutrition.carbs !== 'number') {
          violations.push({
            severity: 'critical',
            code: 'MISSING_CARBS',
            message: `Day ${day.day || dayIndex + 1} ${mealType} is missing carbs`,
            fieldPath: `${mealPath}.nutrition.carbs`,
          });
        }
        if (typeof meal.nutrition.fat !== 'number') {
          violations.push({
            severity: 'critical',
            code: 'MISSING_FAT',
            message: `Day ${day.day || dayIndex + 1} ${mealType} is missing fat`,
            fieldPath: `${mealPath}.nutrition.fat`,
          });
        }
      }

      // Unit validation
      if (Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ingredient: string, ingIndex: number) => {
          if (isForbiddenUnit(ingredient)) {
            violations.push({
              severity: 'warning',
              code: 'FORBIDDEN_UNIT',
              message: `Day ${day.day || dayIndex + 1} ${mealType} ingredient "${ingredient}" uses tbsp/tsp for vegetables/solid foods. Use grams/cups/pieces instead`,
              fieldPath: `${mealPath}.ingredients[${ingIndex}]`,
              suggestedFix: `Change to grams/cups/pieces (e.g., "150g bell peppers" instead of "8 tbsp chopped bell peppers")`,
            });
          }
        });
      }

      // Collect ingredients for grocery list validation
      if (Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ingredient: string) => {
          // Skip invalid/malformed ingredients
          if (!ingredient || typeof ingredient !== 'string' || ingredient.trim().length === 0) {
            return;
          }
          
          // Skip ingredients that are just units or punctuation
          if (/^[\s\/\-\.]+$/.test(ingredient) || /^(g|kg|ml|l|tbsp|tsp|cup|cups)\s*$/i.test(ingredient.trim())) {
            return;
          }
          
          const ingName = extractIngredientName(ingredient);
          // Only add if we got a valid ingredient name (at least 2 characters)
          if (ingName && ingName.length >= 2) {
            allIngredients.set(ingName, (allIngredients.get(ingName) || 0) + 1);
          }
        });
      }
    };

    validateMeal(breakfast, 'breakfast', `days[${dayIndex}].meals.breakfast`);
    validateMeal(lunch, 'lunch', `days[${dayIndex}].meals.lunch`);
    validateMeal(dinner, 'dinner', `days[${dayIndex}].meals.dinner`);

    // 3. Snack Completeness (CRITICAL)
    if (Array.isArray(snacks)) {
      snacks.forEach((snack, snackIndex) => {
        const snackPath = `days[${dayIndex}].meals.snacks[${snackIndex}]`;
        
        if (!snack.name || snack.name.trim().length === 0) {
          violations.push({
            severity: 'critical',
            code: 'MISSING_SNACK_NAME',
            message: `Day ${day.day || dayIndex + 1} snack ${snackIndex + 1} is missing name`,
            fieldPath: `${snackPath}.name`,
          });
        }

        if (!Array.isArray(snack.ingredients) || snack.ingredients.length === 0) {
          violations.push({
            severity: 'critical',
            code: 'MISSING_SNACK_INGREDIENTS',
            message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing ingredients`,
            fieldPath: `${snackPath}.ingredients`,
            suggestedFix: 'Add full ingredient list with quantities (e.g., ["1 medium apple (150g)", "1 tbsp almond butter (16g)"])',
          });
        }

        if (!snack.instructions || snack.instructions.trim().length === 0) {
          violations.push({
            severity: 'critical',
            code: 'MISSING_SNACK_INSTRUCTIONS',
            message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing instructions`,
            fieldPath: `${snackPath}.instructions`,
            suggestedFix: 'Add preparation/assembly instructions (even if assembly-only)',
          });
        }

        if (!snack.nutrition || typeof snack.nutrition !== 'object') {
          violations.push({
            severity: 'critical',
            code: 'MISSING_SNACK_NUTRITION',
            message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing nutrition information`,
            fieldPath: `${snackPath}.nutrition`,
          });
        } else {
          if (typeof snack.nutrition.calories !== 'number') {
            violations.push({
              severity: 'critical',
              code: 'MISSING_SNACK_CALORIES',
              message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing calories`,
              fieldPath: `${snackPath}.nutrition.calories`,
            });
          }
          if (typeof snack.nutrition.protein !== 'number') {
            violations.push({
              severity: 'critical',
              code: 'MISSING_SNACK_PROTEIN',
              message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing protein`,
              fieldPath: `${snackPath}.nutrition.protein`,
            });
          }
          if (typeof snack.nutrition.carbs !== 'number') {
            violations.push({
              severity: 'critical',
              code: 'MISSING_SNACK_CARBS',
              message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing carbs`,
              fieldPath: `${snackPath}.nutrition.carbs`,
            });
          }
          if (typeof snack.nutrition.fat !== 'number') {
            violations.push({
              severity: 'critical',
              code: 'MISSING_SNACK_FAT',
              message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing fat`,
              fieldPath: `${snackPath}.nutrition.fat`,
            });
          }
        }
        
        // Check for portion size (NEW)
        if (!snack.portionSize || snack.portionSize.trim().length === 0) {
          violations.push({
            severity: 'critical',
            code: 'MISSING_SNACK_PORTION',
            message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing portion size`,
            fieldPath: `${snackPath}.portionSize`,
            suggestedFix: 'Add portion size (e.g., "1 medium apple (150g) + 2 tbsp almond butter (32g)")',
          });
        }
        
        // Check for allergens (WARNING - not critical but important)
        if (!Array.isArray(snack.allergens)) {
          violations.push({
            severity: 'warning',
            code: 'MISSING_SNACK_ALLERGENS',
            message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" is missing allergen information`,
            fieldPath: `${snackPath}.allergens`,
            suggestedFix: 'Add allergens array (e.g., ["tree nuts", "dairy"])',
          });
        }

        // Unit validation for snacks
        if (Array.isArray(snack.ingredients)) {
          snack.ingredients.forEach((ingredient: string, ingIndex: number) => {
            if (isForbiddenUnit(ingredient)) {
              violations.push({
                severity: 'warning',
                code: 'FORBIDDEN_UNIT_SNACK',
                message: `Day ${day.day || dayIndex + 1} snack "${snack.name || 'unnamed'}" ingredient "${ingredient}" uses tbsp/tsp for vegetables/solid foods`,
                fieldPath: `${snackPath}.ingredients[${ingIndex}]`,
                suggestedFix: `Change to grams/cups/pieces`,
              });
            }
          });
        }

        // Collect snack ingredients
        if (Array.isArray(snack.ingredients)) {
          snack.ingredients.forEach((ingredient: string) => {
            // Skip invalid/malformed ingredients
            if (!ingredient || typeof ingredient !== 'string' || ingredient.trim().length === 0) {
              return;
            }
            
            // Skip ingredients that are just units or punctuation
            if (/^[\s\/\-\.]+$/.test(ingredient) || /^(g|kg|ml|l|tbsp|tsp|cup|cups)\s*$/i.test(ingredient.trim())) {
              return;
            }
            
            const ingName = extractIngredientName(ingredient);
            // Only add if we got a valid ingredient name (at least 2 characters)
            if (ingName && ingName.length >= 2) {
              allIngredients.set(ingName, (allIngredients.get(ingName) || 0) + 1);
            }
          });
        }
      });
    }
  });

  // 4. Grocery List Completeness (CRITICAL)
  if (!plan.groceryList || typeof plan.groceryList !== 'object') {
    violations.push({
      severity: 'critical',
      code: 'MISSING_GROCERY_LIST',
      message: 'Meal plan is missing grocery list',
      fieldPath: 'groceryList',
    });
  } else {
    // Collect all grocery list items (case-insensitive category matching)
    const groceryItems = new Set<string>();
    Object.values(plan.groceryList).forEach((category) => {
      if (Array.isArray(category)) {
        category.forEach((item) => {
          const itemName = extractIngredientName(item);
          if (itemName) {
            groceryItems.add(itemName);
          }
        });
      }
    });

    // Check for missing ingredients (with flexible matching)
    allIngredients.forEach((count, ingName) => {
      // Skip empty or invalid ingredient names
      if (!ingName || ingName.length < 2) {
        return;
      }
      
      // Skip common kitchen staples that don't need to be in grocery list
      // Note: We only skip generic terms, not specific ingredients (e.g., "parsley" is not skipped even though it's an herb)
      const kitchenStaples = ['salt', 'pepper', 'water', 'oil', 'butter', 'garlic', 'onion', 'sugar', 'flour', 'baking powder', 'baking soda', 'vanilla extract', 'vinegar', 'soy sauce', 'hot sauce', 'mustard', 'ketchup', 'mayonnaise', 'honey', 'maple syrup', 'lemon juice', 'lime juice', 'broth', 'stock'];
      // Only skip if it's exactly one of these staples (not if it contains them as part of a larger name)
      if (kitchenStaples.some(staple => ingName === staple || (ingName.length < 15 && ingName === staple))) {
        return; // Skip basic staples (unless it's a specific type like "olive oil")
      }
      // Don't skip specific herbs/spices - they need to be in the grocery list
      // Only skip if it's literally just "herbs" or "spices" without a specific name
      if ((ingName === 'herbs' || ingName === 'spices') && ingName.length < 10) {
        return; // Skip generic "herbs" or "spices" but not "parsley", "cumin seeds", etc.
      }
      
      // Extract core ingredient name (remove descriptors including "cooked" and "dry")
      // Also remove preparation words like "chopped", "diced", etc. for better matching
      const coreIngredient = ingName
        .replace(/\b(cooked|dry|canned|fresh|dried|frozen|chopped|diced|sliced|minced|grated|crushed|drained|rinsed|halved|seeded|finely|roughly|coarsely)\b/gi, '')
        .replace(/\b(medium|large|small|extra|whole|pieces?)\b/gi, '')
        .trim();
      
      // Check if ingredient exists in grocery list (flexible matching)
      // Handle cooked vs dry equivalents (e.g., "cooked chickpeas" should match "chickpeas" or "dry chickpeas")
      let found = false;
      groceryItems.forEach((groceryItem) => {
        // Extract core grocery item name (also remove "dry" and "cooked" descriptors and preparation words)
        const coreGrocery = groceryItem
          .replace(/\b(dry|cooked|canned|fresh|dried|frozen|chopped|diced|sliced|minced|grated|crushed|drained|rinsed|halved|seeded|finely|roughly|coarsely)\b/gi, '')
          .replace(/\b(medium|large|small|extra|whole|pieces?)\b/gi, '')
          .trim();
        
        // Check for exact match, contains match, or core ingredient match
        // Also handle cooked/dry variants (e.g., "cooked chickpeas" matches "chickpeas" or "dry chickpeas")
        // Also handle preparation word variants (e.g., "chopped parsley" matches "parsley" or "fresh parsley")
        if (groceryItem === ingName || 
            ingName === groceryItem ||
            groceryItem.includes(ingName) || 
            ingName.includes(groceryItem) ||
            (coreGrocery.length > 2 && coreIngredient.length > 2 && (
              coreGrocery === coreIngredient ||
              coreGrocery.includes(coreIngredient) ||
              coreIngredient.includes(coreGrocery) ||
              // Handle partial matches (e.g., "parsley" matches "chopped parsley")
              coreGrocery.split(/\s+/).some(word => coreIngredient.includes(word) && word.length > 3) ||
              coreIngredient.split(/\s+/).some(word => coreGrocery.includes(word) && word.length > 3)
            )) ||
            // Special case: cooked ingredients should match dry equivalents (and vice versa)
            (ingName.includes('cooked') && !groceryItem.includes('cooked') && coreGrocery === coreIngredient && coreIngredient.length > 2) ||
            (groceryItem.includes('cooked') && !ingName.includes('cooked') && coreGrocery === coreIngredient && coreIngredient.length > 2)
        ) {
          found = true;
        }
      });
      
      if (!found) {
        violations.push({
          severity: 'critical',
          code: 'MISSING_GROCERY_ITEM',
          message: `Ingredient "${ingName}" is used in meals but missing from grocery list`,
          fieldPath: 'groceryList',
          suggestedFix: `Add "${ingName}" to appropriate grocery list category`,
        });
      }
    });
  }

  // 5. Grocery List Classification (CRITICAL - CUSTOMER TRUST)
  if (plan.groceryList && typeof plan.groceryList === 'object') {
    const misclassifications: { [key: string]: { wrong: string; correct: string } } = {
      'almond butter': { wrong: 'Dairy', correct: 'Pantry' },
      'peanut butter': { wrong: 'Dairy', correct: 'Pantry' },
      'nut butter': { wrong: 'Dairy', correct: 'Pantry' },
      'mixed berries': { wrong: 'Pantry', correct: 'Produce' },
      'canned chickpeas': { wrong: 'Produce', correct: 'Pantry' },
      'tofu': { wrong: 'Dairy', correct: 'Protein' },
      'nuts': { wrong: 'Dairy', correct: 'Pantry' },
      'paneer': { wrong: 'Pantry', correct: 'Dairy' },
      'yogurt': { wrong: 'Pantry', correct: 'Dairy' },
      'cheese': { wrong: 'Pantry', correct: 'Dairy' },
    };

    Object.entries(plan.groceryList).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const itemLower = item.toLowerCase();
          Object.entries(misclassifications).forEach(([keyword, { wrong, correct }]) => {
            // Case-insensitive category matching
            const categoryLower = category.toLowerCase();
            const wrongLower = wrong.toLowerCase();
            const correctLower = correct.toLowerCase();
            if (itemLower.includes(keyword) && categoryLower === wrongLower) {
              violations.push({
                severity: 'critical',
                code: 'GROCERY_MISCLASSIFICATION',
                message: `"${item}" is incorrectly classified in "${category}". Should be in "${correct}"`,
                fieldPath: `groceryList.${category}`,
                suggestedFix: `Move "${item}" to ${correct} category`,
              });
            }
          });
        });
      }
    });
  }

  // 5.1. Check for cooked quantities without dry equivalents (CRITICAL)
  if (plan.groceryList && typeof plan.groceryList === 'object') {
    const cookedPatterns = [
      { pattern: /cooked quinoa/i, item: 'quinoa' },
      { pattern: /cooked lentils/i, item: 'lentils' },
      { pattern: /cooked rice/i, item: 'rice' },
      { pattern: /cooked beans/i, item: 'beans' },
    ];
    
    Object.entries(plan.groceryList).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          cookedPatterns.forEach(({ pattern, item: itemName }) => {
            if (pattern.test(item) && !item.toLowerCase().includes('dry')) {
              violations.push({
                severity: 'critical',
                code: 'COOKED_WITHOUT_DRY',
                message: `"${item}" lists cooked quantity without dry equivalent. Grocery lists should show dry quantities for shopping.`,
                fieldPath: `groceryList.${category}`,
                suggestedFix: `Convert to dry equivalent (e.g., "1 cup cooked ${itemName}" → "~1/2 cup dry ${itemName}")`,
              });
            }
          });
        });
      }
    });
  }

  // 5.2. Check for duplicates in grocery list (WARNING)
  if (plan.groceryList && typeof plan.groceryList === 'object') {
    const allItems: string[] = [];
    
    Object.values(plan.groceryList).forEach((category) => {
      if (Array.isArray(category)) {
        category.forEach((item) => {
          const itemName = extractIngredientName(item);
          if (itemName && allItems.includes(itemName)) {
            violations.push({
              severity: 'warning',
              code: 'GROCERY_DUPLICATE',
              message: `"${item}" appears multiple times in grocery list. Consolidate quantities.`,
              fieldPath: 'groceryList',
              suggestedFix: 'Sum quantities and list once (e.g., if "black pepper" appears 3 times, list as "3 tsp black pepper")',
            });
          }
          if (itemName) {
            allItems.push(itemName);
          }
        });
      }
    });
  }

  // 8. Cultural Authenticity (WARNING)
  const culturalBg = (userProfile.culturalBackground || "").toLowerCase();
  const cuisinePref = (userProfile.cuisinePreference || "").toLowerCase();
  const hasCulturalPref = culturalBg || cuisinePref;
  
  if (hasCulturalPref) {
    // Check for generic Western ingredients that might not be culturally appropriate
    const westernIngredients = ['tortilla', 'quinoa', 'avocado toast', 'burrito'];
    let foundWestern = false;
    
    plan.days.forEach((day) => {
      if (day.meals) {
        const allMealNames = [
          day.meals.breakfast?.name,
          day.meals.lunch?.name,
          day.meals.dinner?.name,
          ...(Array.isArray(day.meals.snacks) ? day.meals.snacks.map(s => s?.name) : []),
        ].filter(Boolean).join(' ').toLowerCase();
        
        westernIngredients.forEach((ing) => {
          if (allMealNames.includes(ing) && (culturalBg.includes('indian') || cuisinePref.includes('indian'))) {
            foundWestern = true;
          }
        });
      }
    });
    
    if (foundWestern && (culturalBg.includes('indian') || cuisinePref.includes('indian'))) {
      violations.push({
        severity: 'warning',
        code: 'CULTURAL_AUTHENTICITY',
        message: 'Meal plan contains Western ingredients (tortilla, quinoa) that may not be culturally appropriate for Indian users. Consider roti/chapati and rice/millets instead.',
        fieldPath: 'days',
        suggestedFix: 'Replace Western ingredients with culturally appropriate alternatives (roti instead of tortilla, rice/millets instead of quinoa)',
      });
    }
  }

  const hasCriticalViolations = violations.some(v => v.severity === 'critical');
  
  return {
    pass: !hasCriticalViolations,
    violations,
  };
}

