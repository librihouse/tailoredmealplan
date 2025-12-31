"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, SkipForward } from "lucide-react";
import { QuestionnaireFormData } from "@/types/questionnaire";
import { QuestionnaireProgress } from "./QuestionnaireProgress";
import { BasicInfoPage } from "./pages/BasicInfoPage";
import { DietaryPreferencesPage } from "./pages/DietaryPreferencesPage";
import { DietaryPreferencesOptionalPage } from "./pages/DietaryPreferencesOptionalPage";
import { HealthGoalsPage } from "./pages/HealthGoalsPage";
import { AllergiesPage } from "./pages/AllergiesPage";
import { FoodPreferencesPage } from "./pages/FoodPreferencesPage";
import { MealTimingPage } from "./pages/MealTimingPage";
import { FinalDetailsPage } from "./pages/FinalDetailsPage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const TOTAL_PAGES = 8;

// Define which pages are mandatory (cannot skip)
const MANDATORY_PAGES = [2, 3, 4]; // Ethnic/Cultural, Medical, Allergies

// Define which pages are optional (can skip)
const OPTIONAL_PAGES = [1, 5, 6, 7, 8]; // Basic Info, Dietary Preferences, Food Preferences, Meal Timing, Final Details

interface QuestionnaireWizardProps {
  onComplete: (formData: QuestionnaireFormData) => void;
  onCancel?: () => void;
}

