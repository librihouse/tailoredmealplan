/**
 * OpenAI Service
 * Handles meal plan generation using GPT-4o-mini
 */

import OpenAI from "openai";
import { log } from "../index";

// Lazy initialization - only create client when needed
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Please add it to your .env.local file.");
    }
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export interface UserProfile {
  gender: string;
  age?: number;
  height?: number; // cm
  currentWeight?: number; // kg
  targetWeight?: number; // kg
  goal: string; // lose_weight, build_muscle, maintain, health
  activity: string; // sedentary, light, moderate, active, athlete
  diet: string[]; // dietary preferences
  religious: string; // none, halal, kosher, jain, hindu, buddhist
  conditions: string[]; // health conditions
  allergies: string[]; // allergies
}

export interface MealPlanRequest {
  planType: "daily" | "weekly" | "monthly";
  userProfile: UserProfile;
  options?: {
    calories?: number;
    duration?: number;
  };
}

export interface MealPlanResponse {
  overview: {
    dailyCalories: number;
    macros: {
      protein: number; // grams
      carbs: number; // grams
      fat: number; // grams
    };
    duration: number;
    type: string;
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
    produce?: string[];
    protein?: string[];
    dairy?: string[];
    pantry?: string[];
    [key: string]: string[] | undefined;
  };
}

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

/**
 * Calculate daily calories based on user profile
 */
function calculateDailyCalories(profile: UserProfile): number {
  // If provided in options, use that
  // Otherwise, use Mifflin-St Jeor Equation for BMR, then apply activity multiplier
  
  if (!profile.age || !profile.height || !profile.currentWeight) {
    // Default estimates if data missing
    return profile.goal === "lose_weight" ? 1500 : 
           profile.goal === "build_muscle" ? 2500 : 2000;
  }

  // BMR calculation (Mifflin-St Jeor)
  const isMale = profile.gender.toLowerCase() === "male";
  let bmr = (10 * profile.currentWeight) + (6.25 * profile.height) - (5 * profile.age);
  bmr += isMale ? 5 : -161;

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  const tdee = bmr * (activityMultipliers[profile.activity] || 1.55);

  // Adjust based on goal
  if (profile.goal === "lose_weight") {
    return Math.round(tdee * 0.85); // 15% deficit
  } else if (profile.goal === "build_muscle") {
    return Math.round(tdee * 1.15); // 15% surplus
  } else {
    return Math.round(tdee); // maintenance
  }
}

/**
 * Build the prompt for OpenAI
 */
