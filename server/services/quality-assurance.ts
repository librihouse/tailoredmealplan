/**
 * Quality Assurance Service
 * Validates meal plan structure and handles retry logic
 */

import { generateMealPlan, type MealPlanRequest, type MealPlanResponse } from "./openai";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate meal plan structure and completeness
 */
export function validateMealPlan(mealPlan: MealPlanResponse): {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canAutoCorrect: boolean;
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check overview
  if (!mealPlan.overview) {
    errors.push({ field: 'overview', message: 'Meal plan overview is missing' });
  } else {
    if (!mealPlan.overview.dailyCalories || mealPlan.overview.dailyCalories <= 0) {
      errors.push({ field: 'overview.dailyCalories', message: 'Daily calories must be a positive number' });
    }
    if (!mealPlan.overview.macros) {
      errors.push({ field: 'overview.macros', message: 'Macros are missing' });
    } else {
      const { protein, carbs, fat } = mealPlan.overview.macros;
      if (typeof protein !== 'number' || protein < 0) {
        errors.push({ field: 'overview.macros.protein', message: 'Protein must be a non-negative number' });
      }
      if (typeof carbs !== 'number' || carbs < 0) {
        errors.push({ field: 'overview.macros.carbs', message: 'Carbs must be a non-negative number' });
      }
      if (typeof fat !== 'number' || fat < 0) {
        errors.push({ field: 'overview.macros.fat', message: 'Fat must be a non-negative number' });
      }
    }
  }

  // Check days array
  if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
    errors.push({ field: 'days', message: 'Days array is missing or invalid' });
    return { valid: false, errors, warnings: [], canAutoCorrect: false };
  }

  if (mealPlan.days.length === 0) {
    errors.push({ field: 'days', message: 'Days array is empty' });
  }

  // Validate each day
  mealPlan.days.forEach((day, dayIndex) => {
    if (!day.meals || typeof day.meals !== 'object') {
      errors.push({ field: `days[${dayIndex}].meals`, message: 'Meals object is missing or invalid' });
      return;
    }

    // Check required meals
    const requiredMeals: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];
    requiredMeals.forEach(mealType => {
      type MealKey = 'breakfast' | 'lunch' | 'dinner';
      const mealKey = mealType as MealKey;
      const meal = day.meals[mealKey];
      if (!meal || typeof meal !== 'object' || Array.isArray(meal)) {
        errors.push({ 
          field: `days[${dayIndex}].meals.${mealType}`, 
          message: `${mealType} meal is missing` 
        });
        return;
      }

      // Check meal name
      if (!meal.name || typeof meal.name !== 'string' || meal.name.trim().length === 0) {
        errors.push({ 
          field: `days[${dayIndex}].meals.${mealType}.name`, 
          message: 'Meal name is missing or empty' 
        });
      }

      // Check ingredients
      if (!Array.isArray(meal.ingredients) || meal.ingredients.length < 3) {
        errors.push({ 
          field: `days[${dayIndex}].meals.${mealType}.ingredients`, 
          message: 'Ingredients must be an array with at least 3 items' 
        });
      }

      // Check instructions
      if (!meal.instructions || typeof meal.instructions !== 'string' || meal.instructions.trim().length < 50) {
        errors.push({ 
          field: `days[${dayIndex}].meals.${mealType}.instructions`, 
          message: 'Instructions must be a string with at least 50 characters' 
        });
      }

      // Check nutrition
      if (!meal.nutrition || typeof meal.nutrition !== 'object') {
        errors.push({ 
          field: `days[${dayIndex}].meals.${mealType}.nutrition`, 
          message: 'Nutrition object is missing' 
        });
      } else {
        type NutritionKey = 'calories' | 'protein' | 'carbs' | 'fat';
        const nutritionFields: NutritionKey[] = ['calories', 'protein', 'carbs', 'fat'];
        nutritionFields.forEach(field => {
          const nutritionKey = field as NutritionKey;
          if (meal.nutrition[nutritionKey] === undefined || meal.nutrition[nutritionKey] === null) {
            errors.push({ 
              field: `days[${dayIndex}].meals.${mealType}.nutrition.${nutritionKey}`, 
              message: `${nutritionKey} is missing` 
            });
          } else if (typeof meal.nutrition[nutritionKey] !== 'number') {
            errors.push({ 
              field: `days[${dayIndex}].meals.${mealType}.nutrition.${nutritionKey}`, 
              message: `${nutritionKey} must be a number` 
            });
          }
        });
      }
    });
  });

  // Check grocery list
  if (!mealPlan.groceryList || typeof mealPlan.groceryList !== 'object') {
    errors.push({ field: 'groceryList', message: 'Grocery list is missing or invalid' });
  } else {
    const groceryItems = Object.values(mealPlan.groceryList).flat();
    if (groceryItems.length === 0) {
      errors.push({ field: 'groceryList', message: 'Grocery list is empty' });
    }
  }

  // Check daily calories match target (±50 kcal)
  if (mealPlan.overview && mealPlan.days.length > 0) {
    const targetCalories = mealPlan.overview.dailyCalories;
    mealPlan.days.forEach((day, dayIndex) => {
      if (day.meals) {
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

        const difference = Math.abs(dayCalories - targetCalories);
        
        // Make it a warning if difference is 50-200 kcal (fixable)
        // Only error if difference > 200 kcal (significant issue)
        if (difference > 200) {
          errors.push({ 
            field: `days[${dayIndex}].calories`, 
            message: `Daily calories (${dayCalories}) differ from target (${targetCalories}) by ${difference} kcal - significant mismatch` 
          });
        } else if (difference > 50) {
          // Add as warning, not error - can be auto-corrected
          warnings.push({
            field: `days[${dayIndex}].calories`,
            message: `Daily calories (${dayCalories}) differ from target (${targetCalories}) by ${difference} kcal - will be auto-corrected`
          });
        }
      }
    });
  }

  // Determine if auto-correction is possible (only warnings, no critical errors)
  const canAutoCorrect = errors.length === 0 && warnings.length > 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canAutoCorrect,
  };
}

