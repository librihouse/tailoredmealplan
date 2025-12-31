"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FieldConfig, SelectOption } from "@/types/questionnaire";
import { QuestionnaireFormData } from "@/types/questionnaire";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface QuestionnaireFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  formData: QuestionnaireFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireFormData>>;
}

export function QuestionnaireField({
  field,
  value,
  onChange,
  formData,
  setFormData,
}: QuestionnaireFieldProps) {
  const handleNoneOption = (selectedValue: string) => {
    if (field.allowNone && field.noneValue) {
      if (selectedValue === field.noneValue) {
        // Selecting "none" - clear all others
        onChange([field.noneValue]);
      } else {
        // Selecting something else - remove "none"
        const currentArray = (value as string[]) || [];
        const withoutNone = currentArray.filter((item) => item !== field.noneValue);
        const isSelected = withoutNone.includes(selectedValue);
        onChange(
          isSelected
            ? withoutNone.filter((item) => item !== selectedValue)
            : [...withoutNone, selectedValue]
        );
      }
    } else {
      onChange(selectedValue);
    }
  };

  const handleOtherOption = (isOther: boolean, otherValue: string) => {
    if (isOther) {
      onChange("other");
      // Set the other field value
      const otherFieldName = `${field.name}Other` as keyof QuestionnaireFormData;
      setFormData((prev) => ({
        ...prev,
        [otherFieldName]: otherValue,
      }));
    } else {
      onChange(value);
    }
  };

  // Render based on field type
  if (field.type === "text" || field.type === "number") {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300 uppercase font-bold text-sm">
          {field.label}
          {field.validation?.required && <span className="text-primary ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-gray-400">{field.description}</p>
        )}
        <Input
          type={field.type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
          placeholder={field.description}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300 uppercase font-bold text-sm">
          {field.label}
          {field.validation?.required && <span className="text-primary ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-gray-400">{field.description}</p>
        )}
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/40 border-white/20 text-lg focus:border-primary min-h-[120px] resize-none"
          placeholder={field.description}
        />
      </div>
    );
  }

  if (field.type === "single-select") {
    const isOther = value === "other";
    const otherFieldName = `${field.name}Other` as keyof QuestionnaireFormData;
    const otherValue = formData[otherFieldName] as string;

    return (
      <div className="space-y-2">
        <Label className="text-gray-300 uppercase font-bold text-sm">
          {field.label}
          {field.validation?.required && <span className="text-primary ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-gray-400 mb-4">{field.description}</p>
        )}
        <RadioGroup
          value={value || ""}
          onValueChange={(v) => {
            if (v === "other") {
              handleOtherOption(true, otherValue || "");
            } else {
              onChange(v);
              // Clear other field if not "other"
              setFormData((prev) => ({
                ...prev,
                [otherFieldName]: "",
              }));
            }
          }}
          className={cn(
            "grid gap-4",
            field.gridCols === "2" && "grid-cols-2",
            field.gridCols === "3" && "grid-cols-3",
            field.gridCols === "4" && "grid-cols-4",
            !field.gridCols && "grid-cols-1"
          )}
        >
          {field.options?.map((option: SelectOption) => (
            <div key={option.value}>
              <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} className="peer sr-only" />
              <Label
                htmlFor={`${field.name}-${option.value}`}
                className={cn(
                  "flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
          {field.allowOther && (
            <>
              <div>
                <RadioGroupItem value="other" id={`${field.name}-other`} className="peer sr-only" />
                <Label
                  htmlFor={`${field.name}-other`}
                  className={cn(
                    "flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                  )}
                >
                  Other
                </Label>
              </div>
              {isOther && (
                <div className="col-span-full mt-2">
                  <Input
                    type="text"
                    value={otherValue || ""}
                    onChange={(e) => handleOtherOption(true, e.target.value)}
                    className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                    placeholder="Please specify..."
                  />
                </div>
              )}
            </>
          )}
        </RadioGroup>
      </div>
    );
  }

  if (field.type === "multi-select") {
    const currentArray = (value as string[]) || [];
    const isOtherSelected = currentArray.includes("other");
    const otherFieldName = `${field.name}Other` as keyof QuestionnaireFormData;
    const otherValue = formData[otherFieldName] as string;

    return (
      <div className="space-y-2">
        <Label className="text-gray-300 uppercase font-bold text-sm">
          {field.label}
          {field.validation?.required && <span className="text-primary ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-gray-400 mb-4">{field.description}</p>
        )}
        <div
          className={cn(
            "grid gap-3",
            field.gridCols === "2" && "grid-cols-2",
            field.gridCols === "3" && "grid-cols-3",
            field.gridCols === "4" && "grid-cols-4",
            !field.gridCols && "grid-cols-1"
          )}
        >
          {field.allowNone && field.noneValue && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${field.name}-none`}
                checked={currentArray.includes(field.noneValue)}
                onCheckedChange={() => handleNoneOption(field.noneValue!)}
              />
              <Label
                htmlFor={`${field.name}-none`}
                className="text-sm font-medium cursor-pointer text-gray-300"
              >
                None
              </Label>
            </div>
          )}
          {field.options?.map((option: SelectOption) => {
            const isSelected = currentArray.includes(option.value);
            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option.value}`}
                  checked={isSelected}
                  onCheckedChange={() => handleNoneOption(option.value)}
                  disabled={field.allowNone && currentArray.includes(field.noneValue || "")}
                />
                <Label
                  htmlFor={`${field.name}-${option.value}`}
                  className="text-sm font-medium cursor-pointer text-gray-300"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
          {field.allowOther && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-other`}
                  checked={isOtherSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...currentArray.filter((v) => v !== "other"), "other"]);
                    } else {
                      onChange(currentArray.filter((v) => v !== "other"));
                      setFormData((prev) => ({
                        ...prev,
                        [otherFieldName]: "",
                      }));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.name}-other`}
                  className="text-sm font-medium cursor-pointer text-gray-300"
                >
                  Other
                </Label>
              </div>
              {isOtherSelected && (
                <div className="col-span-full mt-2">
                  <Input
                    type="text"
                    value={otherValue || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        [otherFieldName]: e.target.value,
                      }));
                    }}
                    className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                    placeholder="Please specify..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

