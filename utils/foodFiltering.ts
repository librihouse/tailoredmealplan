/**
 * Food Filtering Utility
 * Filters food options based on dietary preferences, restrictions, and allergies
 */

export interface DietaryFilters {
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  allergies: string[];
  foodIntolerances: string[];
  religiousDiet: string;
}

export interface FoodOption {
  value: string;
  label: string;
  category: "protein" | "grain" | "vegetable" | "fruit" | "dairy";
  tags: string[]; // e.g., ["vegan", "vegetarian", "gluten-free", "high-protein"]
}

// Define food options with tags
export const FOOD_OPTIONS: Record<string, FoodOption> = {
  // Proteins
  chicken: { value: "chicken", label: "Chicken", category: "protein", tags: ["high-protein", "keto", "paleo"] },
  fish: { value: "fish", label: "Fish", category: "protein", tags: ["pescatarian", "high-protein", "keto", "paleo"] },
  seafood: { value: "seafood", label: "Seafood", category: "protein", tags: ["pescatarian", "high-protein", "keto"] },
  beef: { value: "beef", label: "Beef", category: "protein", tags: ["high-protein", "keto", "paleo"] },
  pork: { value: "pork", label: "Pork", category: "protein", tags: ["high-protein", "keto", "paleo"] },
  turkey: { value: "turkey", label: "Turkey", category: "protein", tags: ["high-protein", "keto", "paleo"] },
  eggs: { value: "eggs", label: "Eggs", category: "protein", tags: ["vegetarian", "high-protein", "keto"] },
  tofu: { value: "tofu", label: "Tofu", category: "protein", tags: ["vegan", "vegetarian", "high-protein"] },
  tempeh: { value: "tempeh", label: "Tempeh", category: "protein", tags: ["vegan", "vegetarian", "high-protein"] },
  lentils: { value: "lentils", label: "Lentils", category: "protein", tags: ["vegan", "vegetarian", "high-protein"] },
  chickpeas: { value: "chickpeas", label: "Chickpeas", category: "protein", tags: ["vegan", "vegetarian", "high-protein"] },
  beans: { value: "beans", label: "Beans", category: "protein", tags: ["vegan", "vegetarian", "high-protein"] },
  
  // Grains
  rice: { value: "rice", label: "Rice", category: "grain", tags: ["vegan", "vegetarian", "gluten-free"] },
  quinoa: { value: "quinoa", label: "Quinoa", category: "grain", tags: ["vegan", "vegetarian", "gluten-free", "high-protein"] },
  oats: { value: "oats", label: "Oats", category: "grain", tags: ["vegan", "vegetarian"] },
  pasta: { value: "pasta", label: "Pasta", category: "grain", tags: ["vegan", "vegetarian"] },
  bread: { value: "bread", label: "Bread", category: "grain", tags: ["vegan", "vegetarian"] },
  barley: { value: "barley", label: "Barley", category: "grain", tags: ["vegan", "vegetarian"] },
  buckwheat: { value: "buckwheat", label: "Buckwheat", category: "grain", tags: ["vegan", "vegetarian", "gluten-free"] },
  
  // Vegetables
  leafy_greens: { value: "leafy_greens", label: "Leafy Greens", category: "vegetable", tags: ["vegan", "vegetarian", "low-carb", "keto"] },
  root_vegetables: { value: "root_vegetables", label: "Root Vegetables", category: "vegetable", tags: ["vegan", "vegetarian"] },
  cruciferous: { value: "cruciferous", label: "Cruciferous", category: "vegetable", tags: ["vegan", "vegetarian", "low-carb", "keto"] },
  nightshades: { value: "nightshades", label: "Nightshades", category: "vegetable", tags: ["vegan", "vegetarian"] },
  all_vegetables: { value: "all_vegetables", label: "All Vegetables", category: "vegetable", tags: ["vegan", "vegetarian"] },
  
  // Fruits
  berries: { value: "berries", label: "Berries", category: "fruit", tags: ["vegan", "vegetarian", "low-carb", "keto"] },
  citrus: { value: "citrus", label: "Citrus", category: "fruit", tags: ["vegan", "vegetarian"] },
  tropical: { value: "tropical", label: "Tropical", category: "fruit", tags: ["vegan", "vegetarian"] },
  stone_fruits: { value: "stone_fruits", label: "Stone Fruits", category: "fruit", tags: ["vegan", "vegetarian"] },
  all_fruits: { value: "all_fruits", label: "All Fruits", category: "fruit", tags: ["vegan", "vegetarian"] },
  
  // Dairy
  greek_yogurt: { value: "greek_yogurt", label: "Greek Yogurt", category: "dairy", tags: ["vegetarian", "high-protein"] },
  cheese: { value: "cheese", label: "Cheese", category: "dairy", tags: ["vegetarian", "keto", "high-protein"] },
  milk: { value: "milk", label: "Milk", category: "dairy", tags: ["vegetarian"] },
  cottage_cheese: { value: "cottage_cheese", label: "Cottage Cheese", category: "dairy", tags: ["vegetarian", "high-protein"] },
};