/**
 * Determine if an error is retryable
 */
export function shouldRetry(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorStatus = error.status || error.statusCode;
  const errorCode = error.code || '';

  // Retry on network errors (connection issues)
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorCode === 'ECONNRESET' ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED') {
    return true;
  }

  // Retry on rate limit errors (with exponential backoff)
  if (errorStatus === 429 || errorMessage.includes('rate limit')) {
    return true;
  }

  // Retry on server errors (5xx)
  if (errorStatus >= 500 && errorStatus < 600) {
    return true;
  }

  // Don't retry on client errors (4xx except 429)
  if (errorStatus >= 400 && errorStatus < 500 && errorStatus !== 429) {
    return false;
  }

  // Don't retry on authentication errors
  if (errorStatus === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('api key')) {
    return false;
  }

  // Retry on JSON parsing errors (might be transient)
  if (errorMessage.includes('json') && errorMessage.includes('parse')) {
    return true;
  }

  // Retry on validation errors if they're fixable (calorie mismatches)
  if (errorMessage.includes('validation failed') || errorMessage.includes('invalid meal plan')) {
    // Retry if it's a calorie issue (might be fixable with better prompt)
    if (errorMessage.includes('calories') && (errorMessage.includes('differ from target') || errorMessage.includes('calorie'))) {
      return true; // Retry calorie errors
    }
    // Don't retry critical validation errors (safety issues)
    return false;
  }

  return false;
}

/**
 * Retry meal plan generation with exponential backoff
 */
