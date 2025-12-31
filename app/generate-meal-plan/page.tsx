"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QuestionnaireWizard } from "@/components/Questionnaire/QuestionnaireWizard";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionnaireFormData } from "@/types/questionnaire";
import { generateMealPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

/**
 * Generate Meal Plan Page - Next.js version
 * Renders the multi-page questionnaire for meal plan generation
 */
function GenerateMealPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"questionnaire" | "generating">("questionnaire");
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireFormData | null>(null);
  const [planType, setPlanType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [generating, setGenerating] = useState(false);
  const questionnaireCompletedRef = useRef(false);
  const generationTriggeredRef = useRef(false);

  // Get plan type from URL query parameter if present
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && ["daily", "weekly", "monthly"].includes(typeParam)) {
      setPlanType(typeParam as "daily" | "weekly" | "monthly");
    }
  }, [searchParams]);

  // Auto-trigger generation when questionnaire is completed
  useEffect(() => {
    if (questionnaireData && !generationTriggeredRef.current) {
      generationTriggeredRef.current = true;
      handleGenerate(questionnaireData);
    }
  }, [questionnaireData]);

  const handleQuestionnaireComplete = useCallback((data: QuestionnaireFormData) => {
    // Prevent multiple calls using ref
    if (questionnaireCompletedRef.current) {
      return;
    }
    
    // Prevent multiple calls
    if (step !== "questionnaire") {
      return;
    }
    
    questionnaireCompletedRef.current = true;
    setQuestionnaireData(data);
    // Don't need to set step here - the useEffect will handle generation
  }, [step]);

  const handleGenerate = async (data: QuestionnaireFormData) => {
    // Prevent multiple calls
    if (generating) {
      return;
    }

    setGenerating(true);
    setStep("generating");
    
    const questionnaireDataToUse = data;

    try {
      // Transform questionnaire data to userProfile format
      const userProfile = {
        age: parseInt(questionnaireDataToUse.age || "30"),
        height: parseInt(questionnaireDataToUse.height || "170"),
        currentWeight: parseFloat(questionnaireDataToUse.currentWeight || "70"),
        targetWeight: questionnaireDataToUse.targetWeight ? parseFloat(questionnaireDataToUse.targetWeight) : undefined,
        activityLevel: questionnaireDataToUse.activityLevel,
        goals: questionnaireDataToUse.healthGoal || [],
        secondaryGoals: questionnaireDataToUse.secondaryGoals || [],
        dietaryPreferences: questionnaireDataToUse.dietaryPreferences || [],
        religiousDiet: questionnaireDataToUse.religiousDiet || "none",
        dietaryRestrictions: questionnaireDataToUse.dietaryRestrictions || [],
        allergies: questionnaireDataToUse.allergies || [],
        foodIntolerances: questionnaireDataToUse.foodIntolerances || [],
        healthConditions: questionnaireDataToUse.healthConditions || [],
        medications: questionnaireDataToUse.medications || [],
        foodsLoved: questionnaireDataToUse.foodsLoved || [],
        foodsDisliked: questionnaireDataToUse.foodsDisliked || [],
        flavorPreferences: questionnaireDataToUse.flavorPreferences || [],
        spiceTolerance: questionnaireDataToUse.spiceTolerance || "",
        mealsPerDay: questionnaireDataToUse.mealsPerDay || "3",
        includeSnacks: questionnaireDataToUse.includeSnacks || "yes",
        intermittentFasting: questionnaireDataToUse.intermittentFasting || "no",
        cookingSkillLevel: questionnaireDataToUse.cookingSkillLevel || "intermediate",
        cookingTimeAvailable: questionnaireDataToUse.cookingTimeAvailable || "moderate",
        budgetLevel: questionnaireDataToUse.budgetLevel || "moderate",
        mealPlanFocus: questionnaireDataToUse.mealPlanFocus || [],
        specialDietaryNotes: questionnaireDataToUse.specialDietaryNotes || "",
      };

      const result = await generateMealPlan({
        planType,
        userProfile,
        options: {
          dietaryPreferences: questionnaireDataToUse.dietaryPreferences || [],
          allergies: questionnaireDataToUse.allergies || [],
          goals: questionnaireDataToUse.healthGoal || [],
        },
      });

      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully!",
      });

      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });

      // Navigate to the new plan
      if (result.mealPlan?.id) {
        router.push(`/meal-plans/${result.mealPlan.id}`);
      } else {
        router.push("/meal-plans");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
      // Reset to allow retry
      questionnaireCompletedRef.current = false;
      generationTriggeredRef.current = false;
      setStep("questionnaire");
      setGenerating(false);
    }
  };

  if (step === "questionnaire") {
    return (
      <QuestionnaireWizard
        onComplete={handleQuestionnaireComplete}
        onCancel={() => router.push("/dashboard")}
      />
    );
  }

  if (step === "generating") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <Card className="bg-gray-900/50 border-white/10 max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-primary">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-bold uppercase mb-2">Generating Your Meal Plan</h2>
                <p className="text-gray-400">
                  Our AI is analyzing your preferences and creating a personalized meal plan just for you...
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="animate-pulse">Analyzing your nutritional needs...</p>
                <p className="animate-pulse delay-75">Crafting the perfect recipes...</p>
                <p className="animate-pulse delay-150">Balancing your macros...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Fallback - should not happen, redirect to questionnaire
  return (
    <QuestionnaireWizard
      onComplete={handleQuestionnaireComplete}
      onCancel={() => router.push("/dashboard")}
    />
  );
}

export default function GenerateMealPlanPage() {
  return (
    <ProtectedRoute>
      <GenerateMealPlanContent />
    </ProtectedRoute>
  );
}

