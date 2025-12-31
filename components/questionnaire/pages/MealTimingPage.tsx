"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { MEALS_PER_DAY, INCLUDE_SNACKS, INTERMITTENT_FASTING, COOKING_SKILL_LEVELS, COOKING_TIME_OPTIONS } from "@/config/questionnaireConfig";

interface MealTimingPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

export function MealTimingPage({ formData, setFormData, isOptional, isSkipped }: MealTimingPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Meal Timing & Preferences</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Tell us about your meal schedule and cooking preferences. (Optional)"}
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Meals Per Day</Label>
          <RadioGroup
            value={formData.mealsPerDay || ""}
            onValueChange={(v) => setFormData({ ...formData, mealsPerDay: v })}
            className="grid grid-cols-2 gap-4"
          >
            {MEALS_PER_DAY.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={`meals-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`meals-${option.value}`}
                  className="flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Include Snacks?</Label>
          <RadioGroup
            value={formData.includeSnacks || ""}
            onValueChange={(v) => setFormData({ ...formData, includeSnacks: v })}
            className="grid grid-cols-3 gap-4"
          >
            {INCLUDE_SNACKS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={`snacks-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`snacks-${option.value}`}
                  className="flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Intermittent Fasting</Label>
          <RadioGroup
            value={formData.intermittentFasting || ""}
            onValueChange={(v) => {
              setFormData({
                ...formData,
                intermittentFasting: v,
                intermittentFastingOther: v === "other" ? formData.intermittentFastingOther : "",
              });
            }}
            className="grid grid-cols-1 gap-4"
          >
            {INTERMITTENT_FASTING.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={`fasting-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`fasting-${option.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
            <div>
              <RadioGroupItem value="other" id="fasting-other" className="peer sr-only" />
              <Label
                htmlFor="fasting-other"
                className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
              >
                Other
              </Label>
            </div>
          </RadioGroup>
          {formData.intermittentFasting === "other" && (
            <div className="mt-2">
              <Input
                type="text"
                value={formData.intermittentFastingOther || ""}
                onChange={(e) => setFormData({ ...formData, intermittentFastingOther: e.target.value })}
                className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                placeholder="Please specify your fasting schedule..."
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Cooking Skill Level</Label>
          <RadioGroup
            value={formData.cookingSkillLevel || ""}
            onValueChange={(v) => setFormData({ ...formData, cookingSkillLevel: v })}
            className="grid grid-cols-1 gap-4"
          >
            {COOKING_SKILL_LEVELS.map((level) => (
              <div key={level.value}>
                <RadioGroupItem value={level.value} id={`skill-${level.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`skill-${level.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Cooking Time Available</Label>
          <RadioGroup
            value={formData.cookingTimeAvailable || ""}
            onValueChange={(v) => setFormData({ ...formData, cookingTimeAvailable: v })}
            className="grid grid-cols-1 gap-4"
          >
            {COOKING_TIME_OPTIONS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={`time-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`time-${option.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

