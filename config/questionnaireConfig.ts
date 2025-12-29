/**
 * Centralized configuration for questionnaire options and field definitions
 */

export interface SelectOption {
  value: string;
  label: string;
}

// Religious/Cultural Diet Options (single-select with "other" option)
// Note: "other" is handled by allowOther prop, not in options array
// "none" stays because it's a valid single-select option
export const RELIGIOUS_DIET_OPTIONS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "jain", label: "Jain Vegetarian" },
  { value: "hindu", label: "Hindu Vegetarian" },
  { value: "buddhist", label: "Buddhist Vegetarian" },
  { value: "sattvic", label: "Sattvic" },
];

// Dietary Restrictions (multi-select with "no-restrictions" as none)
// Note: "no-restrictions" is handled by allowNone prop, not in options array
export const DIETARY_RESTRICTIONS: SelectOption[] = [
  { value: "gluten-free", label: "Gluten Free" },
  { value: "dairy-free", label: "Dairy Free" },
  { value: "nut-free", label: "Nut Free" },
  { value: "soy-free", label: "Soy Free" },
  { value: "egg-free", label: "Egg Free" },
  { value: "shellfish-free", label: "Shellfish Free" },
];

// Food Intolerances (multi-select with "none" and "other" options)
// Note: "none" and "other" are handled by allowNone and allowOther props, not in options array
export const FOOD_INTOLERANCES: SelectOption[] = [
  { value: "lactose", label: "Lactose Intolerance" },
  { value: "fodmap", label: "FODMAP Sensitivity" },
  { value: "histamine", label: "Histamine Intolerance" },
  { value: "sulfites", label: "Sulfite Sensitivity" },
  { value: "msg", label: "MSG Sensitivity" },
];

// Health Goals (multi-select with "other" option)
// Note: "other" is handled by allowOther prop, not in options array
// Changed "custom" to be handled by allowOther for consistency
export const HEALTH_GOALS: SelectOption[] = [
  { value: "lose_weight", label: "Weight Loss (reduce body fat)" },
  { value: "build_muscle", label: "Muscle Gain (increase lean mass)" },
  { value: "maintain", label: "Weight Maintenance (current weight)" },
  { value: "gain_weight", label: "Weight Gain (healthy increase)" },
  { value: "health", label: "General Health Optimization" },
];

// Secondary Goals (multi-select)
export const SECONDARY_GOALS: SelectOption[] = [
  { value: "improve_energy", label: "Improve Energy" },
  { value: "better_sleep", label: "Better Sleep" },
  { value: "digestive_health", label: "Digestive Health" },
  { value: "heart_health", label: "Heart Health" },
  { value: "brain_health", label: "Brain Health" },
  { value: "immune_support", label: "Immune Support" },
  { value: "athletic_performance", label: "Athletic Performance" },
  { value: "post_surgery", label: "Post Surgery Recovery" },
  { value: "pregnancy_nutrition", label: "Pregnancy Nutrition" },
  { value: "menopause_support", label: "Menopause Support" },
];

// Allergies (multi-select with "none" option)
// Note: "none" is handled by allowNone prop, not in options array
export const ALLERGY_OPTIONS: SelectOption[] = [
  { value: "nuts", label: "Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "eggs", label: "Eggs" },
  { value: "milk", label: "Milk" },
  { value: "wheat", label: "Wheat" },
  { value: "gluten", label: "Gluten" },
  { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" },
  { value: "celery", label: "Celery" },
  { value: "mustard", label: "Mustard" },
  { value: "sulfites", label: "Sulfites" },
];

// Dietary Preferences (multi-select)
export const DIETARY_PREFERENCES: SelectOption[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "low-carb", label: "Low Carb" },
  { value: "low-fat", label: "Low Fat" },
  { value: "flexitarian", label: "Flexitarian" },
];

// Cuisine Preferences (single-select with "Other")
// Note: "Other" is handled by allowOther prop, not in options array
export const CUISINE_OPTIONS: SelectOption[] = [
  { value: "Mediterranean", label: "Mediterranean" },
  { value: "Asian", label: "Asian" },
  { value: "Indian", label: "Indian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Thai", label: "Thai" },
  { value: "Mexican", label: "Mexican" },
  { value: "American", label: "American" },
  { value: "Italian", label: "Italian" },
  { value: "French", label: "French" },
  { value: "Middle Eastern", label: "Middle Eastern" },
  { value: "African", label: "African" },
  { value: "Latin American", label: "Latin American" },
  { value: "European", label: "European" },
];

// Meals Per Day (single-select)
export const MEALS_PER_DAY: SelectOption[] = [
  { value: "3", label: "3 meals" },
  { value: "4", label: "4 meals" },
  { value: "5", label: "5 meals" },
  { value: "6", label: "6+ meals" },
];

// Include Snacks (single-select)
export const INCLUDE_SNACKS: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "sometimes", label: "Sometimes" },
];

