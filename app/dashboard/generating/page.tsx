"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { generateMealPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

const PROGRESS_MESSAGES = [
  "Analyzing your nutritional needs...",
  "Crafting the perfect recipes...",
  "Balancing your macros...",
  "Optimizing meal timing...",
  "Almost ready to eat well!",
];

export default function GeneratingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [progressMessage, setProgressMessage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const planType = searchParams.get("planType") as "daily" | "weekly" | "monthly" | null;
  const familyMemberId = searchParams.get("familyMemberId");

  // Rotate progress messages
  useEffect(() => {
    if (status !== "loading") return;

    const interval = setInterval(() => {
      setProgressMessage((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  // Generate meal plan on mount
  useEffect(() => {
    if (!planType) {
      setError("Invalid plan type. Please go back and try again.");
      setStatus("error");
      return;
    }

    const generate = async () => {
      try {
        // Retrieve form data from localStorage
        const saveKey = `mealPlanForm_${planType}_${familyMemberId || 'main'}`;
        const savedData = localStorage.getItem(saveKey);
        
        if (!savedData) {
          console.error("Form data not found in localStorage. Key:", saveKey);
          setError("Form data not found. Please go back and fill out the questionnaire again.");
          setStatus("error");
          return;
        }

        const formData = JSON.parse(savedData);
        
        // Build user profile from form data
        const userProfile: any = {
          gender: formData.gender || "other",
          age: formData.age,
          height: formData.height,
          currentWeight: formData.currentWeight,
          targetWeight: formData.targetWeight,
          goal: Array.isArray(formData.healthGoal) && formData.healthGoal.length > 0 
            ? formData.healthGoal[0] 
            : (formData.healthGoal || "health"),
          healthGoalCustom: formData.healthGoalCustom || undefined,
          activity: formData.activity || "moderate",
          diet: formData.dietaryPreferences || [],
          religious: formData.religiousDiet || "none",
          conditions: formData.healthConditions?.length > 0 
            ? formData.healthConditions 
            : [],
          allergies: formData.allergies || [],
          dietaryRestrictions: formData.dietaryRestrictions || [],
          foodIntolerances: formData.foodIntolerances || [],
          secondaryGoals: formData.secondaryGoals || [],
          mealsPerDay: formData.mealsPerDay,
          includeSnacks: formData.includeSnacks,
          mealTimes: {
            breakfast: formData.breakfastTime,
            lunch: formData.lunchTime,
            dinner: formData.dinnerTime,
          },
          snackPreferences: formData.snackPreferences || [],
          intermittentFasting: formData.intermittentFasting,
          foodsLoved: formData.foodsLoved || [],
          foodsDisliked: formData.foodsDisliked || [],
          flavorPreferences: formData.flavorPreferences || [],
          texturePreferences: formData.texturePreferences || [],
          cookingSkillLevel: formData.cookingSkillLevel,
          cookingTimeAvailable: formData.cookingTimeAvailable,
          cookingMethods: formData.cookingMethods || [],
          mealPrepPreference: formData.mealPrepPreference,
          kitchenEquipment: formData.kitchenEquipment || [],
          mealSource: formData.mealSource,
          restaurantTypes: formData.restaurantTypes || [],
          deliveryServices: formData.deliveryServices || [],
          orderingBudget: formData.orderingBudget,
          orderingFrequency: formData.orderingFrequency,
          mealPrepServices: formData.mealPrepServices || [],
          typicalDaySchedule: formData.typicalDaySchedule,
          workSchedule: formData.workSchedule,
          lunchLocation: formData.lunchLocation,
          dinnerLocation: formData.dinnerLocation,
          weekendEatingHabits: formData.weekendEatingHabits,
          budgetLevel: formData.budgetLevel,
          shoppingFrequency: formData.shoppingFrequency,
          shoppingPreferences: formData.shoppingPreferences || [],
          specialtyStoresAccess: formData.specialtyStoresAccess,
          weightChangeTimeline: formData.weightChangeTimeline,
          macroPreferences: formData.macroPreferences,
          customMacros: formData.customMacros,
          fiberTarget: formData.fiberTarget,
          sodiumSensitivity: formData.sodiumSensitivity,
          medications: formData.medications || [],
          pregnancyStatus: formData.pregnancyStatus,
          recentSurgeries: formData.recentSurgeries,
          culturalBackground: formData.culturalBackground,
          traditionalFoodsToInclude: formData.traditionalFoodsToInclude,
          foodsFromCultureToAvoid: formData.foodsFromCultureToAvoid,
          spiceTolerance: formData.spiceTolerance,
          cuisinePreference: formData.cuisinePreference,
          specialOccasions: formData.specialOccasions,
          specialDietaryNotes: formData.specialDietaryNotes,
          mealPlanFocus: (formData.mealPlanFocus && formData.mealPlanFocus.length > 0) 
            ? formData.mealPlanFocus 
            : ["general_wellness"],
          varietyPreference: formData.varietyPreference,
          digestiveHealth: formData.digestiveHealth || [],
          sleepSchedule: formData.sleepSchedule,
          stressLevel: formData.stressLevel,
          hydrationPreferences: formData.hydrationPreferences,
          waterIntake: formData.waterIntake,
          beveragePreferences: formData.beveragePreferences || [],
          activityLevel: formData.activityLevel,
          // All "Other" text fields
          dietaryPreferencesOther: formData.dietaryPreferencesOther || undefined,
          dietaryRestrictionsOther: formData.dietaryRestrictionsOther || undefined,
          foodIntolerancesOther: formData.foodIntolerancesOther || undefined,
          secondaryGoalsOther: formData.secondaryGoalsOther || undefined,
          allergiesOther: formData.allergiesOther || undefined,
          mealsPerDayOther: formData.mealsPerDayOther || undefined,
          includeSnacksOther: formData.includeSnacksOther || undefined,
          snackPreferencesOther: formData.snackPreferencesOther || undefined,
          intermittentFastingOther: formData.intermittentFastingOther || undefined,
          foodsLovedProteinsOther: formData.foodsLovedProteinsOther || undefined,
          foodsLovedGrainsOther: formData.foodsLovedGrainsOther || undefined,
          foodsLovedVegetablesOther: formData.foodsLovedVegetablesOther || undefined,
          foodsLovedFruitsOther: formData.foodsLovedFruitsOther || undefined,
          foodsLovedDairyOther: formData.foodsLovedDairyOther || undefined,
          foodsDislikedOther: formData.foodsDislikedOther || undefined,
          flavorPreferencesOther: formData.flavorPreferencesOther || undefined,
          texturePreferencesOther: formData.texturePreferencesOther || undefined,
          mealSourceOther: formData.mealSourceOther || undefined,
          cookingSkillLevelOther: formData.cookingSkillLevelOther || undefined,
          cookingTimeAvailableOther: formData.cookingTimeAvailableOther || undefined,
          cookingMethodsOther: formData.cookingMethodsOther || undefined,
          mealPrepPreferenceOther: formData.mealPrepPreferenceOther || undefined,
          kitchenEquipmentOther: formData.kitchenEquipmentOther || undefined,
          restaurantTypesOther: formData.restaurantTypesOther || undefined,
          deliveryServicesOther: formData.deliveryServicesOther || undefined,
          orderingBudgetOther: formData.orderingBudgetOther || undefined,
          orderingFrequencyOther: formData.orderingFrequencyOther || undefined,
          mealPrepServicesOther: formData.mealPrepServicesOther || undefined,
          typicalDayScheduleOther: formData.typicalDayScheduleOther || undefined,
          workScheduleOther: formData.workScheduleOther || undefined,
          lunchLocationOther: formData.lunchLocationOther || undefined,
          dinnerLocationOther: formData.dinnerLocationOther || undefined,
          weekendEatingHabitsOther: formData.weekendEatingHabitsOther || undefined,
          budgetLevelOther: formData.budgetLevelOther || undefined,
          shoppingFrequencyOther: formData.shoppingFrequencyOther || undefined,
          shoppingPreferencesOther: formData.shoppingPreferencesOther || undefined,
          specialtyStoresAccessOther: formData.specialtyStoresAccessOther || undefined,
          weightChangeTimelineOther: formData.weightChangeTimelineOther || undefined,
          macroPreferencesOther: formData.macroPreferencesOther || undefined,
          fiberTargetOther: formData.fiberTargetOther || undefined,
          sodiumSensitivityOther: formData.sodiumSensitivityOther || undefined,
          medicationsOther: formData.medicationsOther || undefined,
          pregnancyStatusOther: formData.pregnancyStatusOther || undefined,
          spiceToleranceOther: formData.spiceToleranceOther || undefined,
          specialOccasionsOther: formData.specialOccasionsOther || undefined,
          mealPlanFocusOther: formData.mealPlanFocusOther || undefined,
          varietyPreferenceOther: formData.varietyPreferenceOther || undefined,
          activityLevelOther: formData.activityLevelOther || undefined,
          hydrationPreferencesOther: formData.hydrationPreferencesOther || undefined,
          beveragePreferencesOther: formData.beveragePreferencesOther || undefined,
          digestiveHealthOther: formData.digestiveHealthOther || undefined,
          sleepScheduleOther: formData.sleepScheduleOther || undefined,
          stressLevelOther: formData.stressLevelOther || undefined,
          religiousDietOther: formData.religiousDietOther || undefined,
          healthConditionsOther: formData.healthConditionsOther || undefined,
        };

        console.log("Starting meal plan generation...", { planType, familyMemberId });
        
        const result = await generateMealPlan({
          planType,
          userProfile,
          options: {
            dietaryPreferences: formData.dietaryPreferences || [],
            allergies: formData.allergies || [],
            goals: [
              ...(Array.isArray(formData.healthGoal) 
                ? formData.healthGoal.map((g: string) => 
                    g === "other" && formData.healthGoalCustom 
                      ? formData.healthGoalCustom 
                      : g
                  ) 
                : []),
              ...(Array.isArray(formData.secondaryGoals) ? formData.secondaryGoals : [])
            ],
            calories: formData.calorieTarget ? parseInt(formData.calorieTarget, 10) : undefined,
          },
          familyMemberId: familyMemberId || undefined,
        });
        
        console.log("Meal plan generation result:", result);

        if (result.success && result.mealPlan?.id) {
          // Clear saved form data
          localStorage.removeItem(saveKey);
          
          setMealPlanId(result.mealPlan.id);
          setStatus("success");
          
          // Redirect to meal plan detail page after short delay
          setTimeout(() => {
            router.push(`/dashboard/plans/${result.mealPlan.id}`);
          }, 1500);
        } else {
          throw new Error("Meal plan generation failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Meal plan generation error:", err);
        
        // Extract error message safely
        let errorMessage = "Failed to generate meal plan. Please try again.";
        
        if (err && typeof err === 'object') {
          if (err.message) {
            errorMessage = err.message;
          } else if (err.error) {
            errorMessage = err.error;
          } else if (typeof err.toString === 'function') {
            errorMessage = err.toString();
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        setError(errorMessage);
        setStatus("error");
      }
    };

    generate();
  }, [planType, familyMemberId, router]);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    setProgressMessage(0);
    // Trigger re-generation by reloading the effect
    window.location.reload();
  };

  const handleGoBack = () => {
    router.push(`/generate-meal-plan?type=${planType || "daily"}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-black/40 border-white/20">
          <CardContent className="p-8">
            {status === "loading" && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <Spinner className="w-16 h-16 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Generating Your Meal Plan</h2>
                  <p className="text-gray-400 text-lg">
                    {PROGRESS_MESSAGES[progressMessage]}
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    {planType && `Creating your ${planType} meal plan...`}
                  </p>
                  {/* Estimated time based on plan type */}
                  <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      ⏱️ Estimated time:{" "}
                      {planType === "monthly" 
                        ? "3-5 minutes" 
                        : planType === "weekly" 
                        ? "2-3 minutes" 
                        : "1-2 minutes"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {planType === "weekly" || planType === "monthly"
                        ? "Larger meal plans require more time to craft personalized recipes for each day."
                        : "Please wait while we create your personalized meal plan."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Meal Plan Generated!</h2>
                  <p className="text-gray-400">
                    Your personalized meal plan is ready. Redirecting...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Generation Failed</h2>
                  <p className="text-gray-400 mb-4">{error}</p>
                  {error && error.includes("limit reached") && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
                      <p className="text-sm text-red-400">
                        You've reached your plan limit. Consider upgrading to a higher tier for more meal plans, or wait for your credits to reset.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleRetry}
                      variant="default"
                      className="bg-primary hover:bg-primary/80"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button
                      onClick={handleGoBack}
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