/**
 * Check if a food should be hidden based on dietary filters
 */
export function shouldHideFood(foodValue: string, filters: DietaryFilters): boolean {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'foodFiltering.ts:70',message:'shouldHideFood entry',data:{foodValue:foodValue,dietaryPreferences:filters.dietaryPreferences,isUndefined:filters.dietaryPreferences===undefined,isArray:Array.isArray(filters.dietaryPreferences),dietaryRestrictions:filters.dietaryRestrictions,isUndefinedRestrictions:filters.dietaryRestrictions===undefined,allergies:filters.allergies,isUndefinedAllergies:filters.allergies===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const food = FOOD_OPTIONS[foodValue];
  if (!food) return false;

  // Check vegan
  if (filters.dietaryPreferences && filters.dietaryPreferences.includes("vegan")) {
    if (food.category === "protein" && !["tofu", "tempeh", "lentils", "chickpeas", "beans"].includes(foodValue)) {
      return true; // Hide animal proteins
    }
    if (food.category === "dairy") {
      return true; // Hide all dairy
    }
    if (foodValue === "eggs") {
      return true; // Hide eggs
    }
  }

  // Check vegetarian
  if (filters.dietaryPreferences && filters.dietaryPreferences.includes("vegetarian")) {
    if (["chicken", "fish", "seafood", "beef", "pork", "turkey"].includes(foodValue)) {
      return true; // Hide meat and fish
    }
  }

  // Check pescatarian
  if (filters.dietaryPreferences && filters.dietaryPreferences.includes("pescatarian")) {
    if (["chicken", "beef", "pork", "turkey"].includes(foodValue)) {
      return true; // Hide meat but allow fish/seafood
    }
  }

  // Check dairy-free
  if (filters.dietaryRestrictions && filters.dietaryRestrictions.includes("dairy-free")) {
    if (food.category === "dairy") {
      return true;
    }
  }

  // Check gluten-free
  if (filters.dietaryRestrictions && filters.dietaryRestrictions.includes("gluten-free")) {
    if (["pasta", "bread", "barley", "oats"].includes(foodValue)) {
      return true; // Hide gluten-containing grains (oats can be gluten-free but default to hiding)
    }
  }

  // Check egg-free
  if (filters.dietaryRestrictions && filters.dietaryRestrictions.includes("egg-free")) {
    if (foodValue === "eggs") {
      return true;
    }
  }

  // Check allergies
  if (filters.allergies && filters.allergies.includes("eggs") && foodValue === "eggs") {
    return true;
  }
  if (filters.allergies && filters.allergies.includes("milk") && food.category === "dairy") {
    return true;
  }
  if (filters.allergies && filters.allergies.includes("fish") && ["fish", "seafood"].includes(foodValue)) {
    return true;
  }
  if (filters.allergies && filters.allergies.includes("shellfish") && foodValue === "seafood") {
    return true;
  }
  if (filters.allergies && filters.allergies.includes("soy") && ["tofu", "tempeh"].includes(foodValue)) {
    return true;
  }

  // Check keto - hide high-carb foods
  if (filters.dietaryPreferences && filters.dietaryPreferences.includes("keto")) {
    if (["rice", "pasta", "bread", "barley", "oats", "quinoa"].includes(foodValue)) {
      return true; // Hide high-carb grains
    }
    if (["tropical", "stone_fruits", "all_fruits"].includes(foodValue)) {
      return true; // Hide high-sugar fruits
    }
    if (["root_vegetables"].includes(foodValue)) {
      return true; // Hide starchy vegetables
    }
  }

  // Check paleo - hide grains and legumes
  if (filters.dietaryPreferences && filters.dietaryPreferences.includes("paleo")) {
    if (food.category === "grain") {
      return true;
    }
    if (["lentils", "chickpeas", "beans"].includes(foodValue)) {
      return true; // Hide legumes
    }
    if (food.category === "dairy") {
      return true; // Hide dairy
    }
  }

  return false;
}

/**
 * Get recommended foods based on dietary preferences
 */
export function getRecommendedFoods(filters: DietaryFilters, category: "protein" | "grain" | "vegetable" | "fruit" | "dairy"): string[] {
  const allFoods = Object.values(FOOD_OPTIONS).filter(f => f.category === category);
  const recommended = allFoods
    .filter(food => !shouldHideFood(food.value, filters))
    .map(food => food.value);
  return recommended;
}

/**
 * Filter food list based on dietary preferences
 */
export function filterFoods(foodList: string[], filters: DietaryFilters): string[] {
  return foodList.filter(food => !shouldHideFood(food, filters));
}

