"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalorieGuidanceProps {
  healthGoals: string[];
  calorieTarget: string;
  onCalorieChange: (value: string) => void;
  age?: number;
  weight?: number;
  height?: number;
  activity?: string;
}

export function CalorieGuidance({
  healthGoals,
  calorieTarget,
  onCalorieChange,
  age,
  weight,
  height,
  activity = "moderate",
}: CalorieGuidanceProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAge, setCalcAge] = useState(age?.toString() || "");
  const [calcWeight, setCalcWeight] = useState(weight?.toString() || "");
  const [calcHeight, setCalcHeight] = useState(height?.toString() || "");
  const [calcActivity, setCalcActivity] = useState(activity);
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);

  // Get calorie suggestions based on health goals
  const getCalorieSuggestions = () => {
    const suggestions: Record<string, { min: number; max: number; label: string }> = {
      lose_weight: { min: 1200, max: 1500, label: "Weight Loss" },
      build_muscle: { min: 2500, max: 3000, label: "Muscle Building" },
      maintain: { min: 1800, max: 2200, label: "Weight Maintenance" },
      gain_weight: { min: 2500, max: 3500, label: "Weight Gain" },
      health: { min: 1800, max: 2200, label: "General Health" },
    };

    if (healthGoals.length === 0) {
      return { min: 1800, max: 2200, label: "General" };
    }

    // If multiple goals, use the primary one or average
    const primaryGoal = healthGoals[0];
    return suggestions[primaryGoal] || suggestions.health;
  };

  const suggestion = getCalorieSuggestions();

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (age: number, weight: number, height: number, gender: string = "male") => {
    // Height in cm, weight in kg
    const heightCm = height;
    const weightKg = weight;
    
    if (gender === "female") {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }
  };

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const calculateCalories = () => {
    const ageNum = parseInt(calcAge, 10);
    const weightNum = parseFloat(calcWeight);
    const heightNum = parseFloat(calcHeight);

    if (!ageNum || !weightNum || !heightNum) {
      return;
    }

    // Assume male for calculation (could be improved with gender input)
    const bmr = calculateBMR(ageNum, weightNum, heightNum, "male");
    const multiplier = activityMultipliers[calcActivity] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // Adjust based on primary health goal
    let adjustedCalories = tdee;
    if (healthGoals.includes("lose_weight")) {
      adjustedCalories = Math.round(tdee * 0.8); // 20% deficit
    } else if (healthGoals.includes("gain_weight") || healthGoals.includes("build_muscle")) {
      adjustedCalories = Math.round(tdee * 1.15); // 15% surplus
    }

    setCalculatedCalories(adjustedCalories);
    onCalorieChange(adjustedCalories.toString());
  };

  return (
    <div className="space-y-3">
      {/* Smart Suggestions */}
      {healthGoals.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-sm text-primary font-medium mb-1">
            Recommended for {suggestion.label}: {suggestion.min.toLocaleString()} - {suggestion.max.toLocaleString()} calories/day
          </p>
          <p className="text-xs text-gray-400">
            Based on your selected health goal{healthGoals.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Calculator Toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowCalculator(!showCalculator)}
        className="text-primary hover:text-primary/80 text-sm"
      >
        <Calculator className="mr-2 h-4 w-4" />
        {showCalculator ? "Hide" : "Show"} Calorie Calculator
        {showCalculator ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>

      {/* Calculator */}
      {showCalculator && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">Calorie Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white text-xs mb-1 block">Age</Label>
                <Input
                  type="number"
                  value={calcAge}
                  onChange={(e) => setCalcAge(e.target.value)}
                  placeholder="25"
                  className="bg-black/40 border-white/20 text-white text-sm"
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <Label className="text-white text-xs mb-1 block">Weight (kg)</Label>
                <Input
                  type="number"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="70"
                  className="bg-black/40 border-white/20 text-white text-sm"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-white text-xs mb-1 block">Height (cm)</Label>
                <Input
                  type="number"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(e.target.value)}
                  placeholder="175"
                  className="bg-black/40 border-white/20 text-white text-sm"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-white text-xs mb-1 block">Activity Level</Label>
                <select
                  value={calcActivity}
                  onChange={(e) => setCalcActivity(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Very Active</option>
                  <option value="very_active">Extremely Active</option>
                </select>
              </div>
            </div>

            <Button
              type="button"
              onClick={calculateCalories}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-sm"
            >
              Calculate Calories
            </Button>

            {calculatedCalories && (
              <div className="bg-primary/20 border border-primary/30 rounded-lg p-3">
                <p className="text-sm text-primary font-bold">
                  Recommended: {calculatedCalories.toLocaleString()} calories/day
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This has been set as your calorie target
                </p>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-medium">Examples by goal:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Weight Loss: 1,200 - 1,500 cal/day</li>
                <li>Muscle Gain: 2,500 - 3,000 cal/day</li>
                <li>Maintain Weight: 1,800 - 2,200 cal/day</li>
                <li>General Health: 1,800 - 2,200 cal/day</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

