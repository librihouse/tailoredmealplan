"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HEALTH_GOALS, SECONDARY_GOALS, HEALTH_CONDITIONS, MEDICATIONS } from "@/config/questionnaireConfig";

interface HealthGoalsPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isMandatory?: boolean;
}

export function HealthGoalsPage({ formData, setFormData, isMandatory }: HealthGoalsPageProps) {
  const handleMultiSelect = (field: keyof QuestionnaireFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const isSelected = currentArray.includes(value);
    
    if (field === "healthConditions" && value === "none") {
      setFormData({ ...formData, [field]: ["none"] });
    } else if (field === "medications" && value === "none") {
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
        <h2 className="font-heading text-4xl font-bold uppercase">Medical Information</h2>
        <p className="text-gray-400 text-lg">
          {isMandatory && <span className="text-red-400 font-bold">* Required - </span>}
          Please tell us about any health conditions. This is required to ensure your meal plan is safe and appropriate for your health needs.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">
            Health Conditions <span className="text-red-400">*</span>
          </Label>
          <p className="text-xs text-gray-400">This field is required. Please select at least one option (you can select 'None' if you have no conditions).</p>
          <div className="grid grid-cols-1 gap-3">
            {HEALTH_GOALS.map((goal) => {
              const isSelected = (formData.healthGoal || []).includes(goal.value);
              return (
                <div key={goal.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`health-goal-${goal.value}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      const currentArray = (formData.healthGoal || []) as string[];
                      const isSelected = currentArray.includes(goal.value);
                      setFormData({
                        ...formData,
                        healthGoal: isSelected
                          ? currentArray.filter((v) => v !== goal.value)
                          : [...currentArray, goal.value],
                      });
                    }}
                  />
                  <Label
                    htmlFor={`health-goal-${goal.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {goal.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Primary Health Goals (Optional)</Label>
          <p className="text-xs text-gray-400">Select any health goals you'd like to focus on</p>
          <div className="grid grid-cols-1 gap-3">
            {SECONDARY_GOALS.map((goal) => {
              const isSelected = (formData.secondaryGoals || []).includes(goal.value);
              return (
                <div key={goal.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`secondary-goal-${goal.value}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      const currentArray = (formData.secondaryGoals || []) as string[];
                      const isSelected = currentArray.includes(goal.value);
                      setFormData({
                        ...formData,
                        secondaryGoals: isSelected
                          ? currentArray.filter((v) => v !== goal.value)
                          : [...currentArray, goal.value],
                      });
                    }}
                  />
                  <Label
                    htmlFor={`secondary-goal-${goal.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {goal.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Health Conditions</Label>
          <p className="text-xs text-gray-400">Select any conditions that apply</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="health-condition-none"
                checked={(formData.healthConditions || []).includes("none")}
                onCheckedChange={() => handleMultiSelect("healthConditions", "none")}
              />
              <Label
                htmlFor="health-condition-none"
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                None
              </Label>
            </div>
            {HEALTH_CONDITIONS.map((condition) => {
              const isSelected = (formData.healthConditions || []).includes(condition.value);
              const hasNone = (formData.healthConditions || []).includes("none");
              return (
                <div key={condition.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`health-condition-${condition.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("healthConditions", condition.value)}
                    disabled={hasNone}
                  />
                  <Label
                    htmlFor={`health-condition-${condition.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {condition.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Medications (Optional)</Label>
          <p className="text-xs text-gray-400">Select any medications you're taking</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="medication-none"
                checked={(formData.medications || []).includes("none")}
                onCheckedChange={() => handleMultiSelect("medications", "none")}
              />
              <Label
                htmlFor="medication-none"
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                None
              </Label>
            </div>
            {MEDICATIONS.map((medication) => {
              const isSelected = (formData.medications || []).includes(medication.value);
              const hasNone = (formData.medications || []).includes("none");
              return (
                <div key={medication.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`medication-${medication.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleMultiSelect("medications", medication.value)}
                    disabled={hasNone}
                  />
                  <Label
                    htmlFor={`medication-${medication.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-300"
                  >
                    {medication.label}
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