export async function retryGeneration(
  request: MealPlanRequest,
  maxRetries: number = 3,
  previousErrors?: string[]
): Promise<{ mealPlan: MealPlanResponse; usage: any }> {
  let lastError: any = null;
  const trackedErrors: string[] = previousErrors || [];
  
  // Calculate timeout budget based on plan type
  const duration = request.options?.duration || (request.planType === "monthly" ? 30 : request.planType === "weekly" ? 7 : 1);
  const timeoutMs = duration === 30 ? 600000 : duration === 7 ? 180000 : 120000; // 10min monthly (chunked), 3min weekly, 2min daily
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateMealPlan(request);
      
      // Validate the result
      const validation = validateMealPlan(result.mealPlan);
      if (!validation.valid) {
        // If validation fails on last attempt, attempt auto-correction if possible
        if (attempt === maxRetries) {
          // Try auto-correction for fixable issues
          if (validation.canAutoCorrect) {
            const { correctMealPlan } = await import('./meal-plan-corrector');
            const targetCalories = result.mealPlan.overview?.dailyCalories || 2000;
            const corrected = await correctMealPlan(result.mealPlan, [...validation.errors, ...validation.warnings], targetCalories);
            
            if (corrected) {
              // Re-validate corrected plan
              const correctedValidation = validateMealPlan(corrected);
              if (correctedValidation.valid || correctedValidation.canAutoCorrect) {
                return { mealPlan: corrected, usage: result.usage };
              }
            }
          }
          
          // If auto-correction failed or not possible, throw errors
          const allIssues = [...validation.errors, ...validation.warnings];
          throw new Error(`Meal plan validation failed: ${allIssues.map(e => e.message).join(', ')}`);
        }
        // Track errors for prompt enhancement
        const errorMessages = [...validation.errors, ...validation.warnings].map(e => e.message);
        trackedErrors.push(...errorMessages);
        
        // Enhance request with retry hints if calorie errors occurred
        if (errorMessages.some(e => e.includes('calories') || e.includes('calorie'))) {
          request = {
            ...request,
            options: {
              ...request.options,
              _retryHint: 'CALORIE_TARGET_MISMATCH', // Internal flag for prompt enhancement
            } as typeof request.options & { _retryHint?: string },
          };
        }
        
        // Otherwise, retry (check timeout budget first)
        const elapsedTime = Date.now() - startTime;
        const remainingTimeout = timeoutMs - elapsedTime;
        
        // Don't retry if less than 30 seconds remaining
        if (remainingTimeout < 30000) {
          const { log } = await import("../index");
          log(`Insufficient timeout budget for validation retry (${remainingTimeout}ms remaining)`, "quality-assurance");
          throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        
        lastError = new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        const baseDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
        const safeDelayMs = Math.min(baseDelay, remainingTimeout - 10000); // Leave 10s buffer
        await delay(safeDelayMs);
        continue;
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate remaining timeout budget before retrying
      const elapsedTime = Date.now() - startTime;
      const remainingTimeout = timeoutMs - elapsedTime;
      
      // Don't retry if less than 30 seconds remaining
      if (remainingTimeout < 30000) {
        const { log } = await import("../index");
        log(`Insufficient timeout budget for retry (${remainingTimeout}ms remaining, attempt ${attempt + 1}/${maxRetries + 1})`, "quality-assurance");
        throw error;
      }

      // Wait before retrying (exponential backoff with jitter)
      const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc.
      const jitter = Math.random() * 1000; // Add random jitter (0-1s) to prevent thundering herd
      const delayMs = baseDelay + jitter;
      
      // Ensure delay doesn't exceed remaining timeout budget
      const safeDelayMs = Math.min(delayMs, remainingTimeout - 10000); // Leave 10s buffer
      if (safeDelayMs < 1000) {
        const { log } = await import("../index");
        log(`Insufficient time for retry delay (${safeDelayMs}ms remaining)`, "quality-assurance");
        throw error;
      }
      
      await delay(safeDelayMs);
    }
  }

  throw lastError || new Error('Failed to generate meal plan after retries');
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

