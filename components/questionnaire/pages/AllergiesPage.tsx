"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ALLERGY_OPTIONS, FOOD_INTOLERANCES } from "@/config/questionnaireConfig";

interface AllergiesPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isMandatory?: boolean;
}

export function AllergiesPage({ formData, setFormData, isMandatory }: AllergiesPageProps) {
  const handleMultiSelect = (field: keyof QuestionnaireFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const isSelected = currentArray.includes(value);
    
    if (value === "none") {
      setFormData({ ...formData, [field]: ["none"] });
    } else {
      const withoutNone = currentArray.filter((v) => v !== "none");
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
        <h2 className="font-heading text-4xl font-bold uppercase">Allergies & Intolerances</h2>
        <p className="text-gray-400 text-lg">
          {isMandatory && <span className="text-red-400 font-bold">* Required - </span>}
          Please tell us about any food allergies. This is required to ensure your meal plan is safe. You can select 'None' if you have no allergies.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">
            Food Allergies <span className="text-red-400">*</span>
          </Label>
          <p className="text-xs text-gray-400">This field is required. Please select at least one option (you can select 'None' if you have no allergies).</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allergy-none"
                checked={(formData.allergies || []).includes("none")}
                onCheckedChange={() => handleMultiSelect("allergies", "none")}
              />
              <Label
                htmlFor="allergy-none"
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                None
              </Label>
            </div>
            {ALLERGY_OPTIONS.map((allergy) => {
              const isSelected = (formData.allergies || []).includes(allergy.value);
              const hasNone = (formData.allergies || []).includes("none");
              return (
                <div key={allergy.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`allergy-${allergy.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("allergies", allergy.value)}
                    disabled={hasNone}
                  />
                  <Label
                    htmlFor={`allergy-${allergy.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {allergy.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Food Intolerances (Optional)</Label>
          <p className="text-xs text-gray-400">Select any intolerances you have</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="intolerance-none"
                checked={(formData.foodIntolerances || []).includes("none")}
                onCheckedChange={() => handleMultiSelect("foodIntolerances", "none")}
              />
              <Label
                htmlFor="intolerance-none"
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                None
              </Label>
            </div>
            {FOOD_INTOLERANCES.map((intolerance) => {
              const isSelected = (formData.foodIntolerances || []).includes(intolerance.value);
              const hasNone = (formData.foodIntolerances || []).includes("none");
              return (
                <div key={intolerance.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`intolerance-${intolerance.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("foodIntolerances", intolerance.value)}
                    disabled={hasNone}
                  />
                  <Label
                    htmlFor={`intolerance-${intolerance.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {intolerance.label}
                  </Label>
                </div>
              );
            })}
          </div>
          {(formData.foodIntolerances || []).includes("other") && (
            <div className="mt-2">
              <Input
                type="text"
                value={formData.foodIntolerancesOther || ""}
                onChange={(e) => setFormData({ ...formData, foodIntolerancesOther: e.target.value })}
                className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                placeholder="Please specify other intolerances..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