// Intermittent Fasting (single-select with "Other")
// Note: "other" is handled by allowOther prop, not in options array
export const INTERMITTENT_FASTING: SelectOption[] = [
  { value: "no", label: "No" },
  { value: "16:8", label: "16:8 (16 hours fast, 8 hours eating window)" },
  { value: "18:6", label: "18:6 (18 hours fast, 6 hours eating window)" },
  { value: "20:4", label: "20:4 (20 hours fast, 4 hours eating window)" },
  { value: "5:2", label: "5:2 (5 days normal eating, 2 days very low calories ~500-600 cal)" },
];

// Cooking Skill Levels (single-select)
export const COOKING_SKILL_LEVELS: SelectOption[] = [
  { value: "beginner", label: "Beginner (basic skills, simple recipes)" },
  { value: "intermediate", label: "Intermediate (comfortable with most techniques)" },
  { value: "advanced", label: "Advanced (complex recipes, meal prep)" },
  { value: "expert", label: "Expert (professional-level cooking)" },
];

// Cooking Time Available (single-select)
export const COOKING_TIME_OPTIONS: SelectOption[] = [
  { value: "quick", label: "Quick Meals (<20 minutes)" },
  { value: "moderate", label: "Moderate Time (20-40 minutes)" },
  { value: "enjoy_cooking", label: "Extended Time Available (40+ minutes)" },
  { value: "meal_prep", label: "Meal Prep Preferred (batch cooking)" },
];

// Cooking Methods (multi-select)
export const COOKING_METHODS: SelectOption[] = [
  { value: "stovetop", label: "Stovetop" },
  { value: "oven", label: "Oven" },
  { value: "grill", label: "Grill" },
  { value: "slow_cooker", label: "Slow Cooker" },
  { value: "instant_pot", label: "Instant Pot" },
  { value: "no_cook", label: "No Cook" },
  { value: "all_methods", label: "All Methods" },
];

// Meal Source (single-select)
export const MEAL_SOURCE: SelectOption[] = [
  { value: "cook", label: "Cook at home" },
  { value: "order", label: "Order food" },
  { value: "both", label: "Both" },
  { value: "meal_prep_services", label: "Meal prep services" },
];

// Meal Prep Preference (single-select)
export const MEAL_PREP_PREFERENCE: SelectOption[] = [
  { value: "daily", label: "Daily Cooking (fresh daily)" },
  { value: "weekly", label: "Weekly Prep (prepare weekly)" },
  { value: "batch", label: "Batch Cooking (large batches)" },
  { value: "mix", label: "Mixed Approach (combination)" },
];

// Kitchen Equipment (multi-select)
export const KITCHEN_EQUIPMENT: SelectOption[] = [
  { value: "basic", label: "Basic" },
  { value: "blender", label: "Blender" },
  { value: "slow_cooker", label: "Slow Cooker" },
  { value: "instant_pot", label: "Instant Pot" },
  { value: "food_processor", label: "Food Processor" },
  { value: "air_fryer", label: "Air Fryer" },
  { value: "all_equipment", label: "All Equipment" },
];