function buildPrompt(request: MealPlanRequest): string {
  const { planType, userProfile, options } = request;
  const duration = options?.duration || (planType === "monthly" ? 30 : planType === "weekly" ? 7 : 1);
  const dailyCalories = options?.calories || calculateDailyCalories(userProfile);

  let prompt = `You are an expert nutritionist and meal planning AI. Generate a personalized ${planType} meal plan (${duration} days) with the following requirements:

USER PROFILE:
- Gender: ${userProfile.gender}
${userProfile.age ? `- Age: ${userProfile.age} years` : ""}
${userProfile.height ? `- Height: ${userProfile.height} cm` : ""}
${userProfile.currentWeight ? `- Current Weight: ${userProfile.currentWeight} kg` : ""}
${userProfile.targetWeight ? `- Target Weight: ${userProfile.targetWeight} kg` : ""}
- Goal: ${userProfile.goal.replace("_", " ")}
- Activity Level: ${userProfile.activity}
- Daily Calorie Target: ${dailyCalories} kcal

DIETARY REQUIREMENTS:
${userProfile.diet.length > 0 ? `- Dietary Preferences: ${userProfile.diet.join(", ")}` : "- No specific dietary preferences"}
${userProfile.religious !== "none" ? `- Religious Requirements: ${userProfile.religious} (STRICT ADHERENCE REQUIRED)` : "- No religious restrictions"}
${userProfile.conditions.length > 0 ? `- Health Conditions: ${userProfile.conditions.join(", ")} (must accommodate these conditions)` : "- No health conditions"}
${userProfile.allergies.length > 0 ? `- Allergies (MUST EXCLUDE): ${userProfile.allergies.join(", ")}` : "- No known allergies"}

REQUIREMENTS:
1. Each day must include breakfast, lunch, dinner, and optional snacks
2. Total daily calories must be approximately ${dailyCalories} kcal (±50 kcal)
3. Provide detailed recipes with ingredients and step-by-step instructions
4. Include nutritional breakdown (calories, protein, carbs, fat) for each meal
5. Ensure meals are culturally appropriate and respect religious requirements
6. All meals must be suitable for the user's health conditions
7. Absolutely NO ingredients that the user is allergic to
8. Make meals practical, delicious, and easy to prepare
9. Include a comprehensive grocery list organized by category (produce, protein, dairy, pantry, etc.)

OUTPUT FORMAT (JSON only, no markdown):
{
  "overview": {
    "dailyCalories": ${dailyCalories},
    "macros": {
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>
    },
    "duration": ${duration},
    "type": "${planType}"
  },
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "name": "<meal name>",
          "ingredients": ["<ingredient 1>", "<ingredient 2>"],
          "instructions": "<step-by-step cooking instructions>",
          "nutrition": {
            "calories": <number>,
            "protein": <grams>,
            "carbs": <grams>,
            "fat": <grams>
          }
        },
        "lunch": { ... },
        "dinner": { ... },
        "snacks": [
          {
            "name": "<snack name>",
            "ingredients": [...],
            "instructions": "...",
            "nutrition": { ... }
          }
        ]
      }
    },
    ... (repeat for all ${duration} days)
  ],
  "groceryList": {
    "produce": ["<item 1>", "<item 2>"],
    "protein": ["<item 1>", "<item 2>"],
    "dairy": ["<item 1>", "<item 2>"],
    "pantry": ["<item 1>", "<item 2>"]
  }
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Ensure all numbers are actual numbers, not strings
- Make sure the total daily calories across all meals matches the target
- Be creative with recipes while respecting all restrictions
- Consider meal prep and leftovers to reduce waste
`;

  return prompt;
}

/**
 * Generate meal plan using OpenAI GPT-4o-mini
 */
export async function generateMealPlan(
  request: MealPlanRequest
): Promise<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = buildPrompt(request);
  const duration = request.options?.duration || (request.planType === "monthly" ? 30 : request.planType === "weekly" ? 7 : 1);

  log("Generating meal plan with OpenAI", "openai");
  log(`Plan type: ${request.planType}, Duration: ${duration} days`, "openai");

  // Get OpenAI client (will throw if API key is missing)
  const openai = getOpenAIClient();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert nutritionist and meal planning AI. You generate detailed, personalized meal plans in JSON format. Always return valid JSON only, no markdown or code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: duration === 30 ? 8000 : duration === 7 ? 4000 : 2000, // More tokens for longer plans
      response_format: { type: "json_object" },
    });

    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    // Log token usage for cost monitoring
    log(`Token usage - Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`, "openai");
    
    // Calculate estimated cost (GPT-4o-mini pricing as of 2024)
    const inputCost = (usage.promptTokens / 1000000) * 0.15; // $0.15 per 1M input tokens
    const outputCost = (usage.completionTokens / 1000000) * 0.60; // $0.60 per 1M output tokens
    const totalCost = inputCost + outputCost;
    log(`Estimated cost: $${totalCost.toFixed(4)}`, "openai");

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    // Parse JSON response
    let mealPlan: MealPlanResponse;
    try {
      mealPlan = JSON.parse(responseContent);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        mealPlan = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }
    }

    // Validate response structure
    if (!mealPlan.overview || !mealPlan.days || !mealPlan.groceryList) {
      throw new Error("Invalid meal plan structure from OpenAI");
    }

    // Ensure duration matches
    if (mealPlan.days.length !== duration) {
      log(`Warning: Expected ${duration} days, got ${mealPlan.days.length}`, "openai");
    }

    return { mealPlan, usage };
  } catch (error: any) {
    log(`OpenAI API error: ${error.message}`, "openai");
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    } else if (error.status === 401) {
      throw new Error("OpenAI API key is invalid.");
    } else if (error.status === 500) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again later.");
    } else if (error.message?.includes("JSON")) {
      throw new Error("Failed to parse meal plan response. Please try again.");
    }
    
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }
}

