"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DIETARY_PREFERENCES, DIETARY_RESTRICTIONS } from "@/config/questionnaireConfig";

interface DietaryPreferencesOptionalPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

export function DietaryPreferencesOptionalPage({ formData, setFormData, isOptional, isSkipped }: DietaryPreferencesOptionalPageProps) {
  const handleMultiSelect = (field: keyof QuestionnaireFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const isSelected = currentArray.includes(value);
    
    if (field === "dietaryRestrictions" && value === "no-restrictions") {
      setFormData({ ...formData, [field]: ["no-restrictions"] });
    } else {
      const withoutNone = currentArray.filter((v) => v !== "no-restrictions");
      setFormData({
        ...formData,
        [field]: isSelected
          ? withoutNone.filter((v) => v !== value)
          : [...withoutNone, value],
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Dietary Preferences</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Tell us about your dietary preferences and restrictions. (Optional)"}
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Dietary Preferences</Label>
          <p className="text-xs text-gray-400">Select all that apply</p>
          <div className="grid grid-cols-2 gap-3">
            {DIETARY_PREFERENCES.map((pref) => {
              const isSelected = (formData.dietaryPreferences || []).includes(pref.value);
              return (
                <div key={pref.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dietary-pref-${pref.value}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      const currentArray = (formData.dietaryPreferences || []) as string[];
                      const isSelected = currentArray.includes(pref.value);
                      setFormData({
                        ...formData,
                        dietaryPreferences: isSelected
                          ? currentArray.filter((v) => v !== pref.value)
                          : [...currentArray, pref.value],
                      });
                    }}
                  />
                  <Label
                    htmlFor={`dietary-pref-${pref.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {pref.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Dietary Restrictions</Label>
          <p className="text-xs text-gray-400">Select any restrictions</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="restriction-none"
                checked={(formData.dietaryRestrictions || []).includes("no-restrictions")}
                onCheckedChange={() => handleMultiSelect("dietaryRestrictions", "no-restrictions")}
              />
              <Label
                htmlFor="restriction-none"
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                No Restrictions
              </Label>
            </div>
            {DIETARY_RESTRICTIONS.map((restriction) => {
              const isSelected = (formData.dietaryRestrictions || []).includes(restriction.value);
              const hasNone = (formData.dietaryRestrictions || []).includes("no-restrictions");
              return (
                <div key={restriction.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`restriction-${restriction.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("dietaryRestrictions", restriction.value)}
                    disabled={hasNone}
                  />
                  <Label
                    htmlFor={`restriction-${restriction.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {restriction.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