// Work Schedules (single-select)
export const WORK_SCHEDULES: SelectOption[] = [
  { value: "9to5", label: "9-5 office" },
  { value: "remote", label: "Remote/WFH" },
  { value: "shift", label: "Shift work" },
  { value: "irregular", label: "Irregular" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
];

// Budget Levels (single-select)
export const BUDGET_LEVELS: SelectOption[] = [
  { value: "budget", label: "Budget-Friendly (cost-conscious)" },
  { value: "moderate", label: "Moderate Budget (balanced quality/cost)" },
  { value: "premium", label: "Premium Ingredients (quality prioritized)" },
  { value: "no_limit", label: "No Budget Constraints" },
];

// Health Conditions (multi-select with "none" and "other")
// Note: "none" and "other" are handled by allowNone and allowOther props, not in options array
export const HEALTH_CONDITIONS: SelectOption[] = [
  { value: "diabetes_type1", label: "Type 1 Diabetes" },
  { value: "diabetes_type2", label: "Type 2 Diabetes" },
  { value: "heart_disease", label: "Heart Disease" },
  { value: "high_blood_pressure", label: "High Blood Pressure" },
  { value: "high_cholesterol", label: "High Cholesterol" },
  { value: "kidney_disease", label: "Kidney Disease" },
  { value: "gerd", label: "GERD" },
  { value: "ibs", label: "IBS" },
  { value: "pcos", label: "PCOS" },
  { value: "thyroid", label: "Thyroid Issues" },
  { value: "autoimmune", label: "Autoimmune Disease" },
];

// Medications (multi-select with "none" and "other")
// Note: "none" and "other" are handled by allowNone and allowOther props, not in options array
export const MEDICATIONS: SelectOption[] = [
  { value: "blood_thinners", label: "Blood Thinners" },
  { value: "diuretics", label: "Diuretics" },
  { value: "thyroid_meds", label: "Thyroid Medications" },
  { value: "diabetes_meds", label: "Diabetes Medications" },
  { value: "not_sure", label: "Not Sure" },
];

// Cultural Backgrounds (single-select with "Other")
// Note: "other" is handled by allowOther prop, not in options array
export const CULTURAL_BACKGROUNDS: SelectOption[] = [
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "mexican", label: "Mexican" },
  { value: "italian", label: "Italian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "african", label: "African" },
  { value: "latin_american", label: "Latin American" },
  { value: "european", label: "European" },
  { value: "american", label: "American" },
  { value: "mixed", label: "Mixed" },
];

// Spice Tolerance (single-select)
export const SPICE_TOLERANCE: SelectOption[] = [
  { value: "no_spice", label: "No Spice (mild flavors only)" },
  { value: "mild", label: "Mild (light seasoning)" },
  { value: "medium", label: "Medium (moderate heat)" },
  { value: "hot", label: "Hot (spicy foods)" },
  { value: "very_hot", label: "Very Hot (intense heat)" },
  { value: "extreme", label: "Extreme (maximum tolerance)" },
];

// Variety Preferences (single-select)
export const VARIETY_PREFERENCES: SelectOption[] = [
  { value: "high", label: "High Variety (different meals daily)" },
  { value: "moderate", label: "Moderate Variety (some repetition)" },
  { value: "low", label: "Low Variety (repeat favorite meals)" },
  { value: "mix", label: "Mixed Approach" },
];

// Activity Levels (single-select) - NEW for dietitian
export const ACTIVITY_LEVELS: SelectOption[] = [
  { value: "sedentary", label: "Sedentary (little to no exercise)" },
  { value: "light", label: "Light (exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderate (exercise 3-5 days/week)" },
  { value: "active", label: "Active (exercise 6-7 days/week)" },
  { value: "very_active", label: "Very Active (intense exercise daily)" },
];

// Digestive Health Issues (multi-select) - NEW for dietitian
// Note: "none" and "other" are handled by allowNone and allowOther props, not in options array
export const DIGESTIVE_HEALTH: SelectOption[] = [
  { value: "constipation", label: "Constipation" },
  { value: "bloating", label: "Bloating" },
  { value: "gerd", label: "GERD/Acid Reflux" },
  { value: "ibs", label: "IBS" },
  { value: "diarrhea", label: "Frequent Diarrhea" },
];

// Sleep Schedule (single-select) - NEW for dietitian
export const SLEEP_SCHEDULES: SelectOption[] = [
  { value: "regular", label: "Regular (7-9 hours, consistent)" },
  { value: "irregular", label: "Irregular sleep schedule" },
  { value: "night_shift", label: "Night shift worker" },
  { value: "insomnia", label: "Insomnia or sleep issues" },
];

// Stress Levels (single-select) - NEW for dietitian
export const STRESS_LEVELS: SelectOption[] = [
  { value: "low", label: "Low Stress (minimal daily stress)" },
  { value: "moderate", label: "Moderate Stress (manageable levels)" },
  { value: "high", label: "High Stress (frequent stress episodes)" },
  { value: "very_high", label: "Very High Stress (chronic stress)" },
];

// Hydration Preferences (single-select) - NEW for dietitian
export const HYDRATION_PREFERENCES: SelectOption[] = [
  { value: "adequate", label: "Adequate (6-8 glasses/day)" },
  { value: "high", label: "High (8+ glasses/day)" },
  { value: "low", label: "Low (<6 glasses/day)" },
  { value: "varies", label: "Varies" },
];

// Beverage Preferences (multi-select) - NEW for dietitian
// Note: "none" and "other" are handled by allowNone and allowOther props, not in options array
export const BEVERAGE_PREFERENCES: SelectOption[] = [
  { value: "water", label: "Water" },
  { value: "herbal_tea", label: "Herbal Tea" },
  { value: "green_tea", label: "Green Tea" },
  { value: "coffee", label: "Coffee" },
  { value: "smoothies", label: "Smoothies" },
  { value: "juice", label: "Juice (limited)" },
  { value: "sports_drinks", label: "Sports Drinks" },
  { value: "sparkling_water", label: "Sparkling Water" },
];

// Food Preferences - Proteins (multi-select)
export const FOOD_LIKES_PROTEINS: SelectOption[] = [
  { value: "chicken", label: "Chicken" },
  { value: "fish", label: "Fish" },
  { value: "seafood", label: "Seafood" },
  { value: "beef", label: "Beef" },
  { value: "pork", label: "Pork" },
  { value: "turkey", label: "Turkey" },
  { value: "eggs", label: "Eggs" },
  { value: "tofu", label: "Tofu" },
  { value: "tempeh", label: "Tempeh" },
  { value: "lentils", label: "Lentils" },
  { value: "chickpeas", label: "Chickpeas" },
  { value: "beans", label: "Beans" },
];

// Food Preferences - Grains (multi-select)
export const FOOD_LIKES_GRAINS: SelectOption[] = [
  { value: "rice", label: "Rice" },
  { value: "quinoa", label: "Quinoa" },
  { value: "oats", label: "Oats" },
  { value: "pasta", label: "Pasta" },
  { value: "bread", label: "Bread" },
  { value: "barley", label: "Barley" },
  { value: "buckwheat", label: "Buckwheat" },
];

// Food Preferences - Vegetables (multi-select)
export const FOOD_LIKES_VEGETABLES: SelectOption[] = [
  { value: "leafy_greens", label: "Leafy Greens" },
  { value: "root_vegetables", label: "Root Vegetables" },
  { value: "cruciferous", label: "Cruciferous" },
  { value: "nightshades", label: "Nightshades" },
  { value: "all_vegetables", label: "All Vegetables" },
];

// Food Preferences - Fruits (multi-select)
export const FOOD_LIKES_FRUITS: SelectOption[] = [
  { value: "berries", label: "Berries (strawberries, blueberries, raspberries)" },
  { value: "citrus", label: "Citrus (oranges, lemons, grapefruit)" },
  { value: "tropical", label: "Tropical (mango, pineapple, papaya)" },
  { value: "stone_fruits", label: "Stone Fruits (peaches, plums, cherries, apricots)" },
  { value: "all_fruits", label: "All Fruits" },
];

// Food Preferences - Dairy (multi-select)
// Note: "none" is handled separately if needed, not in array
export const FOOD_LIKES_DAIRY: SelectOption[] = [
  { value: "greek_yogurt", label: "Greek Yogurt" },
  { value: "cheese", label: "Cheese" },
  { value: "milk", label: "Milk" },
  { value: "cottage_cheese", label: "Cottage Cheese" },
];

// Flavor Preferences (multi-select)
export const FLAVOR_PREFERENCES: SelectOption[] = [
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "spicy", label: "Spicy" },
  { value: "very_spicy", label: "Very Spicy" },
];

