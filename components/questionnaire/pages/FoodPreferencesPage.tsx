"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FOOD_LIKES_GRAINS, FOOD_LIKES_VEGETABLES, FOOD_LIKES_FRUITS, FOOD_LIKES_DAIRY, SPICE_TOLERANCE } from "@/config/questionnaireConfig";
import { SelectOption } from "@/config/questionnaireConfig";

interface FoodPreferencesPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

// Define protein options with dietary tags
const PROTEIN_OPTIONS: (SelectOption & { dietaryTags: string[] })[] = [
  { value: "chicken", label: "Chicken", dietaryTags: ["meat"] },
  { value: "beef", label: "Beef", dietaryTags: ["meat"] },
  { value: "pork", label: "Pork", dietaryTags: ["meat"] },
  { value: "turkey", label: "Turkey", dietaryTags: ["meat"] },
  { value: "fish", label: "Fish", dietaryTags: ["seafood", "pescatarian"] },
  { value: "seafood", label: "Seafood", dietaryTags: ["seafood", "pescatarian"] },
  { value: "eggs", label: "Eggs", dietaryTags: ["vegetarian"] },
  { value: "tofu", label: "Tofu", dietaryTags: ["vegan", "vegetarian", "pescatarian"] },
  { value: "tempeh", label: "Tempeh", dietaryTags: ["vegan", "vegetarian", "pescatarian"] },
  { value: "lentils", label: "Lentils", dietaryTags: ["vegan", "vegetarian", "pescatarian"] },
  { value: "chickpeas", label: "Chickpeas", dietaryTags: ["vegan", "vegetarian", "pescatarian"] },
  { value: "beans", label: "Beans", dietaryTags: ["vegan", "vegetarian", "pescatarian"] },
  { value: "paneer", label: "Paneer", dietaryTags: ["vegetarian"] },
  { value: "cottage_cheese", label: "Cottage Cheese", dietaryTags: ["vegetarian"] },
];

// Dairy options (exclude for vegans)
const DAIRY_OPTIONS_WITH_TAGS: (SelectOption & { dietaryTags: string[] })[] = [
  { value: "greek_yogurt", label: "Greek Yogurt", dietaryTags: ["vegetarian"] },
  { value: "cheese", label: "Cheese", dietaryTags: ["vegetarian"] },
  { value: "milk", label: "Milk", dietaryTags: ["vegetarian"] },
  { value: "butter", label: "Butter", dietaryTags: ["vegetarian"] },
];

