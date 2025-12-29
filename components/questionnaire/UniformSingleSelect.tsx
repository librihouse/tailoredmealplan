"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SingleSelectOption {
  value: string;
  label: string;
}

interface UniformSingleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SingleSelectOption[];
  label?: string;
  description?: string;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
  className?: string;
  gridCols?: "2" | "3" | "4" | "auto";
}

export function UniformSingleSelect({
  value,
  onChange,
  options,
  label,
  description,
  allowOther = false,
  otherValue = "",
  onOtherChange,
  otherPlaceholder = "Please specify...",
  className,
  gridCols = "auto",
}: UniformSingleSelectProps) {
  const gridClass = {
    "2": "grid-cols-2",
    "3": "grid-cols-2 md:grid-cols-3",
    "4": "grid-cols-2 md:grid-cols-4",
    "auto": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[gridCols];

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
        {options
          .filter((option) => {
            // Filter out "other" option when allowOther is true
            if (allowOther && option.value === "other") {
              return false;
            }
            return true;
          })
          .map((option) => {
            const isSelected = value === option.value;
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
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        {allowOther && (
          <Button
            type="button"
            variant={value === "other" ? "default" : "outline"}
            className={cn(
              "w-full justify-start text-left h-auto min-h-[3rem] py-3 px-4 transition-all",
              "whitespace-normal break-words leading-tight overflow-hidden",
              value === "other"
                ? "bg-primary text-black border-primary hover:bg-primary/90"
                : "bg-black/40 border-white/20 text-white hover:bg-black/60 hover:border-white/30"
            )}
            onClick={() => onChange("other")}
          >
            Other
          </Button>
        )}
      </div>
      {allowOther && value === "other" && onOtherChange && (
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

