"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BUDGET_LEVELS, MEAL_PLAN_FOCUS } from "@/config/questionnaireConfig";

interface FinalDetailsPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

export function FinalDetailsPage({ formData, setFormData, isOptional, isSkipped }: FinalDetailsPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Final Details</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Any additional preferences or notes for your meal plan. (Optional)"}
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Budget Level</Label>
          <RadioGroup
            value={formData.budgetLevel || ""}
            onValueChange={(v) => setFormData({ ...formData, budgetLevel: v })}
            className="grid grid-cols-1 gap-4"
          >
            {BUDGET_LEVELS.map((level) => (
              <div key={level.value}>
                <RadioGroupItem value={level.value} id={`budget-${level.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`budget-${level.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Meal Plan Focus</Label>
          <p className="text-xs text-gray-400">Select areas you'd like the plan to emphasize</p>
          <div className="grid grid-cols-2 gap-3">
            {MEAL_PLAN_FOCUS.map((focus) => {
              const isSelected = (formData.mealPlanFocus || []).includes(focus.value);
              return (
                <div key={focus.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`focus-${focus.value}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      const currentArray = (formData.mealPlanFocus || []) as string[];
                      const isSelected = currentArray.includes(focus.value);
                      setFormData({
                        ...formData,
                        mealPlanFocus: isSelected
                          ? currentArray.filter((v) => v !== focus.value)
                          : [...currentArray, focus.value],
                      });
                    }}
                  />
                  <Label
                    htmlFor={`focus-${focus.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {focus.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300 uppercase font-bold">Special Dietary Notes</Label>
          <p className="text-xs text-gray-400">Any additional information that would help us create your perfect meal plan</p>
          <Textarea
            value={formData.specialDietaryNotes || ""}
            onChange={(e) => setFormData({ ...formData, specialDietaryNotes: e.target.value })}
            className="bg-black/40 border-white/20 text-lg focus:border-primary min-h-[150px] resize-none"
            placeholder="E.g., I prefer quick breakfasts, I love trying new cuisines, I have a sweet tooth but want to reduce sugar..."
          />
        </div>
      </div>
    </div>
  );
}