// Texture Preferences (multi-select)
export const TEXTURE_PREFERENCES: SelectOption[] = [
  { value: "soft", label: "Soft" },
  { value: "crunchy", label: "Crunchy" },
  { value: "creamy", label: "Creamy" },
  { value: "chewy", label: "Chewy" },
  { value: "crispy", label: "Crispy" },
  { value: "mixed", label: "Mixed" },
];

// Snack Preferences (multi-select)
export const SNACK_PREFERENCES: SelectOption[] = [
  { value: "morning", label: "Morning snack" },
  { value: "afternoon", label: "Afternoon snack" },
  { value: "evening", label: "Evening snack" },
  { value: "all", label: "All of the above" },
];

// All Foods Combined (for "Foods You Dislike" section)
export const ALL_FOODS: SelectOption[] = [
  ...FOOD_LIKES_PROTEINS,
  ...FOOD_LIKES_GRAINS,
  ...FOOD_LIKES_VEGETABLES,
  ...FOOD_LIKES_FRUITS,
  ...FOOD_LIKES_DAIRY,
];

// Typical Day Schedule (single-select)
export const TYPICAL_DAY_SCHEDULE: SelectOption[] = [
  { value: "early", label: "Early riser (5-7 AM)" },
  { value: "standard", label: "Standard (7-9 AM)" },
  { value: "late", label: "Late riser (9 AM+)" },
];

