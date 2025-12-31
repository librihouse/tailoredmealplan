"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QuestionnaireWizard } from "@/components/Questionnaire/QuestionnaireWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionnaireFormData } from "@/types/questionnaire";
import { generateMealPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

function GenerateMealPlanContent() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"questionnaire" | "plan-type" | "generating">("questionnaire");
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireFormData | null>(null);
  const [planType, setPlanType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [generating, setGenerating] = useState(false);
  const questionnaireCompletedRef = useRef(false);

  // #region agent log - Hypothesis A: GenerateMealPlanContent mounted
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:26',message:'GenerateMealPlanContent mounted',data:{currentLocation:location,currentPath:window.location.pathname,currentSearch:window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [location]);
  // #endregion

  // Get plan type from URL query parameter if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get("type");
    if (typeParam && ["daily", "weekly", "monthly"].includes(typeParam)) {
      setPlanType(typeParam as "daily" | "weekly" | "monthly");
    }
  }, []);

  const handleQuestionnaireComplete = useCallback((data: QuestionnaireFormData) => {
    // #region agent log - Hypothesis A: handleQuestionnaireComplete called
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:36',message:'handleQuestionnaireComplete called',data:{hasData:!!data,currentStep:step},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Prevent multiple calls using ref
    if (questionnaireCompletedRef.current) {
      // #region agent log - Hypothesis A: handleQuestionnaireComplete already completed, returning early
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:40',message:'handleQuestionnaireComplete already completed, returning early',data:{currentStep:step},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Prevent multiple calls
    if (step !== "questionnaire") {
      // #region agent log - Hypothesis A: handleQuestionnaireComplete called but step is not questionnaire
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:45',message:'handleQuestionnaireComplete called but step is not questionnaire, returning early',data:{currentStep:step},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    questionnaireCompletedRef.current = true;
    setQuestionnaireData(data);
    setStep("plan-type");
    
    // #region agent log - Hypothesis A: handleQuestionnaireComplete completed, step set to plan-type
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:54',message:'handleQuestionnaireComplete completed',data:{hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [step]);

  const handleGenerate = async () => {
    // #region agent log - Hypothesis A: handleGenerate called
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:57',message:'handleGenerate called',data:{hasQuestionnaireData:!!questionnaireData,generating,currentStep:step},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!questionnaireData) {
      // #region agent log - Hypothesis A: handleGenerate called but no questionnaire data
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:61',message:'handleGenerate called but no questionnaire data, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Prevent multiple calls
    if (generating) {
      // #region agent log - Hypothesis A: handleGenerate already generating, returning early
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:67',message:'handleGenerate already generating, returning early',data:{generating},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }

    setGenerating(true);
    setStep("generating");

    try {
      // Transform questionnaire data to userProfile format
      const userProfile = {
        age: parseInt(questionnaireData.age || "30"),
        height: parseInt(questionnaireData.height || "170"),
        currentWeight: parseFloat(questionnaireData.currentWeight || "70"),
        targetWeight: questionnaireData.targetWeight ? parseFloat(questionnaireData.targetWeight) : undefined,
        activityLevel: questionnaireData.activityLevel,
        goals: questionnaireData.healthGoal || [],
        secondaryGoals: questionnaireData.secondaryGoals || [],
        dietaryPreferences: questionnaireData.dietaryPreferences || [],
        religiousDiet: questionnaireData.religiousDiet || "none",
        dietaryRestrictions: questionnaireData.dietaryRestrictions || [],
        allergies: questionnaireData.allergies || [],
        foodIntolerances: questionnaireData.foodIntolerances || [],
        healthConditions: questionnaireData.healthConditions || [],
        medications: questionnaireData.medications || [],
        foodsLoved: questionnaireData.foodsLoved || [],
        foodsDisliked: questionnaireData.foodsDisliked || [],
        flavorPreferences: questionnaireData.flavorPreferences || [],
        spiceTolerance: questionnaireData.spiceTolerance || "",
        mealsPerDay: questionnaireData.mealsPerDay || "3",
        includeSnacks: questionnaireData.includeSnacks || "yes",
        intermittentFasting: questionnaireData.intermittentFasting || "no",
        cookingSkillLevel: questionnaireData.cookingSkillLevel || "intermediate",
        cookingTimeAvailable: questionnaireData.cookingTimeAvailable || "moderate",
        budgetLevel: questionnaireData.budgetLevel || "moderate",
        mealPlanFocus: questionnaireData.mealPlanFocus || [],
        specialDietaryNotes: questionnaireData.specialDietaryNotes || "",
      };

      const result = await generateMealPlan({
        planType,
        userProfile,
        options: {
          dietaryPreferences: questionnaireData.dietaryPreferences || [],
          allergies: questionnaireData.allergies || [],
          goals: questionnaireData.healthGoal || [],
        },
      });

      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully!",
      });

      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });

      // #region agent log - Hypothesis A: Generate successful, navigating
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:139',message:'Generate successful, navigating to meal plan',data:{hasMealPlanId:!!result.mealPlan?.id,mealPlanId:result.mealPlan?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Navigate to the new plan
      if (result.mealPlan?.id) {
        const targetPath = `/meal-plans/${result.mealPlan.id}`;
        // #region agent log - Hypothesis A: Navigating to meal plan detail
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:144',message:'Navigating to meal plan detail',data:{targetPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setLocation(targetPath);
      } else {
        // #region agent log - Hypothesis A: No meal plan ID, navigating to meal plans list
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:149',message:'No meal plan ID, navigating to meal plans list',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setLocation("/meal-plans");
      }
    } catch (error: any) {
      // #region agent log - Hypothesis A: Error in handleGenerate
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-meal-plan.tsx:153',message:'Error in handleGenerate',data:{error:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
      setStep("plan-type");
      setGenerating(false);
    }
  };

  if (step === "questionnaire") {
    return (
      <QuestionnaireWizard
        onComplete={handleQuestionnaireComplete}
        onCancel={() => setLocation("/dashboard")}
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

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white py-8">
        <div className="container max-w-screen-md px-4">
          <Card className="border-white/10 bg-gray-900/50 backdrop-blur shadow-2xl text-white">
            <CardContent className="p-6 md:p-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Choose Plan Type</h2>
                  <p className="text-gray-400 text-lg">Select the duration for your meal plan.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-300 uppercase font-bold block">Plan Duration *</Label>
                  <RadioGroup
                    value={planType}
                    onValueChange={(v) => setPlanType(v as "daily" | "weekly" | "monthly")}
                    className="grid grid-cols-1 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="daily" id="plan-daily" className="peer sr-only" />
                      <Label
                        htmlFor="plan-daily"
                        className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-6 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-bold uppercase tracking-wide text-lg mb-1">Daily Plan</div>
                          <div className="text-sm text-gray-400">One day of meals (breakfast, lunch, dinner, snacks)</div>
                        </div>
                        <Sparkles className="h-6 w-6 text-primary" />
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="weekly" id="plan-weekly" className="peer sr-only" />
                      <Label
                        htmlFor="plan-weekly"
                        className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-6 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-bold uppercase tracking-wide text-lg mb-1">Weekly Plan</div>
                          <div className="text-sm text-gray-400">7 days of complete meal planning</div>
                        </div>
                        <Sparkles className="h-6 w-6 text-primary" />
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="monthly" id="plan-monthly" className="peer sr-only" />
                      <Label
                        htmlFor="plan-monthly"
                        className="flex items-center justify-between rounded-none border border-white/20 bg-black/40 p-6 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-bold uppercase tracking-wide text-lg mb-1">Monthly Plan</div>
                          <div className="text-sm text-gray-400">30 days of comprehensive meal planning</div>
                        </div>
                        <Sparkles className="h-6 w-6 text-primary" />
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setStep("questionnaire")}
                    className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-primary hover:bg-primary/90 text-black px-10 h-12 font-bold uppercase tracking-widest rounded-none"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Meal Plan"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function GenerateMealPlan() {
  return (
    <ProtectedRoute>
      <GenerateMealPlanContent />
    </ProtectedRoute>
  );
}

