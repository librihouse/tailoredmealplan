"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { generateMealPlan, getQuota, getUserProfile, getFamilyMembers } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CalorieGuidance } from "@/components/CalorieGuidance";
import { shouldHideFood, filterFoods } from "@/utils/foodFiltering";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { UniformSingleSelect } from "@/components/questionnaire/UniformSingleSelect";
import { UniformMultiSelect } from "@/components/questionnaire/UniformMultiSelect";
import { UniformTextInput } from "@/components/questionnaire/UniformTextInput";
import * as QuestionnaireConfig from "@/config/questionnaireConfig";
import { updateSingleField, updateArrayField, handleNoneOption } from "@/utils/questionnaireHelpers";

// Credit costs: daily=1, weekly=2, monthly=4
const getCreditsRequired = (type: "daily" | "weekly" | "monthly") => {
  return type === "daily" ? 1 : type === "weekly" ? 2 : 4;
};

// Expanded dietary options
const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian",
  "pescatarian",
  "keto",
  "paleo",
  "mediterranean",
  "low-carb",
  "low-fat",
  "high-protein",
  "whole30",
  "dash",
  "flexitarian",
];

const RELIGIOUS_DIET_OPTIONS = [
  { value: "none", label: "None" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "jain", label: "Jain Vegetarian" },
  { value: "hindu", label: "Hindu Vegetarian" },
  { value: "buddhist", label: "Buddhist Vegetarian" },
  { value: "sattvic", label: "Sattvic" },
  { value: "other", label: "Other" },
];

const DIETARY_RESTRICTIONS = [
  "no-restrictions",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "soy-free",
  "egg-free",
  "shellfish-free",
];

const FOOD_INTOLERANCES = [
  "none",
  "lactose",
  "fodmap",
  "histamine",
  "sulfites",
  "msg",
  "other",
];

const HEALTH_GOALS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "maintain", label: "Maintain Weight" },
  { value: "gain_weight", label: "Gain Weight" },
  { value: "health", label: "General Health" },
  { value: "custom", label: "Custom" },
];

const SECONDARY_GOALS = [
  "improve_energy",
  "better_sleep",
  "digestive_health",
  "heart_health",
  "brain_health",
  "immune_support",
  "athletic_performance",
  "post_surgery",
  "pregnancy_nutrition",
  "menopause_support",
];

const ALLERGY_OPTIONS = [
  "none",
  "nuts",
  "peanuts",
  "shellfish",
  "fish",
  "eggs",
  "milk",
  "wheat",
  "gluten",
  "soy",
  "sesame",
  "celery",
  "mustard",
  "sulfites",
];

const CUISINE_OPTIONS = [
  "Mediterranean",
  "Asian",
  "Indian",
  "Chinese",
  "Japanese",
  "Thai",
  "Mexican",
  "American",
  "Italian",
  "French",
  "Middle Eastern",
  "African",
  "Latin American",
  "European",
  "Other",
];

const MEALS_PER_DAY = [
  { value: "3", label: "3 meals" },
  { value: "4", label: "4 meals" },
  { value: "5", label: "5 meals" },
  { value: "6", label: "6+ meals" },
];


