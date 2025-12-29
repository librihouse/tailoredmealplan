"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface UniformMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  label?: string;
  description?: string;
  allowNone?: boolean;
  noneValue?: string;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
  className?: string;
  gridCols?: "2" | "3" | "4" | "auto";
}

export function UniformMultiSelect({
  values,
  onChange,
  options,
  label,
  description,
  allowNone = false,
  noneValue = "none",
  allowOther = false,
  otherValue = "",
  onOtherChange,
  otherPlaceholder = "Please specify...",
  className,
  gridCols = "auto",
}: UniformMultiSelectProps) {
  const gridClass = {
    "2": "grid-cols-2",
    "3": "grid-cols-2 md:grid-cols-3",
    "4": "grid-cols-2 md:grid-cols-4",
    "auto": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[gridCols];

  const handleToggle = (optionValue: string) => {
    if (allowNone && optionValue === noneValue) {
      // If "none" is selected, clear all others including "other"
      onChange([noneValue]);
      // Also clear the "other" text value if callback is provided
      if (allowOther && onOtherChange) {
        onOtherChange("");
      }
    } else if (values.includes(optionValue)) {
      // Remove if already selected
      const newValues = values.filter((v) => v !== optionValue);
      // If removing "none" and no other values, keep it
      onChange(newValues.length === 0 && allowNone ? [noneValue] : newValues);
      // If removing "other", clear the text value
      if (optionValue === "other" && onOtherChange) {
        onOtherChange("");
      }
    } else {
      // Add if not selected, but remove "none" and "other" if they exist
      const newValues = values.filter((v) => v !== noneValue && v !== "other");
      onChange([...newValues, optionValue]);
      // If "other" was removed, clear its text value
      if (values.includes("other") && onOtherChange) {
        onOtherChange("");
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div>
          <Label className="text-white text-base font-semibold">{label}</Label>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className={cn("grid gap-3", gridClass)}>
        {allowNone && (
          <Button
            type="button"
            variant={values.includes(noneValue) ? "default" : "outline"}
            className={cn(
              "w-full justify-start text-left h-auto min-h-[3rem] py-3 px-4 transition-all",
              "whitespace-normal break-words leading-tight overflow-hidden",
              values.includes(noneValue)
                ? "bg-primary text-black border-primary hover:bg-primary/90"
                : "bg-black/40 border-white/20 text-white hover:bg-black/60 hover:border-white/30"
            )}
            onClick={() => handleToggle(noneValue)}
          >
            None
          </Button>
        )}
        {options
          .filter((option) => {
            // Filter out options that match noneValue when allowNone is true
            if (allowNone && option.value === noneValue) {
              return false;
            }
            // Filter out "other" option when allowOther is true
            if (allowOther && option.value === "other") {
              return false;
            }
            return true;
          })
          .map((option) => {
            const isSelected = values.includes(option.value);
            const isLongLabel = option.label.length > 40;
            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-start text-left h-auto min-h-[3rem] py-3 px-4 transition-all",
                  "whitespace-normal break-words leading-tight overflow-hidden",
                  isLongLabel ? "text-sm" : "text-base",
                  isSelected
                    ? "bg-primary text-black border-primary hover:bg-primary/90"
                    : "bg-black/40 border-white/20 text-white hover:bg-black/60 hover:border-white/30"
                )}
                onClick={() => handleToggle(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        {allowOther && (
          <Button
            type="button"
            variant={values.includes("other") ? "default" : "outline"}
            className={cn(
              "w-full justify-start text-left h-auto min-h-[3rem] py-3 px-4 transition-all",
              "whitespace-normal break-words leading-tight overflow-hidden",
              values.includes("other")
                ? "bg-primary text-black border-primary hover:bg-primary/90"
                : "bg-black/40 border-white/20 text-white hover:bg-black/60 hover:border-white/30"
            )}
            onClick={() => handleToggle("other")}
          >
            Other
          </Button>
        )}
      </div>
      {allowOther && values.includes("other") && onOtherChange && (
        <div className="mt-4">
          <Input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder={otherPlaceholder}
            className="bg-black/40 border-white/20 text-white"
            maxLength={100}
          />
        </div>
      )}
    </div>
  );
}

