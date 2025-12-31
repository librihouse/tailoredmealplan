/**
 * Meal Plan Repair System
 * Automatically fixes validation violations by re-prompting the LLM
 */

import OpenAI from "openai";
import { type MealPlanSchema } from "./meal-plan-schema";
import { type UserProfile } from "./openai";
import { type ValidationViolation } from "./meal-plan-validator";
import { log } from "../utils/log";

/**
 * Fix meal plan with validation violations
 */
export async function fixPlanWithViolations(
  plan: MealPlanSchema,
  violations: ValidationViolation[],
  userProfile: UserProfile,
  openaiClient: OpenAI,
  targetCalories: number
): Promise<MealPlanSchema> {
  if (violations.length === 0) {
    return plan;
  }

  // Filter to only critical violations (warnings can be ignored for repair)
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  
  if (criticalViolations.length === 0) {
    log("No critical violations to repair, returning original plan", "repair");
    return plan;
  }

  log(`Attempting to repair ${criticalViolations.length} critical violations`, "repair");

  // Group violations by type for better organization
  const violationsByCode = new Map<string, ValidationViolation[]>();
  criticalViolations.forEach(v => {
    if (!violationsByCode.has(v.code)) {
      violationsByCode.set(v.code, []);
    }
    violationsByCode.get(v.code)!.push(v);
  });

  // Build repair prompt with violation-specific fixes
  const violationsText = criticalViolations
    .map((v, index) => {
      return `${index + 1}. [${v.code}] ${v.message}
   - Field: ${v.fieldPath}
   ${v.suggestedFix ? `   - Suggested Fix: ${v.suggestedFix}` : ''}`;
    })
    .join('\n\n');

  // Build specific fix instructions based on violation codes
  const specificFixes = criticalViolations.map(v => {
    if (v.code === 'MISSING_SNACK_PORTION') {
      return '- Add portion size to snacks (e.g., "1 medium apple (150g) + 2 tbsp almond butter (32g)")';
    }
    if (v.code === 'MISSING_SNACK_ALLERGENS') {
      return '- Add allergens array to snacks (e.g., ["tree nuts", "dairy"])';
    }
    if (v.code === 'MISSING_SNACK_PROTEIN' || v.code === 'MISSING_SNACK_CARBS' || v.code === 'MISSING_SNACK_FAT') {
      return '- Add complete macros to snacks (calories, protein, carbs, fat)';
    }
    if (v.code === 'GROCERY_MISCLASSIFICATION') {
      return `- Fix grocery classification: ${v.message}`;
    }
    if (v.code === 'COOKED_WITHOUT_DRY') {
      return `- Convert cooked quantities to dry equivalents: ${v.message}`;
    }
    if (v.code === 'GROCERY_DUPLICATE') {
      return '- Consolidate duplicate items in grocery list (sum quantities and list once)';
    }
    if (v.code === 'CALORIE_MISMATCH') {
      // Extract tolerance from message if available, otherwise default
      const toleranceMatch = v.message.match(/within ±(\d+)/);
      const tolerance = toleranceMatch ? toleranceMatch[1] : '50';
      return `- Adjust meal portions to reach exactly ${targetCalories} kcal total (must be within ±${tolerance} kcal)`;
    }
    if (v.code === 'MACRO_MISMATCH_PROTEIN' || v.code === 'MACRO_MISMATCH_CARBS' || v.code === 'MACRO_MISMATCH_FAT') {
      const match = v.message.match(/overview\s*\((\d+)g\)/);
      const overviewValue = match ? match[1] : 'target';
      const diffMatch = v.message.match(/Difference:\s*(\d+)g/);
      const diff = diffMatch ? diffMatch[1] : 'difference';
      return `- Adjust meal macros to match overview totals (overview: ${overviewValue}g, current difference: ${diff}g, must be within ±5%). Calculate exact adjustments needed and apply to meal portions.`;
    }
    if (v.code === 'SNACK_PERCENTAGE') {
      const match = v.message.match(/(\d+\.?\d*)%/);
      const actualPct = match ? match[1] : 'current';
      const targetMatch = v.message.match(/Should be (\d+)-(\d+)%/);
      if (targetMatch) {
        return `- Adjust snack calories to be ${targetMatch[1]}-${targetMatch[2]}% of daily calories (currently ${actualPct}%). Increase or decrease snack portions accordingly.`;
      }
      return `- Adjust snack calories to meet target percentage: ${v.message}`;
    }
    if (v.code === 'MISSING_GROCERY_ITEM') {
      const ingredientName = v.message.split('"')[1] || 'ingredient';
      return `- Add "${ingredientName}" to the appropriate grocery list category. If ingredient is "cooked [grain/legume]", convert to dry equivalent (e.g., "cooked chickpeas" → "chickpeas" or "dry chickpeas"). Ensure ingredients are in "quantity unit ingredient" format.`;
    }
    return `- ${v.message}`;
  }).filter((fix, index, self) => self.indexOf(fix) === index); // Remove duplicates

  const repairPrompt = `You are fixing a meal plan that failed validation. The meal plan JSON is provided below, along with the specific violations that need to be fixed.

CRITICAL: Fix ONLY the violations listed below. Do NOT change anything else in the meal plan. Keep all valid parts exactly as they are.

VIOLATIONS TO FIX:
${violationsText}

SPECIFIC FIXES REQUIRED:
${specificFixes.join('\n')}

ORIGINAL MEAL PLAN (JSON):
${JSON.stringify(plan, null, 2)}

USER PROFILE (for context):
- Goal: ${userProfile.goal || "health"}
- Target Calories: ${targetCalories} kcal
${userProfile.culturalBackground ? `- Cultural Background: ${userProfile.culturalBackground}` : ''}
${userProfile.cuisinePreference ? `- Cuisine Preference: ${userProfile.cuisinePreference}` : ''}

INSTRUCTIONS:
1. Fix ONLY the violations listed above
2. Do NOT modify any other parts of the meal plan
3. Return the COMPLETE fixed meal plan as valid JSON
4. Ensure all numbers are actual numbers (not strings)
5. Ensure all required fields are present
6. For MACRO_MISMATCH violations: You MUST adjust the meal portions and ingredients to match the overview totals EXACTLY. Calculate the required changes and apply them to the meals. If protein is too low, increase protein-rich ingredients. If carbs are too high, reduce carb-heavy ingredients. Ensure totals match within ±5%.
7. For SNACK_PERCENTAGE violations: Adjust snack portions to meet the target percentage. If snacks are too low (e.g., 7.5% when target is 10-15%), increase snack calories. If too high, decrease snack calories.
8. For CALORIE_MISMATCH violations: Adjust meal portions to reach the exact target calories. The last meal should absorb any rounding differences.
9. For MISSING_GROCERY_ITEM violations: Add the missing ingredient to the appropriate grocery list category. If the ingredient is "cooked [grain/legume]", convert to dry equivalent in the grocery list (e.g., "cooked chickpeas" in meals → "chickpeas" or "dry chickpeas" in grocery list).
10. Ensure grocery list includes ALL ingredients from ALL meals (convert cooked to dry equivalents where applicable).
11. Return ONLY the JSON, no markdown, no explanations

Return the fixed meal plan JSON:`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a meal plan correction assistant. Fix only the specified violations without changing other parts of the meal plan. Return valid JSON only.",
        },
        {
          role: "user",
          content: repairPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent fixes
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Extract JSON from response
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/i, '');
    jsonText = jsonText.replace(/^```\s*/i, '');
    jsonText = jsonText.replace(/\s*```$/i, '');
    jsonText = jsonText.trim();

    // Try to parse JSON
    let fixedPlan: MealPlanSchema;
    try {
      fixedPlan = JSON.parse(jsonText);
    } catch (parseError) {
      // Try to extract JSON from text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fixedPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse JSON from repair response: ${parseError}`);
      }
    }

    log(`Successfully repaired meal plan`, "repair");
    return fixedPlan;
  } catch (error: any) {
    log(`Error during meal plan repair: ${error.message}`, "repair");
    throw new Error(`Failed to repair meal plan: ${error.message}`);
  }
}

