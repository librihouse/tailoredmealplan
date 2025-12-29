/**
 * Helper functions for questionnaire form state management
 * All functions use functional updates to prevent stale state issues
 */

export type FormDataUpdater<T> = (prev: T) => T;

/**
 * Creates a functional update for a single field
 */
export function updateSingleField<T extends Record<string, any>>(
  field: keyof T,
  value: any
): FormDataUpdater<T> {
  return (prev) => ({
    ...prev,
    [field]: value,
  });
}

/**
 * Creates a functional update for an array field (add/remove/toggle)
 */
export function updateArrayField<T extends Record<string, any>>(
  field: keyof T,
  value: any,
  action: "add" | "remove" | "toggle" = "toggle"
): FormDataUpdater<T> {
  return (prev) => {
    const currentArray = (prev[field] as any[]) || [];
    let newArray: any[];

    if (action === "add") {
      newArray = currentArray.includes(value)
        ? currentArray
        : [...currentArray, value];
    } else if (action === "remove") {
      newArray = currentArray.filter((item) => item !== value);
    } else {
      // toggle
      if (currentArray.includes(value)) {
        newArray = currentArray.filter((item) => item !== value);
      } else {
        newArray = [...currentArray, value];
      }
    }

    return {
      ...prev,
      [field]: newArray,
    };
  };
}

/**
 * Handles "None" option with mutual exclusivity
 * If "none" is selected, clears all other values
 * If any other value is selected, removes "none"
 */
export function handleNoneOption<T extends Record<string, any>>(
  field: keyof T,
  noneValue: string,
  selectedValue: string
): FormDataUpdater<T> {
  return (prev) => {
    const currentArray = (prev[field] as any[]) || [];

    if (selectedValue === noneValue) {
      // Selecting "none" - clear all others
      return {
        ...prev,
        [field]: [noneValue],
      };
    } else {
      // Selecting something else - remove "none" and add/remove the value
      const withoutNone = currentArray.filter((item) => item !== noneValue);
      const isSelected = withoutNone.includes(selectedValue);
      return {
        ...prev,
        [field]: isSelected
          ? withoutNone.filter((item) => item !== selectedValue)
          : [...withoutNone, selectedValue],
      };
    }
  };
}

/**
 * Handles "Other" option with conditional text field
 */
export function handleOtherOption<T extends Record<string, any>>(
  field: keyof T,
  otherField: keyof T,
  isOther: boolean,
  otherValue: string
): FormDataUpdater<T> {
  return (prev) => ({
    ...prev,
    [field]: isOther ? "other" : prev[field],
    [otherField]: isOther ? otherValue : "",
  });
}

/**
 * Combines multiple updaters into a single update function
 */
export function combineUpdaters<T>(
  ...updaters: FormDataUpdater<T>[]
): FormDataUpdater<T> {
  return (prev) => {
    return updaters.reduce((current, updater) => updater(current), prev);
  };
}

/**
 * Validates that required fields are filled
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: (keyof T)[] } {
  const missingFields: (keyof T)[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