// Lunch Location (single-select)
export const LUNCH_LOCATION: SelectOption[] = [
  { value: "home", label: "Home" },
  { value: "office", label: "Office" },
  { value: "on_the_go", label: "On the go" },
  { value: "restaurant", label: "Restaurant" },
  { value: "varies", label: "Varies" },
];

// Dinner Location (single-select)
export const DINNER_LOCATION: SelectOption[] = [
  { value: "home", label: "Home" },
  { value: "restaurant", label: "Restaurant" },
  { value: "social_events", label: "Social events" },
  { value: "varies", label: "Varies" },
];

// Weekend Eating Habits (single-select)
export const WEEKEND_EATING_HABITS: SelectOption[] = [
  { value: "same", label: "Same as weekdays" },
  { value: "relaxed", label: "More relaxed" },
  { value: "social", label: "More social dining" },
  { value: "meal_prep", label: "Meal prep days" },
];

// Shopping Frequency (single-select)
export const SHOPPING_FREQUENCY: SelectOption[] = [
  { value: "daily", label: "Daily" },
  { value: "2-3_times", label: "2-3 times/week" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

// Shopping Preferences (multi-select)
export const SHOPPING_PREFERENCES: SelectOption[] = [
  { value: "fresh", label: "Fresh ingredients" },
  { value: "frozen_ok", label: "Frozen options OK" },
  { value: "canned_ok", label: "Canned/preserved OK" },
  { value: "mix", label: "Mix of all" },
];

// Specialty Stores Access (single-select)
export const SPECIALTY_STORES_ACCESS: SelectOption[] = [
  { value: "yes", label: "Yes (ethnic markets, health stores)" },
  { value: "no", label: "No (standard grocery only)" },
  { value: "limited", label: "Limited" },
];

// Weight Change Timeline (single-select)
export const WEIGHT_CHANGE_TIMELINE: SelectOption[] = [
  { value: "gradual", label: "Gradual (6+ months, 0.5-1 lb/week)" },
  { value: "moderate", label: "Moderate (3-6 months, 1-2 lb/week)" },
  { value: "aggressive", label: "Aggressive (1-3 months, 2+ lb/week)" },
  { value: "maintenance", label: "Maintenance (current weight)" },
];

// Macro Preferences (single-select)
export const MACRO_PREFERENCES: SelectOption[] = [
  { value: "high_protein", label: "High Protein (>30% calories)" },
  { value: "high_carb", label: "High Carbohydrate (>50% calories)" },
  { value: "high_fat", label: "High Fat (>35% calories)" },
  { value: "balanced", label: "Balanced Macros (standard distribution)" },
  { value: "custom", label: "Custom Macro Distribution" },
];

// Fiber Target (single-select)
export const FIBER_TARGET: SelectOption[] = [
  { value: "standard", label: "Standard (25-30g/day)" },
  { value: "high_fiber", label: "High Fiber (35-40g/day)" },
  { value: "low_fiber", label: "Low Fiber (medical restriction)" },
];

// Sodium Sensitivity (single-select)
export const SODIUM_SENSITIVITY: SelectOption[] = [
  { value: "no_restrictions", label: "No Sodium Restrictions" },
  { value: "moderate", label: "Moderate Restriction (<2300mg/day)" },
  { value: "low", label: "Low Sodium (<1500mg/day)" },
  { value: "very_low", label: "Very Low Sodium (medical requirement)" },
];

// Pregnancy Status (single-select)
export const PREGNANCY_STATUS: SelectOption[] = [
  { value: "not_applicable", label: "Not applicable" },
  { value: "pregnant_1", label: "Pregnant (1st trimester)" },
  { value: "pregnant_2", label: "Pregnant (2nd trimester)" },
  { value: "pregnant_3", label: "Pregnant (3rd trimester)" },
  { value: "breastfeeding", label: "Breastfeeding" },
  { value: "planning", label: "Planning pregnancy" },
];

// Restaurant Types (multi-select)
export const RESTAURANT_TYPES: SelectOption[] = [
  { value: "fast_food", label: "Fast food" },
  { value: "casual_dining", label: "Casual dining" },
  { value: "fine_dining", label: "Fine dining" },
  { value: "ethnic_restaurants", label: "Ethnic restaurants" },
  { value: "cafes", label: "Cafes" },
  { value: "food_trucks", label: "Food trucks" },
];

// Delivery Services (multi-select)
// Delivery Services (multi-select with "other" option)
// Note: "other" is handled by allowOther prop, not in options array
export const DELIVERY_SERVICES: SelectOption[] = [
  { value: "uber_eats", label: "Uber Eats" },
  { value: "doordash", label: "DoorDash" },
  { value: "grubhub", label: "Grubhub" },
  { value: "postmates", label: "Postmates" },
];

// Ordering Budget (single-select)
export const ORDERING_BUDGET: SelectOption[] = [
  { value: "budget", label: "$5-10" },
  { value: "moderate", label: "$10-20" },
  { value: "premium", label: "$20-30" },
  { value: "no_limit", label: "$30+" },
];

// Ordering Frequency (single-select)
export const ORDERING_FREQUENCY: SelectOption[] = [
  { value: "daily", label: "Daily" },
  { value: "few_times_week", label: "Few times/week" },
  { value: "weekends_only", label: "Weekends only" },
  { value: "occasionally", label: "Occasionally" },
];

// Meal Prep Services (multi-select)
// Meal Prep Services (multi-select with "other" option)
// Note: "other" is handled by allowOther prop, not in options array
export const MEAL_PREP_SERVICES: SelectOption[] = [
  { value: "freshly", label: "Freshly" },
  { value: "hellofresh", label: "HelloFresh" },
  { value: "blue_apron", label: "Blue Apron" },
  { value: "home_chef", label: "Home Chef" },
  { value: "factor", label: "Factor" },
];

// Special Occasions (single-select with "Other")
// Note: "other" is handled by allowOther prop, not in options array
export const SPECIAL_OCCASIONS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "social_event", label: "Social event" },
];

// Meal Plan Focus (multi-select)
export const MEAL_PLAN_FOCUS: SelectOption[] = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "energy_boost", label: "Energy boost" },
  { value: "digestive_health", label: "Digestive health" },
  { value: "heart_health", label: "Heart health" },
  { value: "athletic_performance", label: "Athletic performance" },
  { value: "general_wellness", label: "General wellness" },
];

