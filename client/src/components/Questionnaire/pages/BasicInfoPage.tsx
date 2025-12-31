"use client";

import { QuestionnaireFormData } from "@/types/questionnaire";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ACTIVITY_LEVELS } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";

interface BasicInfoPageProps {
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
  isOptional?: boolean;
  isSkipped?: boolean;
}

export function BasicInfoPage({ formData, setFormData, isOptional, isSkipped }: BasicInfoPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="font-heading text-4xl font-bold uppercase">Basic Information</h2>
        <p className="text-gray-400 text-lg">
          {isSkipped ? "This section was skipped. You can fill it out now or continue." : "Let's start with some basic details about you. (Optional)"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-300 uppercase font-bold">Age</Label>
            <Input
              type="number"
              placeholder="25"
              className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
              value={formData.age || ""}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              min="1"
              max="120"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 uppercase font-bold">Height (cm)</Label>
            <Input
              type="number"
              placeholder="170"
              className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
              value={formData.height || ""}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              required
              min="50"
              max="250"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-300 uppercase font-bold">Current Weight (kg)</Label>
            <Input
              type="number"
              placeholder="70"
              className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
              value={formData.currentWeight || ""}
              onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
              required
              min="20"
              max="300"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 uppercase font-bold">Target Weight (kg)</Label>
            <Input
              type="number"
              placeholder="65"
              className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
              value={formData.targetWeight || ""}
              onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
              min="20"
              max="300"
            />
            <p className="text-xs text-gray-400">Optional - leave blank if maintaining current weight</p>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-300 uppercase font-bold block">Activity Level</Label>
          <RadioGroup
            value={formData.activityLevel || ""}
            onValueChange={(v) => setFormData({ ...formData, activityLevel: v })}
            className="grid grid-cols-1 gap-4"
          >
            {ACTIVITY_LEVELS.map((level) => (
              <div key={level.value}>
                <RadioGroupItem value={level.value} id={`activity-${level.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`activity-${level.value}`}
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

