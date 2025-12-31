"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { RELIGIOUS_DIET_OPTIONS } from "@/config/questionnaireConfig";

interface DietaryPreferencesPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isMandatory?: boolean;
}

export function DietaryPreferencesPage({ formData, setFormData, isMandatory }: DietaryPreferencesPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Ethnic & Cultural Diet</h2>
        <p className="text-gray-400 text-lg">
          {isMandatory && <span className="text-red-400 font-bold">* Required - </span>}
          Please tell us about your religious or cultural dietary requirements. This helps us create meal plans that respect your beliefs and traditions.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">
            Religious/Cultural Diet <span className="text-red-400">*</span>
          </Label>
          <p className="text-xs text-gray-400">This field is required. Please select an option.</p>
          <RadioGroup
            value={formData.religiousDiet || ""}
            onValueChange={(v) => {
              setFormData({
                ...formData,
                religiousDiet: v,
                religiousDietOther: v === "other" ? formData.religiousDietOther : "",
              });
            }}
            className="grid grid-cols-1 gap-4"
          >
            {RELIGIOUS_DIET_OPTIONS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={`religious-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`religious-${option.value}`}
                  className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
            <div>
              <RadioGroupItem value="other" id="religious-other" className="peer sr-only" />
              <Label
                htmlFor="religious-other"
                className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
              >
                Other
              </Label>
            </div>
          </RadioGroup>
          {formData.religiousDiet === "other" && (
            <div className="mt-2">
              <Input
                type="text"
                value={formData.religiousDietOther || ""}
                onChange={(e) => setFormData({ ...formData, religiousDietOther: e.target.value })}
                className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                placeholder="Please specify..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

