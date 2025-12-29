"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UniformTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "number" | "email" | "tel";
  className?: string;
  required?: boolean;
}

export function UniformTextInput({
  value,
  onChange,
  label,
  placeholder,
  description,
  type = "text",
  className,
  required = false,
}: UniformTextInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div>
          <Label className="text-white text-sm font-medium">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-black/40 border-white/20 text-white"
        required={required}
      />
    </div>
  );
}