export default function CreatePlanPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(null);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  // Track which categories have "other" selected (even if text field is empty)
  const [otherSelectedCategories, setOtherSelectedCategories] = useState<Set<string>>(new Set());
  
  // Get planType safely (with fallback)
  const planType = (params?.type as "daily" | "weekly" | "monthly") || "daily";

  // Expanded form data state
  const [formData, setFormData] = useState({
    // Section 1: Basic Dietary Information
    dietaryPreferences: [] as string[],
    dietaryPreferencesOther: "",
    religiousDiet: "",
    religiousDietOther: "",
    dietaryRestrictions: [] as string[],
    dietaryRestrictionsOther: "",
    foodIntolerances: [] as string[],
    foodIntolerancesOther: "",
    healthGoal: [] as string[],
    healthGoalCustom: "",
    secondaryGoals: [] as string[],
    secondaryGoalsOther: "",
    allergies: [] as string[],
    allergiesOther: "",
    calorieTarget: "",
    cuisinePreference: "",
    cuisinePreferenceOther: "",
    
    // Section 2: Meal Timing & Frequency
    mealsPerDay: "",
    mealsPerDayOther: "",
    includeSnacks: "",
    includeSnacksOther: "",
    breakfastTime: "",
    lunchTime: "",
    dinnerTime: "",
    snackPreferences: [] as string[],
    snackPreferencesOther: "",
    intermittentFasting: "",
    intermittentFastingOther: "",
    
    // Section 3: Food Preferences
    foodsLoved: [] as string[],
    foodsLovedProteinsOther: "",
    foodsLovedGrainsOther: "",
    foodsLovedVegetablesOther: "",
    foodsLovedFruitsOther: "",
    foodsLovedDairyOther: "",
    foodsDisliked: [] as string[],
    foodsDislikedOther: "",
    flavorPreferences: [] as string[],
    flavorPreferencesOther: "",
    texturePreferences: [] as string[],
    texturePreferencesOther: "",
    
    // Section 4: Cooking & Preparation
    mealSource: "", // "cook", "order", "both", "meal_prep_services"
    mealSourceOther: "",
    cookingSkillLevel: "",
    cookingSkillLevelOther: "",
    cookingTimeAvailable: "",
    cookingTimeAvailableOther: "",
    cookingMethods: [] as string[],
    cookingMethodsOther: "",
    mealPrepPreference: "",
    mealPrepPreferenceOther: "",
    kitchenEquipment: [] as string[],
    kitchenEquipmentOther: "",
    // Ordering preferences
    restaurantTypes: [] as string[],
    restaurantTypesOther: "",
    deliveryServices: [] as string[],
    deliveryServicesOther: "",
    orderingBudget: "",
    orderingBudgetOther: "",
    orderingFrequency: "",
    orderingFrequencyOther: "",
    mealPrepServices: [] as string[],
    mealPrepServicesOther: "",
    
    // Section 5: Lifestyle & Schedule
    typicalDaySchedule: "",
    typicalDayScheduleOther: "",
    workSchedule: "",
    workScheduleOther: "",
    lunchLocation: "",
    lunchLocationOther: "",
    dinnerLocation: "",
    dinnerLocationOther: "",
    weekendEatingHabits: "",
    weekendEatingHabitsOther: "",
    
    // Section 6: Budget & Shopping
    budgetLevel: "",
    budgetLevelOther: "",
    shoppingFrequency: "",
    shoppingFrequencyOther: "",
    shoppingPreferences: [] as string[],
    shoppingPreferencesOther: "",
    specialtyStoresAccess: "",
    specialtyStoresAccessOther: "",
    
    // Section 7: Health & Nutrition Details
    weightChangeTimeline: "",
    weightChangeTimelineOther: "",
    macroPreferences: "",
    macroPreferencesOther: "",
    customMacros: { protein: 30, carbs: 40, fat: 30 },
    fiberTarget: "",
    fiberTargetOther: "",
    sodiumSensitivity: "",
    sodiumSensitivityOther: "",
    
    // Section 8: Medical & Health Conditions
    healthConditions: [] as string[],
    healthConditionsOther: "",
    medications: [] as string[],
    medicationsOther: "",
    pregnancyStatus: "",
    pregnancyStatusOther: "",
    recentSurgeries: "",
    
    // Section 9: Cultural & Regional Preferences
    culturalBackground: "",
    culturalBackgroundOther: "",
    traditionalFoodsToInclude: "",
    foodsFromCultureToAvoid: "",
    spiceTolerance: "",
    spiceToleranceOther: "",
    
    // Section 10: Special Requests & Notes
    specialOccasions: "",
    specialOccasionsOther: "",
    specialDietaryNotes: "",
    mealPlanFocus: [] as string[],
    mealPlanFocusOther: "",
    varietyPreference: "",
    varietyPreferenceOther: "",
    
    // NEW: Dietitian-Critical Fields
    activityLevel: "",
    activityLevelOther: "",
    currentWeight: "",
    height: "",
    bodyFatGoal: "",
    muscleMassGoal: "",
    hydrationPreferences: "",
    hydrationPreferencesOther: "",
    waterIntake: "",
    beveragePreferences: [] as string[],
    beveragePreferencesOther: "",
    digestiveHealth: [] as string[],
    digestiveHealthOther: "",
    sleepSchedule: "",
    sleepScheduleOther: "",
    stressLevel: "",
    stressLevelOther: "",
    previousDietHistory: "",
    whatWorkedBefore: "",
    whatDidntWorkBefore: "",
  });

  const [generating, setGenerating] = useState(false);

  // Helper function to filter foods based on dietary preferences
  // Updated to work with SelectOption arrays
  const getFilteredFoodOptions = (foodOptions: QuestionnaireConfig.SelectOption[]) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:319',message:'getFilteredFoodOptions entry',data:{foodOptions:foodOptions,isUndefined:foodOptions===undefined,isArray:Array.isArray(foodOptions)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (showAllFoods) return foodOptions;
    
    const filters = {
      dietaryPreferences: formData.dietaryPreferences || [],
      dietaryRestrictions: formData.dietaryRestrictions || [],
      allergies: formData.allergies || [],
      foodIntolerances: formData.foodIntolerances || [],
      religiousDiet: formData.religiousDiet || "",
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:328',message:'filters object created',data:{dietaryPreferences:formData.dietaryPreferences,isUndefined:formData.dietaryPreferences===undefined,isArray:Array.isArray(formData.dietaryPreferences),dietaryRestrictions:formData.dietaryRestrictions,isUndefinedRestrictions:formData.dietaryRestrictions===undefined,allergies:formData.allergies,isUndefinedAllergies:formData.allergies===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:330',message:'before filter call',data:{foodOptions:foodOptions,isUndefined:foodOptions===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return foodOptions.filter(option => !shouldHideFood(option.value, filters));
  };

  // Helper function to create category-specific onChange handler for foodsLoved
  const createCategoryFoodsHandler = (categoryOptions: QuestionnaireConfig.SelectOption[], otherField: keyof typeof formData) => {
    const categoryValues = categoryOptions.map(opt => opt.value);
    return (values: string[]) => {
      // Track if "other" is selected for this category
      if (values.includes("other")) {
        setOtherSelectedCategories(prev => new Set([...prev, otherField]));
      } else {
        setOtherSelectedCategories(prev => {
          const newSet = new Set(prev);
          newSet.delete(otherField);
          return newSet;
        });
      }
      setFormData((prev) => {
        // Remove all items from this category, then add the new selections
        const otherFoods = prev.foodsLoved.filter(f => !categoryValues.includes(f));
        const updatedFoods = [...otherFoods, ...values.filter(v => v !== "other")];
        // Handle "other" field - preserve existing value if "other" is selected, clear if not
        const otherValue = values.includes("other") ? (prev[otherField] as string) : "";
        return { 
          ...prev, 
          foodsLoved: updatedFoods,
          [otherField]: otherValue,
        };
      });
    };
  };

  // Helper function to get category-specific values from foodsLoved
  // Takes the original category options (not filtered) to determine which values belong
  const getCategoryFoods = (originalCategoryOptions: QuestionnaireConfig.SelectOption[], otherFieldKey?: keyof typeof formData) => {
    const categoryValues = originalCategoryOptions.map(opt => opt.value);
    const categoryFoods = formData.foodsLoved.filter(f => categoryValues.includes(f));
    // Include "other" if: (1) otherField has a value, OR (2) "other" was explicitly selected for this category
    const hasOtherValue = otherFieldKey && formData[otherFieldKey] && (formData[otherFieldKey] as string).trim() !== "";
    const isOtherSelected = otherFieldKey && otherSelectedCategories.has(otherFieldKey);
    const shouldIncludeOther = hasOtherValue || isOtherSelected;
    return shouldIncludeOther ? [...categoryFoods, "other"] : categoryFoods;
  };

  // Fetch quota to check credits
  const { data: quota } = useQuery({
    queryKey: ["quota"],
    queryFn: getQuota,
  });

  // Fetch user profile for pre-filling
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
    enabled: !!user && !familyMemberId,
  });

  // Fetch family members if needed
  const { data: familyData } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: getFamilyMembers,
    enabled: !!user,
  });

  // Check if user has family plan
  const isFamilyPlan = familyData?.members && familyData.members.length > 0;

  // Get credits required for this plan type
  const creditsRequired = getCreditsRequired(planType);
  const hasEnoughCredits = quota?.credits 
    ? (quota.credits.limit - quota.credits.used) >= creditsRequired
    : false;

  // Auto-save form progress to localStorage
  useEffect(() => {
    const saveKey = `mealPlanForm_${planType}_${familyMemberId || 'main'}`;
    localStorage.setItem(saveKey, JSON.stringify({ formData }));
  }, [formData, planType, familyMemberId]);

  // Load saved progress from localStorage (only on mount)
  useEffect(() => {
    if (hasLoadedFromStorage) return; // Only load once
    
    const saveKey = `mealPlanForm_${planType}_${familyMemberId || 'main'}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
        setHasLoadedFromStorage(true);
      } catch (e) {
        // Ignore parse errors
        setHasLoadedFromStorage(true);
      }
    } else {
      setHasLoadedFromStorage(true);
    }
  }, [planType, familyMemberId, hasLoadedFromStorage]);

  // Pre-fill form with saved profile data (only if fields are empty)
  useEffect(() => {
    if (profileData?.profile && !familyMemberId) {
      setFormData((prev) => {
        // Only pre-fill religiousDiet if profile has a non-empty, non-"none" value
        // Treat "none" from profile as empty to avoid pre-selecting
        const profileReligious = profileData.profile.religious;
        const newReligiousDiet = prev.religiousDiet === "" || prev.religiousDiet === "none"
          ? (profileReligious && profileReligious !== "none" ? profileReligious : "")
          : prev.religiousDiet;
        return {
          ...prev,
          // Only pre-fill if current value is empty/default
          dietaryPreferences: prev.dietaryPreferences.length === 0 
            ? (profileData.profile.diet || [])
            : prev.dietaryPreferences,
          healthGoal: prev.healthGoal.length === 0
            ? (Array.isArray(profileData.profile.goal) 
                ? profileData.profile.goal 
                : profileData.profile.goal 
                  ? [profileData.profile.goal] 
                  : [])
            : prev.healthGoal,
          allergies: prev.allergies.length === 0
            ? (profileData.profile.allergies || [])
            : prev.allergies,
          religiousDiet: newReligiousDiet,
          healthConditions: prev.healthConditions.length === 0
            ? (profileData.profile.conditions || [])
            : prev.healthConditions,
        };
      });
    }
  }, [profileData, familyMemberId]);

  // Wait for params to be available
  if (!params || !params.type) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Validate plan type
  if (!["daily", "weekly", "monthly"].includes(planType)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Plan Type</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate overall completion percentage
  const calculateCompletion = (): number => {
    const totalFields = 30; // Approximate total number of important fields
    let completedFields = 0;

    // Step 1 fields
    if (formData.dietaryPreferences.length > 0) completedFields++;
    if (formData.religiousDiet) completedFields++;
    if (formData.dietaryRestrictions.length > 0) completedFields++;
    if (formData.foodIntolerances.length > 0) completedFields++;
    if (formData.healthGoal.length > 0) completedFields++;
    if (formData.allergies.length > 0) completedFields++;
    if (formData.cuisinePreference) completedFields++;

    // Step 2 fields
    if (formData.mealsPerDay) completedFields++;
    if (formData.includeSnacks) completedFields++;
    if (formData.breakfastTime) completedFields++;
    if (formData.lunchTime) completedFields++;
    if (formData.dinnerTime) completedFields++;
    if (formData.intermittentFasting) completedFields++;
    if (formData.foodsLoved.length > 0) completedFields++;
    if (formData.mealSource) completedFields++;
    if (formData.cookingSkillLevel) completedFields++;
    if (formData.cookingTimeAvailable) completedFields++;

    // Step 3 fields
    if (formData.typicalDaySchedule) completedFields++;
    if (formData.workSchedule) completedFields++;
    if (formData.lunchLocation) completedFields++;
    if (formData.dinnerLocation) completedFields++;
    if (formData.budgetLevel) completedFields++;
    if (formData.shoppingFrequency) completedFields++;
    if (formData.weightChangeTimeline) completedFields++;
    if (formData.macroPreferences) completedFields++;

    // Step 4 fields
    if (formData.culturalBackground) completedFields++;
    if (formData.spiceTolerance) completedFields++;
    if (formData.varietyPreference) completedFields++;

    return Math.min(Math.round((completedFields / totalFields) * 100), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (generating) {
      return;
    }

    // Frontend credit validation
    if (!hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsRequired} credits to create a ${planType} plan. You have ${quota?.credits ? (quota.credits.limit - quota.credits.used) : 0} credits remaining. Please upgrade your plan.`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.healthGoal || formData.healthGoal.length === 0) {
      toast({
        title: "Health Goal Required",
        description: "Please select at least one health goal.",
        variant: "destructive",
      });
      // Scroll to health goal section
      const healthGoalElement = document.querySelector('[data-section="health-goal"]');
      if (healthGoalElement) {
        healthGoalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // If "custom" is selected, require custom text
    if (formData.healthGoal.includes("other") && !formData.healthGoalCustom.trim()) {
      toast({
        title: "Custom Goal Required",
        description: "Please specify your custom health goal.",
        variant: "destructive",
      });
      // Scroll to health goal section
      const healthGoalElement = document.querySelector('[data-section="health-goal"]');
      if (healthGoalElement) {
        healthGoalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setGenerating(true);

    try {
      // Save form data to localStorage for the loading page to retrieve
      const saveKey = `mealPlanForm_${planType}_${familyMemberId || 'main'}`;
      localStorage.setItem(saveKey, JSON.stringify(formData));

      // Navigate to loading page instead of calling API directly
      const targetUrl = `/dashboard/generating?planType=${planType}${familyMemberId ? `&familyMemberId=${familyMemberId}` : ''}`;
      
      // Navigate immediately - use window.location for more reliable navigation
      // router.push can sometimes fail silently in Next.js, so we use window.location as primary
      window.location.href = targetUrl;
    } catch (error: any) {
      setGenerating(false);
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start meal plan generation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-white hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="font-heading text-4xl font-bold uppercase mb-2">
            Create {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
          </h1>
          <p className="text-gray-400">
            {planType === "daily" && "1 credit"}
            {planType === "weekly" && "2 credits"}
            {planType === "monthly" && "4 credits"}
            {" • "}
            {quota?.credits && (
              <span className={cn(
                hasEnoughCredits ? "text-primary" : "text-red-400"
              )}>
                {quota.credits.limit - quota.credits.used} credits remaining
              </span>
            )}
          </p>
        </div>

        {/* Credit Warning */}
        {!hasEnoughCredits && (
          <Card className="bg-red-500/10 border-red-500/30 mb-6">
            <CardContent className="p-4">
              <p className="text-red-400 font-medium">
                Insufficient credits. You need {creditsRequired} credits to create this plan.
              </p>
              <Link href="/pricing" className="mt-2 inline-block">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-black">
                  Upgrade Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Family Member Selector */}
        {isFamilyPlan && (
          <Card className="bg-gray-900/50 border-white/10 mb-6">
            <CardContent className="p-4">
              <Label className="text-white mb-2 block">Select Family Member</Label>
              <select
                value={familyMemberId || ""}
                onChange={(e) => setFamilyMemberId(e.target.value || null)}
                className="w-full bg-black/40 border-white/20 text-white rounded-md px-3 py-2"
              >
                <option value="">My Plan</option>
                {familyData?.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Questionnaire Progress</span>
            <span className="text-sm text-gray-400">{calculateCompletion()}% Complete</span>
          </div>
          <div className="w-full bg-gray-900/50 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${calculateCompletion()}%` }}
            />
          </div>
        </div>

        {/* Single Page Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Basic Dietary Information */}
          <div className="space-y-8">
            <div className="mb-6 pb-4 border-b border-primary/30">
              <h2 className="text-2xl font-bold text-white mb-2">Step 1: Basic Dietary Information</h2>
              <p className="text-gray-400 text-sm">Tell us about your dietary preferences and health goals</p>
            </div>
              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Dietary Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.dietaryPreferences}
                    onChange={(values) => setFormData((prev) => ({
                      ...prev,
                      dietaryPreferences: values,
                      dietaryPreferencesOther: values.includes("other") ? prev.dietaryPreferencesOther : "",
                    }))}
                    options={QuestionnaireConfig.DIETARY_PREFERENCES}
                    allowOther={true}
                    otherValue={formData.dietaryPreferencesOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, dietaryPreferencesOther: value }))}
                    otherPlaceholder="Please specify other dietary preference..."
                    gridCols="auto"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Religious/Cultural Diet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformSingleSelect
                    value={formData.religiousDiet}
                    onChange={(value) => setFormData((prev) => ({
                      ...prev,
                      religiousDiet: value,
                      religiousDietOther: value === "other" ? prev.religiousDietOther : "",
                    }))}
                    options={QuestionnaireConfig.RELIGIOUS_DIET_OPTIONS}
                    allowOther={true}
                    otherValue={formData.religiousDietOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, religiousDietOther: value }))}
                    otherPlaceholder="Please specify your religious/cultural diet..."
                    gridCols="4"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Dietary Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.dietaryRestrictions}
                    onChange={(values) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:903',message:'dietaryRestrictions onChange',data:{values:values,isUndefined:values===undefined,isArray:Array.isArray(values)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                      // #endregion
                      if (values.includes("no-restrictions")) {
                        setFormData((prev) => ({
                          ...prev,
                          dietaryRestrictions: ["no-restrictions"],
                          dietaryRestrictionsOther: "",
                        }));
                      } else {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:890',message:'before values.filter dietaryRestrictions',data:{values:values,isUndefined:values===undefined,isArray:Array.isArray(values)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        const withoutNone = values.filter((v) => v !== "no-restrictions");
                        setFormData((prev) => ({
                          ...prev,
                          dietaryRestrictions: withoutNone,
                          dietaryRestrictionsOther: values.includes("other") ? prev.dietaryRestrictionsOther : "",
                        }));
                      }
                    }}
                    options={QuestionnaireConfig.DIETARY_RESTRICTIONS}
                    allowNone={true}
                    noneValue="no-restrictions"
                    allowOther={true}
                    otherValue={formData.dietaryRestrictionsOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, dietaryRestrictionsOther: value }))}
                    otherPlaceholder="Please specify other dietary restriction..."
                    gridCols="3"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Food Intolerances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.foodIntolerances}
                    onChange={(values) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:938',message:'foodIntolerances onChange',data:{values:values,isUndefined:values===undefined,isArray:Array.isArray(values)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                      // #endregion
                      if (values.includes("none")) {
                        setFormData((prev) => ({
                          ...prev,
                          foodIntolerances: ["none"],
                          foodIntolerancesOther: "",
                        }));
                      } else {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:925',message:'before values.filter foodIntolerances',data:{values:values,isUndefined:values===undefined,isArray:Array.isArray(values)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        const withoutNone = values.filter((v) => v !== "none");
                        setFormData((prev) => ({ ...prev, foodIntolerances: withoutNone }));
                      }
                    }}
                    options={QuestionnaireConfig.FOOD_INTOLERANCES}
                    allowNone={true}
                    noneValue="none"
                    allowOther={true}
                    otherValue={formData.foodIntolerancesOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodIntolerancesOther: value }))}
                    otherPlaceholder="Please specify your food intolerance..."
                    gridCols="3"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6" data-section="health-goal">
                <CardHeader>
                  <CardTitle className="text-white">Health Goal *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.healthGoal}
                    onChange={(values) => setFormData((prev) => ({
                      ...prev,
                      healthGoal: values,
                      healthGoalCustom: values.includes("other") ? prev.healthGoalCustom : "",
                    }))}
                    options={QuestionnaireConfig.HEALTH_GOALS}
                    allowOther={true}
                    otherValue={formData.healthGoalCustom}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, healthGoalCustom: value }))}
                    otherPlaceholder="Please specify your custom health goal..."
                    gridCols="3"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Secondary Goals (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.secondaryGoals}
                    onChange={(values) => setFormData((prev) => ({
                      ...prev,
                      secondaryGoals: values,
                      secondaryGoalsOther: values.includes("other") ? prev.secondaryGoalsOther : "",
                    }))}
                    options={QuestionnaireConfig.SECONDARY_GOALS}
                    allowOther={true}
                    otherValue={formData.secondaryGoalsOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, secondaryGoalsOther: value }))}
                    otherPlaceholder="Please specify other secondary goal..."
                    gridCols="3"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Allergies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformMultiSelect
                    values={formData.allergies}
                    onChange={(values) => {
                      if (values.includes("none")) {
                        setFormData((prev) => ({ 
                          ...prev, 
                          allergies: ["none"],
                          allergiesOther: "", // Clear other when "none" is selected
                        }));
                      } else {
                        const withoutNone = values.filter((v) => v !== "none");
                        setFormData((prev) => ({ 
                          ...prev, 
                          allergies: withoutNone,
                          allergiesOther: values.includes("other") ? prev.allergiesOther : "", // Preserve or clear other value
                        }));
                      }
                    }}
                    options={QuestionnaireConfig.ALLERGY_OPTIONS}
                    allowNone={true}
                    noneValue="none"
                    allowOther={true}
                    otherValue={formData.allergiesOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, allergiesOther: value }))}
                    otherPlaceholder="Please specify other allergy..."
                    gridCols="auto"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Cuisine Preference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UniformSingleSelect
                    value={formData.cuisinePreference}
                    onChange={(value) => setFormData((prev) => ({
                      ...prev,
                      cuisinePreference: value,
                      cuisinePreferenceOther: value === "Other" ? prev.cuisinePreferenceOther : "",
                    }))}
                    options={QuestionnaireConfig.CUISINE_OPTIONS}
                    allowOther={true}
                    otherValue={formData.cuisinePreferenceOther}
                    onOtherChange={(value) => setFormData((prev) => ({ ...prev, cuisinePreferenceOther: value }))}
                    otherPlaceholder="Please specify your cuisine preference..."
                    gridCols="4"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Calorie Target (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Input
                    type="number"
                    value={formData.calorieTarget}
                    onChange={(e) => setFormData({ ...formData, calorieTarget: e.target.value })}
                    placeholder="e.g., 2000"
                    className="bg-black/40 border-white/20 text-white"
                    min="800"
                    max="5000"
                  />
                  <CalorieGuidance
                    healthGoals={formData.healthGoal}
                    calorieTarget={formData.calorieTarget}
                    onCalorieChange={(value) => setFormData({ ...formData, calorieTarget: value })}
                    age={profileData?.profile?.age}
                    weight={profileData?.profile?.current_weight}
                    height={profileData?.profile?.height}
                    activity={profileData?.profile?.activity}
                  />
                  <p className="text-xs text-gray-400">
                    Leave empty to calculate automatically based on your profile
                  </p>
                </CardContent>
              </Card>
          </div>

          {/* Section 2: Meal Timing, Food Preferences & Cooking */}
          <div className="space-y-8">
            <div className="mb-6 pb-4 border-b border-primary/30">
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Meal Timing, Food Preferences & Cooking</h2>
              <p className="text-gray-400 text-sm">Help us understand your meal schedule and cooking preferences</p>
            </div>
              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Meal Timing & Frequency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.mealsPerDay}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        mealsPerDay: value,
                        mealsPerDayOther: value === "other" ? prev.mealsPerDayOther : "",
                      }))}
                      options={QuestionnaireConfig.MEALS_PER_DAY}
                      label="Meals per day"
                      allowOther={true}
                      otherValue={formData.mealsPerDayOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, mealsPerDayOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.includeSnacks}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        includeSnacks: value,
                        includeSnacksOther: value === "other" ? prev.includeSnacksOther : "",
                      }))}
                      options={QuestionnaireConfig.INCLUDE_SNACKS}
                      label="Include snacks?"
                      allowOther={true}
                      otherValue={formData.includeSnacksOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, includeSnacksOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="3"
                    />
                  </div>

                  {formData.includeSnacks !== "no" && formData.includeSnacks !== "other" && (
                    <div>
                      <UniformMultiSelect
                        values={formData.snackPreferences}
                        onChange={(values) => setFormData((prev) => ({
                          ...prev,
                          snackPreferences: values,
                          snackPreferencesOther: values.includes("other") ? prev.snackPreferencesOther : "",
                        }))}
                        options={QuestionnaireConfig.SNACK_PREFERENCES}
                        label="Snack preferences"
                        allowOther={true}
                        otherValue={formData.snackPreferencesOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, snackPreferencesOther: value }))}
                        otherPlaceholder="Please specify other snack preference..."
                        gridCols="2"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Breakfast time</Label>
                      <input
                        type="time"
                        value={formData.breakfastTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, breakfastTime: e.target.value }))}
                        className="w-full bg-gray-700/60 border border-white/30 text-white rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-150"
                        style={{
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Lunch time</Label>
                      <input
                        type="time"
                        value={formData.lunchTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lunchTime: e.target.value }))}
                        className="w-full bg-gray-700/60 border border-white/30 text-white rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-150"
                        style={{
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Dinner time</Label>
                      <input
                        type="time"
                        value={formData.dinnerTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dinnerTime: e.target.value }))}
                        className="w-full bg-gray-700/60 border border-white/30 text-white rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-150"
                        style={{
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.intermittentFasting}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        intermittentFasting: value,
                        intermittentFastingOther: value === "other" ? prev.intermittentFastingOther : "",
                      }))}
                      options={QuestionnaireConfig.INTERMITTENT_FASTING}
                      label="Intermittent fasting"
                      allowOther={true}
                      otherValue={formData.intermittentFastingOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, intermittentFastingOther: value }))}
                      otherPlaceholder="Please specify your intermittent fasting schedule..."
                      gridCols="auto"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Food Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white block">Foods you love</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllFoods(!showAllFoods)}
                      className="text-primary hover:text-primary/80 text-xs"
                    >
                      {showAllFoods ? "Show Recommended Only" : "Show All Options"}
                    </Button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <UniformMultiSelect
                        values={getCategoryFoods(QuestionnaireConfig.FOOD_LIKES_PROTEINS, "foodsLovedProteinsOther")}
                        onChange={createCategoryFoodsHandler(QuestionnaireConfig.FOOD_LIKES_PROTEINS, "foodsLovedProteinsOther")}
                        options={getFilteredFoodOptions(QuestionnaireConfig.FOOD_LIKES_PROTEINS)}
                        label="Proteins"
                        allowOther={true}
                        otherValue={formData.foodsLovedProteinsOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsLovedProteinsOther: value }))}
                        otherPlaceholder="Please specify other protein..."
                        gridCols="auto"
                      />
                    </div>
                    <div>
                      <UniformMultiSelect
                        values={getCategoryFoods(QuestionnaireConfig.FOOD_LIKES_GRAINS, "foodsLovedGrainsOther")}
                        onChange={createCategoryFoodsHandler(QuestionnaireConfig.FOOD_LIKES_GRAINS, "foodsLovedGrainsOther")}
                        options={getFilteredFoodOptions(QuestionnaireConfig.FOOD_LIKES_GRAINS)}
                        label="Grains"
                        allowOther={true}
                        otherValue={formData.foodsLovedGrainsOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsLovedGrainsOther: value }))}
                        otherPlaceholder="Please specify other grain..."
                        gridCols="auto"
                      />
                    </div>
                    <div>
                      <UniformMultiSelect
                        values={getCategoryFoods(QuestionnaireConfig.FOOD_LIKES_VEGETABLES, "foodsLovedVegetablesOther")}
                        onChange={createCategoryFoodsHandler(QuestionnaireConfig.FOOD_LIKES_VEGETABLES, "foodsLovedVegetablesOther")}
                        options={getFilteredFoodOptions(QuestionnaireConfig.FOOD_LIKES_VEGETABLES)}
                        label="Vegetables"
                        allowOther={true}
                        otherValue={formData.foodsLovedVegetablesOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsLovedVegetablesOther: value }))}
                        otherPlaceholder="Please specify other vegetable..."
                        gridCols="auto"
                      />
                    </div>
                    <div>
                      <UniformMultiSelect
                        values={getCategoryFoods(QuestionnaireConfig.FOOD_LIKES_FRUITS, "foodsLovedFruitsOther")}
                        onChange={createCategoryFoodsHandler(QuestionnaireConfig.FOOD_LIKES_FRUITS, "foodsLovedFruitsOther")}
                        options={getFilteredFoodOptions(QuestionnaireConfig.FOOD_LIKES_FRUITS)}
                        label="Fruits"
                        allowOther={true}
                        otherValue={formData.foodsLovedFruitsOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsLovedFruitsOther: value }))}
                        otherPlaceholder="Please specify other fruit..."
                        gridCols="auto"
                      />
                    </div>
                    <div>
                      <UniformMultiSelect
                        values={getCategoryFoods(QuestionnaireConfig.FOOD_LIKES_DAIRY, "foodsLovedDairyOther")}
                        onChange={createCategoryFoodsHandler(QuestionnaireConfig.FOOD_LIKES_DAIRY, "foodsLovedDairyOther")}
                        options={getFilteredFoodOptions(QuestionnaireConfig.FOOD_LIKES_DAIRY)}
                        label="Dairy"
                        allowOther={true}
                        otherValue={formData.foodsLovedDairyOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsLovedDairyOther: value }))}
                        otherPlaceholder="Please specify other dairy product..."
                        gridCols="auto"
                      />
                    </div>
                  </div>

                  <CollapsibleSection
                    title="Foods you dislike/avoid"
                    defaultOpen={false}
                  >
                    <UniformMultiSelect
                      values={formData.foodsDisliked}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        foodsDisliked: values,
                        foodsDislikedOther: values.includes("other") ? prev.foodsDislikedOther : "",
                      }))}
                      options={QuestionnaireConfig.ALL_FOODS}
                      allowOther={true}
                      otherValue={formData.foodsDislikedOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, foodsDislikedOther: value }))}
                      otherPlaceholder="Please specify other food to avoid..."
                      gridCols="auto"
                    />
                  </CollapsibleSection>

                  <div>
                    <UniformMultiSelect
                      values={formData.flavorPreferences}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        flavorPreferences: values,
                        flavorPreferencesOther: values.includes("other") ? prev.flavorPreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.FLAVOR_PREFERENCES}
                      label="Flavor preferences"
                      allowOther={true}
                      otherValue={formData.flavorPreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, flavorPreferencesOther: value }))}
                      otherPlaceholder="Please specify other flavor preference..."
                      gridCols="4"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.texturePreferences}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        texturePreferences: values,
                        texturePreferencesOther: values.includes("other") ? prev.texturePreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.TEXTURE_PREFERENCES}
                      label="Texture preferences"
                      allowOther={true}
                      otherValue={formData.texturePreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, texturePreferencesOther: value }))}
                      otherPlaceholder="Please specify other texture preference..."
                      gridCols="auto"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Cooking & Preparation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.mealSource}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        mealSource: value,
                        mealSourceOther: value === "other" ? prev.mealSourceOther : "",
                      }))}
                      options={QuestionnaireConfig.MEAL_SOURCE}
                      label="How do you get your meals? *"
                      allowOther={true}
                      otherValue={formData.mealSourceOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, mealSourceOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>

                  {/* Cooking Section - Show if cook, both, or meal_prep_services */}
                  {(formData.mealSource === "cook" || formData.mealSource === "both" || formData.mealSource === "meal_prep_services" || !formData.mealSource) && (
                    <>
                      <div>
                        <UniformSingleSelect
                          value={formData.cookingSkillLevel}
                          onChange={(value) => setFormData((prev) => ({
                            ...prev,
                            cookingSkillLevel: value,
                            cookingSkillLevelOther: value === "other" ? prev.cookingSkillLevelOther : "",
                          }))}
                          options={QuestionnaireConfig.COOKING_SKILL_LEVELS}
                          label="Cooking skill level"
                          allowOther={true}
                          otherValue={formData.cookingSkillLevelOther}
                          onOtherChange={(value) => setFormData((prev) => ({ ...prev, cookingSkillLevelOther: value }))}
                          otherPlaceholder="Please specify..."
                          gridCols="4"
                        />
                      </div>

                      <div>
                        <UniformSingleSelect
                          value={formData.cookingTimeAvailable}
                          onChange={(value) => setFormData((prev) => ({
                            ...prev,
                            cookingTimeAvailable: value,
                            cookingTimeAvailableOther: value === "other" ? prev.cookingTimeAvailableOther : "",
                          }))}
                          options={QuestionnaireConfig.COOKING_TIME_OPTIONS}
                          label="Time available for cooking"
                          allowOther={true}
                          otherValue={formData.cookingTimeAvailableOther}
                          onOtherChange={(value) => setFormData((prev) => ({ ...prev, cookingTimeAvailableOther: value }))}
                          otherPlaceholder="Please specify..."
                          gridCols="2"
                        />
                      </div>

                      <div>
                        <UniformMultiSelect
                          values={formData.cookingMethods}
                          onChange={(values) => setFormData((prev) => ({
                            ...prev,
                            cookingMethods: values,
                            cookingMethodsOther: values.includes("other") ? prev.cookingMethodsOther : "",
                          }))}
                          options={QuestionnaireConfig.COOKING_METHODS}
                          label="Cooking methods preferred"
                          allowOther={true}
                          otherValue={formData.cookingMethodsOther}
                          onOtherChange={(value) => setFormData((prev) => ({ ...prev, cookingMethodsOther: value }))}
                          otherPlaceholder="Please specify other cooking method..."
                          gridCols="auto"
                        />
                      </div>

                      <div>
                        <UniformSingleSelect
                          value={formData.mealPrepPreference}
                          onChange={(value) => setFormData((prev) => ({
                            ...prev,
                            mealPrepPreference: value,
                            mealPrepPreferenceOther: value === "other" ? prev.mealPrepPreferenceOther : "",
                          }))}
                          options={QuestionnaireConfig.MEAL_PREP_PREFERENCE}
                          label="Meal prep preference"
                          allowOther={true}
                          otherValue={formData.mealPrepPreferenceOther}
                          onOtherChange={(value) => setFormData((prev) => ({ ...prev, mealPrepPreferenceOther: value }))}
                          otherPlaceholder="Please specify..."
                          gridCols="4"
                        />
                      </div>

                      <div>
                        <UniformMultiSelect
                          values={formData.kitchenEquipment}
                          onChange={(values) => setFormData((prev) => ({
                            ...prev,
                            kitchenEquipment: values,
                            kitchenEquipmentOther: values.includes("other") ? prev.kitchenEquipmentOther : "",
                          }))}
                          options={QuestionnaireConfig.KITCHEN_EQUIPMENT}
                          label="Kitchen equipment available"
                          allowOther={true}
                          otherValue={formData.kitchenEquipmentOther}
                          onOtherChange={(value) => setFormData((prev) => ({ ...prev, kitchenEquipmentOther: value }))}
                          otherPlaceholder="Please specify other equipment..."
                          gridCols="auto"
                        />
                      </div>
                    </>
                  )}

                  {/* Ordering Section - Show if order or both */}
                  {(formData.mealSource === "order" || formData.mealSource === "both") && (
                    <>
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <Label className="text-white mb-3 block text-lg">Ordering Preferences</Label>
                        
                        <div className="space-y-4">
                          <div>
                            <UniformMultiSelect
                              values={formData.restaurantTypes}
                              onChange={(values) => setFormData((prev) => ({
                                ...prev,
                                restaurantTypes: values,
                                restaurantTypesOther: values.includes("other") ? prev.restaurantTypesOther : "",
                              }))}
                              options={QuestionnaireConfig.RESTAURANT_TYPES}
                              label="Restaurant types"
                              allowOther={true}
                              otherValue={formData.restaurantTypesOther}
                              onOtherChange={(value) => setFormData((prev) => ({ ...prev, restaurantTypesOther: value }))}
                              otherPlaceholder="Please specify other restaurant type..."
                              gridCols="auto"
                            />
                          </div>

                          <div>
                            <UniformMultiSelect
                              values={formData.deliveryServices}
                              onChange={(values) => setFormData((prev) => ({
                                ...prev,
                                deliveryServices: values,
                                deliveryServicesOther: values.includes("other") ? prev.deliveryServicesOther : "",
                              }))}
                              options={QuestionnaireConfig.DELIVERY_SERVICES}
                              label="Delivery services"
                              allowOther={true}
                              otherValue={formData.deliveryServicesOther}
                              onOtherChange={(value) => setFormData((prev) => ({ ...prev, deliveryServicesOther: value }))}
                              otherPlaceholder="Please specify other delivery service..."
                              gridCols="auto"
                            />
                          </div>

                          <div>
                            <UniformSingleSelect
                              value={formData.orderingBudget}
                              onChange={(value) => setFormData((prev) => ({
                                ...prev,
                                orderingBudget: value,
                                orderingBudgetOther: value === "other" ? prev.orderingBudgetOther : "",
                              }))}
                              options={QuestionnaireConfig.ORDERING_BUDGET}
                              label="Budget for ordering (per meal)"
                              allowOther={true}
                              otherValue={formData.orderingBudgetOther}
                              onOtherChange={(value) => setFormData((prev) => ({ ...prev, orderingBudgetOther: value }))}
                              otherPlaceholder="Please specify..."
                              gridCols="4"
                            />
                          </div>

                          <div>
                            <UniformSingleSelect
                              value={formData.orderingFrequency}
                              onChange={(value) => setFormData((prev) => ({
                                ...prev,
                                orderingFrequency: value,
                                orderingFrequencyOther: value === "other" ? prev.orderingFrequencyOther : "",
                              }))}
                              options={QuestionnaireConfig.ORDERING_FREQUENCY}
                              label="Frequency of ordering"
                              allowOther={true}
                              otherValue={formData.orderingFrequencyOther}
                              onOtherChange={(value) => setFormData((prev) => ({ ...prev, orderingFrequencyOther: value }))}
                              otherPlaceholder="Please specify..."
                              gridCols="4"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Meal Prep Services Section */}
                  {formData.mealSource === "meal_prep_services" && (
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <Label className="text-white mb-3 block text-lg">Meal Prep Service Preferences</Label>
                      <UniformMultiSelect
                        values={formData.mealPrepServices}
                        onChange={(values) => setFormData((prev) => ({
                          ...prev,
                          mealPrepServices: values,
                          mealPrepServicesOther: values.includes("other") ? prev.mealPrepServicesOther : "",
                        }))}
                        options={QuestionnaireConfig.MEAL_PREP_SERVICES}
                        allowOther={true}
                        otherValue={formData.mealPrepServicesOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, mealPrepServicesOther: value }))}
                        otherPlaceholder="Please specify other meal prep service..."
                        gridCols="auto"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>

          {/* Section 3: Lifestyle, Budget & Health Details */}
          <div className="space-y-8">
            <div className="mb-6 pb-4 border-b border-primary/30">
              <h2 className="text-2xl font-bold text-white mb-2">Step 3: Lifestyle, Budget & Health Details</h2>
              <p className="text-gray-400 text-sm">Share your lifestyle, budget, and health information</p>
            </div>
              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Lifestyle & Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.typicalDaySchedule}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        typicalDaySchedule: value,
                        typicalDayScheduleOther: value === "other" ? prev.typicalDayScheduleOther : "",
                      }))}
                      options={QuestionnaireConfig.TYPICAL_DAY_SCHEDULE}
                      label="Typical day schedule"
                      allowOther={true}
                      otherValue={formData.typicalDayScheduleOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, typicalDayScheduleOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="3"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.workSchedule}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        workSchedule: value,
                        workScheduleOther: value === "other" ? prev.workScheduleOther : "",
                      }))}
                      options={QuestionnaireConfig.WORK_SCHEDULES}
                      label="Work schedule"
                      allowOther={true}
                      otherValue={formData.workScheduleOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, workScheduleOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                      <UniformSingleSelect
                        value={formData.lunchLocation}
                        onChange={(value) => setFormData((prev) => ({
                          ...prev,
                          lunchLocation: value,
                          lunchLocationOther: value === "other" ? prev.lunchLocationOther : "",
                        }))}
                        options={QuestionnaireConfig.LUNCH_LOCATION}
                        label="Lunch location"
                        allowOther={true}
                        otherValue={formData.lunchLocationOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, lunchLocationOther: value }))}
                        otherPlaceholder="Please specify..."
                        gridCols="auto"
                      />
                    </div>

                    <div className="w-full">
                      <UniformSingleSelect
                        value={formData.dinnerLocation}
                        onChange={(value) => setFormData((prev) => ({
                          ...prev,
                          dinnerLocation: value,
                          dinnerLocationOther: value === "other" ? prev.dinnerLocationOther : "",
                        }))}
                        options={QuestionnaireConfig.DINNER_LOCATION}
                        label="Dinner location"
                        allowOther={true}
                        otherValue={formData.dinnerLocationOther}
                        onOtherChange={(value) => setFormData((prev) => ({ ...prev, dinnerLocationOther: value }))}
                        otherPlaceholder="Please specify..."
                        gridCols="auto"
                      />
                    </div>
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.weekendEatingHabits}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        weekendEatingHabits: value,
                        weekendEatingHabitsOther: value === "other" ? prev.weekendEatingHabitsOther : "",
                      }))}
                      options={QuestionnaireConfig.WEEKEND_EATING_HABITS}
                      label="Weekend eating habits"
                      allowOther={true}
                      otherValue={formData.weekendEatingHabitsOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, weekendEatingHabitsOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Budget & Shopping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.budgetLevel}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        budgetLevel: value,
                        budgetLevelOther: value === "other" ? prev.budgetLevelOther : "",
                      }))}
                      options={QuestionnaireConfig.BUDGET_LEVELS}
                      label="Budget level"
                      allowOther={true}
                      otherValue={formData.budgetLevelOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, budgetLevelOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.shoppingFrequency}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        shoppingFrequency: value,
                        shoppingFrequencyOther: value === "other" ? prev.shoppingFrequencyOther : "",
                      }))}
                      options={QuestionnaireConfig.SHOPPING_FREQUENCY}
                      label="Shopping frequency"
                      allowOther={true}
                      otherValue={formData.shoppingFrequencyOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, shoppingFrequencyOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.shoppingPreferences}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        shoppingPreferences: values,
                        shoppingPreferencesOther: values.includes("other") ? prev.shoppingPreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.SHOPPING_PREFERENCES}
                      label="Shopping preferences"
                      allowOther={true}
                      otherValue={formData.shoppingPreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, shoppingPreferencesOther: value }))}
                      otherPlaceholder="Please specify other shopping preference..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.specialtyStoresAccess}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        specialtyStoresAccess: value,
                        specialtyStoresAccessOther: value === "other" ? prev.specialtyStoresAccessOther : "",
                      }))}
                      options={QuestionnaireConfig.SPECIALTY_STORES_ACCESS}
                      label="Access to specialty stores"
                      allowOther={true}
                      otherValue={formData.specialtyStoresAccessOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, specialtyStoresAccessOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="3"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Health & Nutrition Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.weightChangeTimeline}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        weightChangeTimeline: value,
                        weightChangeTimelineOther: value === "other" ? prev.weightChangeTimelineOther : "",
                      }))}
                      options={QuestionnaireConfig.WEIGHT_CHANGE_TIMELINE}
                      label="Weight change timeline"
                      allowOther={true}
                      otherValue={formData.weightChangeTimelineOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, weightChangeTimelineOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.macroPreferences}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        macroPreferences: value,
                        macroPreferencesOther: value === "other" ? prev.macroPreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.MACRO_PREFERENCES}
                      label="Macro preferences"
                      allowOther={true}
                      otherValue={formData.macroPreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, macroPreferencesOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  {formData.macroPreferences === "custom" && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                      <div>
                        <Label className="text-white mb-2 block">Protein: {formData.customMacros.protein}%</Label>
                        <Slider
                          value={[formData.customMacros.protein]}
                          onValueChange={(values) => {
                            const protein = values[0];
                            const remaining = 100 - protein;
                            const carbs = Math.round(remaining * 0.6);
                            const fat = remaining - carbs;
                            setFormData({
                              ...formData,
                              customMacros: { protein, carbs, fat },
                            });
                          }}
                          min={10}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Carbs: {formData.customMacros.carbs}%</Label>
                        <Slider
                          value={[formData.customMacros.carbs]}
                          onValueChange={(values) => {
                            const carbs = values[0];
                            const remaining = 100 - carbs;
                            const protein = Math.round(remaining * 0.4);
                            const fat = remaining - protein;
                            setFormData({
                              ...formData,
                              customMacros: { protein, carbs, fat },
                            });
                          }}
                          min={20}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Fat: {formData.customMacros.fat}%</Label>
                        <Slider
                          value={[formData.customMacros.fat]}
                          onValueChange={(values) => {
                            const fat = values[0];
                            const remaining = 100 - fat;
                            const protein = Math.round(remaining * 0.4);
                            const carbs = remaining - protein;
                            setFormData({
                              ...formData,
                              customMacros: { protein, carbs, fat },
                            });
                          }}
                          min={15}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Total: {formData.customMacros.protein + formData.customMacros.carbs + formData.customMacros.fat}%
                      </p>
                    </div>
                  )}

                  <div>
                    <UniformSingleSelect
                      value={formData.fiberTarget}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        fiberTarget: value,
                        fiberTargetOther: value === "other" ? prev.fiberTargetOther : "",
                      }))}
                      options={QuestionnaireConfig.FIBER_TARGET}
                      label="Fiber target"
                      allowOther={true}
                      otherValue={formData.fiberTargetOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, fiberTargetOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="3"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.sodiumSensitivity}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        sodiumSensitivity: value,
                        sodiumSensitivityOther: value === "other" ? prev.sodiumSensitivityOther : "",
                      }))}
                      options={QuestionnaireConfig.SODIUM_SENSITIVITY}
                      label="Sodium sensitivity"
                      allowOther={true}
                      otherValue={formData.sodiumSensitivityOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, sodiumSensitivityOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="4"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Medical & Health Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformMultiSelect
                      values={formData.healthConditions}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        healthConditions: values,
                        healthConditionsOther: values.includes("other") ? prev.healthConditionsOther : "",
                      }))}
                      options={QuestionnaireConfig.HEALTH_CONDITIONS}
                      label="Health conditions"
                      allowNone={true}
                      allowOther={true}
                      noneValue="none"
                      otherValue={formData.healthConditionsOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, healthConditionsOther: value }))}
                      otherPlaceholder="Please specify your health condition..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.medications}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        medications: values,
                        medicationsOther: values.includes("other") ? prev.medicationsOther : "",
                      }))}
                      options={QuestionnaireConfig.MEDICATIONS}
                      label="Medications affecting nutrition"
                      allowNone={true}
                      allowOther={true}
                      noneValue="none"
                      otherValue={formData.medicationsOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, medicationsOther: value }))}
                      otherPlaceholder="Please specify other medications..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.pregnancyStatus}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        pregnancyStatus: value,
                        pregnancyStatusOther: value === "other" ? prev.pregnancyStatusOther : "",
                      }))}
                      options={QuestionnaireConfig.PREGNANCY_STATUS}
                      label="Pregnancy/Breastfeeding"
                      allowOther={true}
                      otherValue={formData.pregnancyStatusOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, pregnancyStatusOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Recent surgeries</Label>
                    <Textarea
                      value={formData.recentSurgeries}
                      onChange={(e) => setFormData({ ...formData, recentSurgeries: e.target.value })}
                      placeholder="None, or specify any recent surgeries..."
                      className="bg-black/40 border-white/20 text-white min-h-[80px]"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.digestiveHealth}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        digestiveHealth: values,
                        digestiveHealthOther: values.includes("other") ? prev.digestiveHealthOther : "",
                      }))}
                      options={QuestionnaireConfig.DIGESTIVE_HEALTH}
                      label="Digestive health concerns"
                      allowNone={true}
                      allowOther={true}
                      noneValue="none"
                      otherValue={formData.digestiveHealthOther || ""}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, digestiveHealthOther: value }))}
                      otherPlaceholder="Please specify other digestive concerns..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.sleepSchedule}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        sleepSchedule: value,
                        sleepScheduleOther: value === "other" ? prev.sleepScheduleOther : "",
                      }))}
                      options={QuestionnaireConfig.SLEEP_SCHEDULES}
                      label="Sleep schedule pattern"
                      allowOther={true}
                      otherValue={formData.sleepScheduleOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, sleepScheduleOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.stressLevel}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        stressLevel: value,
                        stressLevelOther: value === "other" ? prev.stressLevelOther : "",
                      }))}
                      options={QuestionnaireConfig.STRESS_LEVELS}
                      label="Current stress level"
                      allowOther={true}
                      otherValue={formData.stressLevelOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, stressLevelOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.hydrationPreferences}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        hydrationPreferences: value,
                        hydrationPreferencesOther: value === "other" ? prev.hydrationPreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.HYDRATION_PREFERENCES}
                      label="Hydration preferences"
                      allowOther={true}
                      otherValue={formData.hydrationPreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, hydrationPreferencesOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Current daily water intake (optional)</Label>
                    <Input
                      type="text"
                      value={formData.waterIntake}
                      onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value })}
                      placeholder="e.g., 6-8 glasses, 2 liters, etc."
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.beveragePreferences}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        beveragePreferences: values,
                        beveragePreferencesOther: values.includes("other") ? prev.beveragePreferencesOther : "",
                      }))}
                      options={QuestionnaireConfig.BEVERAGE_PREFERENCES}
                      label="Beverage preferences"
                      allowOther={true}
                      otherValue={formData.beveragePreferencesOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, beveragePreferencesOther: value }))}
                      otherPlaceholder="Please specify other beverage..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.activityLevel}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        activityLevel: value,
                        activityLevelOther: value === "other" ? prev.activityLevelOther : "",
                      }))}
                      options={QuestionnaireConfig.ACTIVITY_LEVELS}
                      label="Activity level"
                      allowOther={true}
                      otherValue={formData.activityLevelOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, activityLevelOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Section 4: Cultural Preferences & Special Requests */}
          <div className="space-y-8">
            <div className="mb-6 pb-4 border-b border-primary/30">
              <h2 className="text-2xl font-bold text-white mb-2">Step 4: Cultural Preferences & Special Requests</h2>
              <p className="text-gray-400 text-sm">Add any cultural preferences or special requests</p>
            </div>
              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Cultural & Regional Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.culturalBackground}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        culturalBackground: value,
                        culturalBackgroundOther: value === "other" ? prev.culturalBackgroundOther : "",
                      }))}
                      options={QuestionnaireConfig.CULTURAL_BACKGROUNDS}
                      label="Cultural background"
                      allowOther={true}
                      otherValue={formData.culturalBackgroundOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, culturalBackgroundOther: value }))}
                      otherPlaceholder="Please specify your cultural background..."
                      gridCols="3"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Traditional foods to include</Label>
                    <Textarea
                      value={formData.traditionalFoodsToInclude}
                      onChange={(e) => setFormData({ ...formData, traditionalFoodsToInclude: e.target.value })}
                      placeholder="List specific dishes or ingredients from your culture you'd like included..."
                      className="bg-black/40 border-white/20 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Foods from your culture to avoid</Label>
                    <Textarea
                      value={formData.foodsFromCultureToAvoid}
                      onChange={(e) => setFormData({ ...formData, foodsFromCultureToAvoid: e.target.value })}
                      placeholder="List any traditional foods you'd prefer to avoid..."
                      className="bg-black/40 border-white/20 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.spiceTolerance}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        spiceTolerance: value,
                        spiceToleranceOther: value === "other" ? prev.spiceToleranceOther : "",
                      }))}
                      options={QuestionnaireConfig.SPICE_TOLERANCE}
                      label="Spice tolerance"
                      allowOther={true}
                      otherValue={formData.spiceToleranceOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, spiceToleranceOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="auto"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Special Requests & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <UniformSingleSelect
                      value={formData.specialOccasions}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        specialOccasions: value,
                        specialOccasionsOther: value === "other" ? prev.specialOccasionsOther : "",
                      }))}
                      options={QuestionnaireConfig.SPECIAL_OCCASIONS}
                      label="Special occasions this week/month"
                      allowOther={true}
                      otherValue={formData.specialOccasionsOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, specialOccasionsOther: value }))}
                      otherPlaceholder="Please specify special occasion..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Special dietary notes</Label>
                    <Textarea
                      value={formData.specialDietaryNotes}
                      onChange={(e) => setFormData({ ...formData, specialDietaryNotes: e.target.value })}
                      placeholder="Any additional requirements, preferences, or notes..."
                      className="bg-black/40 border-white/20 text-white min-h-[120px]"
                    />
                  </div>

                  <div>
                    <UniformMultiSelect
                      values={formData.mealPlanFocus}
                      onChange={(values) => setFormData((prev) => ({
                        ...prev,
                        mealPlanFocus: values,
                        mealPlanFocusOther: values.includes("other") ? prev.mealPlanFocusOther : "",
                      }))}
                      options={QuestionnaireConfig.MEAL_PLAN_FOCUS}
                      label="Meal plan focus"
                      allowOther={true}
                      otherValue={formData.mealPlanFocusOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, mealPlanFocusOther: value }))}
                      otherPlaceholder="Please specify other focus..."
                      gridCols="auto"
                    />
                  </div>

                  <div>
                    <UniformSingleSelect
                      value={formData.varietyPreference}
                      onChange={(value) => setFormData((prev) => ({
                        ...prev,
                        varietyPreference: value,
                        varietyPreferenceOther: value === "other" ? prev.varietyPreferenceOther : "",
                      }))}
                      options={QuestionnaireConfig.VARIETY_PREFERENCES}
                      label="Variety preference"
                      allowOther={true}
                      otherValue={formData.varietyPreferenceOther}
                      onOtherChange={(value) => setFormData((prev) => ({ ...prev, varietyPreferenceOther: value }))}
                      otherPlaceholder="Please specify..."
                      gridCols="2"
                    />
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <Link href="/dashboard" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={generating || !hasEnoughCredits || !formData.healthGoal || formData.healthGoal.length === 0}
              className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase h-12"
                >
                  {generating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Plan
                    </>
                  )}
                </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