export function FoodPreferencesPage({ formData, setFormData, isOptional, isSkipped }: FoodPreferencesPageProps) {
  const handleMultiSelect = (field: keyof QuestionnaireFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const isSelected = currentArray.includes(value);
    setFormData({
      ...formData,
      [field]: isSelected
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value],
    });
  };

  // Determine dietary restrictions from user selections
  const dietaryPreferences = formData.dietaryPreferences || [];
  const isVegan = dietaryPreferences.includes("vegan");
  const isVegetarian = dietaryPreferences.includes("vegetarian");
  const isPescatarian = dietaryPreferences.includes("pescatarian");
  
  // Check for dairy restrictions from allergies
  const allergies = formData.allergies || [];
  const hasDairyAllergy = allergies.includes("milk") || allergies.includes("dairy");

  // Filter proteins based on dietary preferences
  const getFilteredProteins = () => {
    if (isVegan) {
      // Vegans: Only plant-based proteins
      return PROTEIN_OPTIONS.filter(p => p.dietaryTags.includes("vegan"));
    } else if (isVegetarian) {
      // Vegetarians: Plant-based + eggs + dairy proteins
      return PROTEIN_OPTIONS.filter(p => p.dietaryTags.includes("vegetarian") || p.dietaryTags.includes("vegan"));
    } else if (isPescatarian) {
      // Pescatarians: Everything except meat
      return PROTEIN_OPTIONS.filter(p => !p.dietaryTags.includes("meat"));
    }
    // No restrictions: Show all proteins
    return PROTEIN_OPTIONS;
  };

  // Filter dairy based on dietary preferences and allergies
  const getFilteredDairy = () => {
    if (isVegan || hasDairyAllergy) {
      return []; // No dairy for vegans or those with dairy allergies
    }
    return DAIRY_OPTIONS_WITH_TAGS;
  };

  const filteredProteins = getFilteredProteins();
  const filteredDairy = getFilteredDairy();

  // Combine all allowed foods for the loved/disliked sections
  const allAllowedFoods = [
    ...filteredProteins,
    ...FOOD_LIKES_GRAINS.map(f => ({ ...f, dietaryTags: [] })),
    ...FOOD_LIKES_VEGETABLES.map(f => ({ ...f, dietaryTags: [] })),
    ...FOOD_LIKES_FRUITS.map(f => ({ ...f, dietaryTags: [] })),
    ...filteredDairy,
  ];

  // Get diet label for display
  const getDietLabel = () => {
    if (isVegan) return "vegan";
    if (isVegetarian) return "vegetarian";
    if (isPescatarian) return "pescatarian";
    return null;
  };

  const dietLabel = getDietLabel();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Food Preferences</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Tell us what you love and what you'd rather avoid. (Optional)"}
        </p>
        {dietLabel && (
          <p className="text-primary text-sm mt-2">
            ✓ Showing {dietLabel} options based on your dietary preferences
          </p>
        )}
      </div>

      <div className="space-y-8">
        {/* Protein Sources */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Protein Sources You Enjoy</Label>
          <p className="text-xs text-gray-400">
            {dietLabel 
              ? `Showing ${dietLabel}-friendly protein options only`
              : "Select proteins you enjoy eating"
            }
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProteins.map((food) => {
              const isSelected = (formData.foodsLoved || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`protein-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                  />
                  <Label
                    htmlFor={`protein-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grains */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Grains & Carbs You Enjoy</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FOOD_LIKES_GRAINS.map((food) => {
              const isSelected = (formData.foodsLoved || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`grain-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                  />
                  <Label
                    htmlFor={`grain-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vegetables */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Vegetables You Enjoy</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FOOD_LIKES_VEGETABLES.map((food) => {
              const isSelected = (formData.foodsLoved || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`veg-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                  />
                  <Label
                    htmlFor={`veg-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fruits */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Fruits You Enjoy</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FOOD_LIKES_FRUITS.map((food) => {
              const isSelected = (formData.foodsLoved || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fruit-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                  />
                  <Label
                    htmlFor={`fruit-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dairy - Only show if not vegan and no dairy allergy */}
        {filteredDairy.length > 0 && (
          <div className="space-y-4">
            <Label className="text-gray-300 uppercase font-bold block">Dairy You Enjoy</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredDairy.map((food) => {
                const isSelected = (formData.foodsLoved || []).includes(food.value);
                return (
                  <div key={food.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dairy-${food.value}`}
                      checked={isSelected}
                      onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                    />
                    <Label
                      htmlFor={`dairy-${food.value}`}
                      className="text-sm font-medium cursor-pointer text-gray-300"
                    >
                      {food.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Foods to Avoid */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Foods You Dislike</Label>
          <p className="text-xs text-gray-400">Select foods you'd prefer to avoid in your meal plan</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allAllowedFoods.map((food) => {
              const isSelected = (formData.foodsDisliked || []).includes(food.value);
              return (
                <div key={`dislike-${food.value}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`disliked-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsDisliked", food.value)}
                  />
                  <Label
                    htmlFor={`disliked-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spice Tolerance */}
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Spice Tolerance</Label>
          <RadioGroup
            value={formData.spiceTolerance || ""}
            onValueChange={(v) => setFormData({ ...formData, spiceTolerance: v })}
            className="grid grid-cols-1 gap-4"
          >
            {SPICE_TOLERANCE.map((level) => (
              <div key={level.value}>
                <RadioGroupItem value={level.value} id={`spice-${level.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`spice-${level.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