export function QuestionnaireWizard({ onComplete, onCancel }: QuestionnaireWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [skippedPages, setSkippedPages] = useState<Set<number>>(new Set());

  // Initialize form data with saved progress or defaults
  const [formData, setFormData] = useState<QuestionnaireFormData>(() => {
    if (!user) {
      return getDefaultFormData();
    }
    try {
      const saved = localStorage.getItem(`questionnaire-progress-${user.id}`);
      if (saved) {
        return { ...getDefaultFormData(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
    }
    return getDefaultFormData();
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!user) return;
    const saveProgress = () => {
      try {
        localStorage.setItem(`questionnaire-progress-${user.id}`, JSON.stringify(formData));
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    };

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, user]);

  const isPageOptional = (page: number): boolean => {
    return OPTIONAL_PAGES.includes(page);
  };

  const isPageMandatory = (page: number): boolean => {
    return MANDATORY_PAGES.includes(page);
  };

  const validatePage = (page: number): boolean => {
    switch (page) {
      case 1: // Basic Info - Optional
        return true; // Can skip
      case 2: // Ethnic/Cultural Diet - MANDATORY
        if (!formData.religiousDiet || formData.religiousDiet === "") {
          toast({
            title: "Required Field",
            description: "Please select a religious or cultural diet preference. This is required for meal plan generation.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3: // Medical Information - MANDATORY
        if (!formData.healthConditions || formData.healthConditions.length === 0) {
          toast({
            title: "Required Field",
            description: "Please select at least one option for health conditions (you can select 'None' if you have no conditions).",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 4: // Allergies - MANDATORY
        if (!formData.allergies || formData.allergies.length === 0) {
          toast({
            title: "Required Field",
            description: "Please select at least one option for allergies (you can select 'None' if you have no allergies).",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 5: // Dietary Preferences - Optional
        return true; // Can skip
      case 6: // Food Preferences - Optional
        return true; // Can skip
      case 7: // Meal Timing - Optional
        return true; // Can skip
      case 8: // Final Details - Optional
        return true; // Can skip
      default:
        return true;
    }
  };

  const nextPage = () => {
    if (validatePage(currentPage)) {
      if (currentPage < TOTAL_PAGES) {
        setCurrentPage(currentPage + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleComplete();
      }
    }
  };

  const skipPage = () => {
    if (isPageOptional(currentPage)) {
      setSkippedPages((prev) => new Set(prev).add(currentPage));
      if (currentPage < TOTAL_PAGES) {
        setCurrentPage(currentPage + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleComplete();
      }
    } else {
      toast({
        title: "Cannot Skip",
        description: "This page contains required information and cannot be skipped.",
        variant: "destructive",
      });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      // Remove from skipped pages if going back
      setSkippedPages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentPage - 1);
        return newSet;
      });
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleComplete = async () => {
    // #region agent log - Hypothesis A: handleComplete called
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuestionnaireWizard.tsx:170',message:'handleComplete called',data:{saving,currentPage,totalPages:TOTAL_PAGES},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (saving) {
      // #region agent log - Hypothesis A: handleComplete already saving, returning early
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuestionnaireWizard.tsx:173',message:'handleComplete already saving, returning early',data:{saving},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    setSaving(true);

    try {
      // Clear saved progress
      if (user) {
        localStorage.removeItem(`questionnaire-progress-${user.id}`);
      }

      // #region agent log - Hypothesis A: Calling onComplete callback
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuestionnaireWizard.tsx:186',message:'Calling onComplete callback',data:{hasFormData:!!formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Call the completion handler
      onComplete(formData);
    } catch (error: any) {
      // #region agent log - Hypothesis A: Error in handleComplete
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuestionnaireWizard.tsx:193',message:'Error in handleComplete',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      toast({
        title: "Error",
        description: error.message || "Failed to complete questionnaire. Please try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const renderPage = () => {
    // #region agent log - Hypothesis A: renderPage called
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuestionnaireWizard.tsx:192',message:'renderPage called',data:{currentPage,totalPages:TOTAL_PAGES,skippedPages:Array.from(skippedPages)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    console.log('[QuestionnaireWizard] Rendering page', currentPage, 'of', TOTAL_PAGES);
    // #endregion
    
    switch (currentPage) {
      case 1:
        return <BasicInfoPage formData={formData} setFormData={setFormData} isOptional={true} isSkipped={skippedPages.has(1)} />;
      case 2:
        return <DietaryPreferencesPage formData={formData} setFormData={setFormData} isMandatory={true} />;
      case 3:
        return <HealthGoalsPage formData={formData} setFormData={setFormData} isMandatory={true} />;
      case 4:
        return <AllergiesPage formData={formData} setFormData={setFormData} isMandatory={true} />;
      case 5:
        return <DietaryPreferencesOptionalPage formData={formData} setFormData={setFormData} isOptional={true} isSkipped={skippedPages.has(5)} />;
      case 6:
        return <FoodPreferencesPage formData={formData} setFormData={setFormData} isOptional={true} isSkipped={skippedPages.has(6)} />;
      case 7:
        return <MealTimingPage formData={formData} setFormData={setFormData} isOptional={true} isSkipped={skippedPages.has(7)} />;
      case 8:
        return <FinalDetailsPage formData={formData} setFormData={setFormData} isOptional={true} isSkipped={skippedPages.has(8)} />;
      default:
        return null;
    }
  };

  const canSkip = isPageOptional(currentPage);
  const isMandatory = isPageMandatory(currentPage);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      <div className="flex-1 container max-w-screen-md px-4 py-8 md:py-12">
        <Card className="border-white/10 bg-gray-900/50 backdrop-blur shadow-2xl text-white">
          <CardContent className="p-6 md:p-10">
            {/* Page indicator with mandatory badge */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMandatory && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Required
                  </Badge>
                )}
                {canSkip && (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    Optional
                  </Badge>
                )}
              </div>
              {skippedPages.has(currentPage) && (
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                  Skipped
                </Badge>
              )}
            </div>
            {renderPage()}
          </CardContent>
          <CardFooter className="px-6 md:px-10 pb-8 flex justify-between">
            <div className="flex gap-4">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide"
                >
                  Cancel
                </Button>
              )}
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  onClick={prevPage}
                  className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              {canSkip && (
                <Button
                  variant="outline"
                  onClick={skipPage}
                  className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide"
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
              )}
              <Button
                onClick={nextPage}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-black px-10 h-12 font-bold uppercase tracking-widest rounded-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentPage === TOTAL_PAGES ? (
                  "Complete"
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <QuestionnaireProgress currentPage={currentPage} totalPages={TOTAL_PAGES} />
    </div>
  );
}

function getDefaultFormData(): QuestionnaireFormData {
  return {
    // Basic Info
    age: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityLevel: "",
    // Health Goals
    healthGoal: [],
    healthGoalCustom: "",
    secondaryGoals: [],
    healthConditions: [],
    healthConditionsOther: "",
    medications: [],
    medicationsOther: "",
    // Dietary Preferences
    dietaryPreferences: [],
    religiousDiet: "",
    religiousDietOther: "",
    dietaryRestrictions: [],
    // Allergies
    allergies: [],
    foodIntolerances: [],
    foodIntolerancesOther: "",
    // Food Preferences
    foodsLoved: [],
    foodsDisliked: [],
    flavorPreferences: [],
    texturePreferences: [],
    spiceTolerance: "",
    // Meal Timing
    mealsPerDay: "",
    includeSnacks: "",
    intermittentFasting: "",
    intermittentFastingOther: "",
    cookingSkillLevel: "",
    cookingTimeAvailable: "",
    // Final Details
    budgetLevel: "",
    mealPlanFocus: [],
    specialDietaryNotes: "",
    // Other fields (not used in essential questionnaire but needed for type)
    calorieTarget: "",
    cuisinePreference: "",
    cuisinePreferenceOther: "",
    breakfastTime: "",
    lunchTime: "",
    dinnerTime: "",
    snackPreferences: [],
    snackPreferencesOther: "",
    mealSource: "",
    cookingMethods: [],
    mealPrepPreference: "",
    kitchenEquipment: [],
    restaurantTypes: [],
    deliveryServices: [],
    orderingBudget: "",
    orderingFrequency: "",
    mealPrepServices: [],
    typicalDaySchedule: "",
    workSchedule: "",
    lunchLocation: "",
    dinnerLocation: "",
    weekendEatingHabits: "",
    shoppingFrequency: "",
    shoppingPreferences: [],
    specialtyStoresAccess: "",
    weightChangeTimeline: "",
    macroPreferences: "",
    customMacros: { protein: 0, carbs: 0, fat: 0 },
    fiberTarget: "",
    sodiumSensitivity: "",
    pregnancyStatus: "",
    recentSurgeries: "",
    culturalBackground: "",
    culturalBackgroundOther: "",
    traditionalFoodsToInclude: "",
    foodsFromCultureToAvoid: "",
    specialOccasions: "",
    varietyPreference: "",
    bodyFatGoal: "",
    muscleMassGoal: "",
    hydrationPreferences: "",
    waterIntake: "",
    beveragePreferences: [],
    digestiveHealth: [],
    sleepSchedule: "",
    stressLevel: "",
    previousDietHistory: "",
    whatWorkedBefore: "",
    whatDidntWorkBefore: "",
  };
}
