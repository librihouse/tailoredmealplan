"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FOOD_LIKES_PROTEINS, FOOD_LIKES_GRAINS, FOOD_LIKES_VEGETABLES, FOOD_LIKES_FRUITS, FOOD_LIKES_DAIRY, FLAVOR_PREFERENCES, SPICE_TOLERANCE } from "@/config/questionnaireConfig";

interface FoodPreferencesPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

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

  const allFoods = [
    ...FOOD_LIKES_PROTEINS,
    ...FOOD_LIKES_GRAINS,
    ...FOOD_LIKES_VEGETABLES,
    ...FOOD_LIKES_FRUITS,
    ...FOOD_LIKES_DAIRY,
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Food Preferences</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Tell us what you love and what you'd rather avoid. (Optional)"}
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Foods You Love</Label>
          <p className="text-xs text-gray-400">Select foods you enjoy eating</p>
          <div className="grid grid-cols-3 gap-3">
            {allFoods.map((food) => {
              const isSelected = (formData.foodsLoved || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`loved-${food.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodsLoved", food.value)}
                  />
                  <Label
                    htmlFor={`loved-${food.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {food.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Foods You Dislike</Label>
          <p className="text-xs text-gray-400">Select foods you'd prefer to avoid</p>
          <div className="grid grid-cols-3 gap-3">
            {allFoods.map((food) => {
              const isSelected = (formData.foodsDisliked || []).includes(food.value);
              return (
                <div key={food.value} className="flex items-center space-x-2">
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

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Flavor Preferences</Label>
          <p className="text-xs text-gray-400">Select flavors you enjoy</p>
          <div className="grid grid-cols-2 gap-3">
            {FLAVOR_PREFERENCES.map((flavor) => {
              const isSelected = (formData.flavorPreferences || []).includes(flavor.value);
              return (
                <div key={flavor.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`flavor-${flavor.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("flavorPreferences", flavor.value)}
                  />
                  <Label
                    htmlFor={`flavor-${flavor.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {flavor.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

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

