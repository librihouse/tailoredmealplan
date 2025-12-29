/**
 * Input Sanitization Utilities
 * Sanitizes user inputs to prevent prompt injection and ensure data safety
 */

/**
 * Sanitize a string input by removing/escaping dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Escape potential prompt injection patterns
  // Remove or escape common injection patterns
  sanitized = sanitized.replace(/```/g, ''); // Remove code blocks
  sanitized = sanitized.replace(/---/g, '—'); // Replace markdown separators
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines

  return sanitized;
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(input: string[] | undefined | null, maxLength: number = 500): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item, maxLength))
    .filter(item => item.length > 0);
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: number | string | undefined | null, min: number = 0, max: number = 1000): number | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    return undefined;
  }

  return Math.max(min, Math.min(max, num));
}

/**
 * Check for potential prompt injection patterns
 */
export function detectPromptInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const lowerInput = input.toLowerCase();

  // Common prompt injection patterns
  const injectionPatterns = [
    /ignore (previous|above|all) (instructions?|rules?|guidelines?)/i,
    /forget (previous|above|all) (instructions?|rules?|guidelines?)/i,
    /you are now/i,
    /act as if/i,
    /pretend to be/i,
    /system:?/i,
    /assistant:?/i,
    /user:?/i,
    /\[system\]/i,
    /\[assistant\]/i,
    /\[user\]/i,
    /override/i,
    /bypass/i,
    /hack/i,
    /exploit/i,
  ];

  return injectionPatterns.some(pattern => pattern.test(lowerInput));
}

/**
 * Sanitize user profile data
 */
export function sanitizeUserProfile(profile: any): any {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const sanitized: any = { ...profile };

  // Sanitize string fields
  const stringFields = [
    'gender', 'goal', 'activity', 'religious', 'mealsPerDay', 'includeSnacks',
    'intermittentFasting', 'cookingSkillLevel', 'cookingTimeAvailable',
    'mealPrepPreference', 'typicalDaySchedule', 'workSchedule', 'lunchLocation',
    'dinnerLocation', 'weekendEatingHabits', 'budgetLevel', 'shoppingFrequency',
    'specialtyStoresAccess', 'weightChangeTimeline', 'macroPreferences',
    'fiberTarget', 'sodiumSensitivity', 'pregnancyStatus', 'culturalBackground',
    'cuisinePreference', 'spiceTolerance', 'specialOccasions', 'varietyPreference',
    'hydrationPreferences', 'waterIntake', 'sleepSchedule', 'stressLevel',
  ];

  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field], 200);
    }
  });

  // Sanitize "other" text fields (more restrictive)
  const otherFields = [
    'dietaryPreferencesOther', 'religiousDietOther', 'dietaryRestrictionsOther',
    'foodIntolerancesOther', 'healthGoalCustom', 'secondaryGoalsOther',
    'allergiesOther', 'cuisinePreferenceOther', 'mealsPerDayOther',
    'includeSnacksOther', 'snackPreferencesOther', 'intermittentFastingOther',
    'foodsLovedProteinsOther', 'foodsLovedGrainsOther', 'foodsLovedVegetablesOther',
    'foodsLovedFruitsOther', 'foodsLovedDairyOther', 'foodsDislikedOther',
    'flavorPreferencesOther', 'texturePreferencesOther', 'mealSourceOther',
    'cookingSkillLevelOther', 'cookingTimeAvailableOther', 'cookingMethodsOther',
    'mealPrepPreferenceOther', 'kitchenEquipmentOther', 'restaurantTypesOther',
    'deliveryServicesOther', 'orderingBudgetOther', 'orderingFrequencyOther',
    'mealPrepServicesOther', 'typicalDayScheduleOther', 'workScheduleOther',
    'lunchLocationOther', 'dinnerLocationOther', 'weekendEatingHabitsOther',
    'budgetLevelOther', 'shoppingFrequencyOther', 'shoppingPreferencesOther',
    'specialtyStoresAccessOther', 'weightChangeTimelineOther', 'macroPreferencesOther',
    'fiberTargetOther', 'sodiumSensitivityOther', 'healthConditionsOther',
    'medicationsOther', 'pregnancyStatusOther', 'culturalBackgroundOther',
    'spiceToleranceOther', 'specialOccasionsOther', 'mealPlanFocusOther',
    'varietyPreferenceOther', 'activityLevelOther', 'hydrationPreferencesOther',
    'beveragePreferencesOther', 'digestiveHealthOther', 'sleepScheduleOther',
    'stressLevelOther', 'specialDietaryNotes',
  ];

  otherFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      // Check for prompt injection
      if (detectPromptInjection(sanitized[field])) {
        log(`Potential prompt injection detected in field ${field}`, "sanitizer");
        sanitized[field] = sanitizeString(sanitized[field], 200);
      } else {
        sanitized[field] = sanitizeString(sanitized[field], 500);
      }
    }
  });

  // Sanitize array fields
  const arrayFields = [
    'diet', 'conditions', 'allergies', 'dietaryRestrictions', 'foodIntolerances',
    'secondaryGoals', 'snackPreferences', 'foodsLoved', 'foodsDisliked',
    'flavorPreferences', 'texturePreferences', 'cookingMethods', 'kitchenEquipment',
    'restaurantTypes', 'deliveryServices', 'mealPrepServices', 'shoppingPreferences',
    'digestiveHealth', 'beveragePreferences', 'medications',
  ];

  arrayFields.forEach(field => {
    if (Array.isArray(sanitized[field])) {
      sanitized[field] = sanitizeStringArray(sanitized[field], 200);
    }
  });

  // Sanitize numeric fields
  if (sanitized.age) {
    sanitized.age = sanitizeNumber(sanitized.age, 1, 120);
  }
  if (sanitized.height) {
    sanitized.height = sanitizeNumber(sanitized.height, 50, 250);
  }
  if (sanitized.currentWeight) {
    sanitized.currentWeight = sanitizeNumber(sanitized.currentWeight, 20, 500);
  }
  if (sanitized.targetWeight) {
    sanitized.targetWeight = sanitizeNumber(sanitized.targetWeight, 20, 500);
  }

  return sanitized;
}

// Simple log function for sanitizer (to avoid circular dependencies)
function log(message: string, category: string): void {
  console.log(`[${category}] ${message}`);
}

