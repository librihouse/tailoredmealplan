"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMealPlan, deleteMealPlan, exportMealPlanPDF } from "@/lib/api";
import { ArrowLeft, Download, Trash2, UtensilsCrossed, ShoppingCart, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Meal } from "@shared/types";

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Resolve params promise
  useEffect(() => {
    if (params && typeof params.id === "string") {
      setPlanId(params.id);
    } else if (params && typeof params === "object" && "id" in params) {
      setPlanId(params.id as string);
    }
  }, [params]);

  const { data: planData, isLoading, error } = useQuery({
    queryKey: ["mealPlan", planId],
    queryFn: () => getMealPlan(planId!),
    enabled: !!planId,
    retry: 2,
  });

  // Check if we're coming from generation and show success message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("generated") === "true") {
      // Clean up URL
      router.replace(`/dashboard/plans/${planId}`);
    }
  }, [planId, router]);

  const plan = planData?.plan;
  const planDataContent = plan?.plan_data;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "Meal plan has been deleted successfully.",
      });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });


  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !plan || !planDataContent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan Not Found</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const days = planDataContent.days || [];
  const groceryList = planDataContent.groceryList || {};
  const overview = planDataContent.overview || {};

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-white hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
                </Badge>
                <span className="text-sm text-gray-400">
                  Created {new Date(plan.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold uppercase">
                Meal Plan Overview
              </h1>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!planId) return;
                  
                  setIsExportingPDF(true);
                  try {
                    const blob = await exportMealPlanPDF(planId);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `meal-plan-${planId}-${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    toast({
                      title: "Success!",
                      description: "PDF downloaded successfully.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to export PDF",
                      variant: "destructive",
                    });
                  } finally {
                    setIsExportingPDF(false);
                  }
                }}
                disabled={isExportingPDF}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className={cn("mr-2 h-4 w-4", isExportingPDF && "animate-spin")} />
                {isExportingPDF ? "Generating..." : "PDF"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Are you sure you want to delete this meal plan? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(plan.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {overview.dailyCalories && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400 mb-1">Daily Calories</p>
                <p className="text-2xl font-bold text-white">{overview.dailyCalories}</p>
              </CardContent>
            </Card>
            {overview.macros?.protein && (
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Protein</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.protein}g</p>
                </CardContent>
              </Card>
            )}
            {overview.macros?.carbs && (
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Carbs</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.carbs}g</p>
                </CardContent>
              </Card>
            )}
            {overview.macros?.fat && (
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Fat</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.fat}g</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border-white/10 mb-6">
            <TabsTrigger value="meals" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Meals
            </TabsTrigger>
            <TabsTrigger value="grocery" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Grocery List
            </TabsTrigger>
          </TabsList>

          {/* Meals Tab */}
          <TabsContent value="meals" className="space-y-4">
            {Array.isArray(days) && days.length > 0 ? (
              days.map((day: any, index: number) => {
                const dayNumber = day.day || index + 1;
                const isExpanded = expandedDays.has(dayNumber);
                const meals = day.meals || {};

                // Debug: Log meal structure if meals are empty
                if (isExpanded && (!meals || Object.keys(meals).length === 0)) {
                  console.warn(`Day ${dayNumber} has no meals data:`, day);
                }

                return (
                  <Card key={index} className="bg-gray-900/50 border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">
                          Day {dayNumber}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDay(dayNumber)}
                          className="text-white hover:text-primary"
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        {(!meals || Object.keys(meals).length === 0) && (
                          <div className="text-center py-8">
                            <p className="text-gray-400 mb-2">No meal data available for this day</p>
                            <p className="text-xs text-gray-500">The meal plan data may be incomplete</p>
                          </div>
                        )}
                        {meals.breakfast && (
                          <div className="border-l-4 border-primary pl-4 mb-4">
                            <h4 className="font-bold text-primary mb-2">Breakfast</h4>
                            <p className="text-white font-semibold text-lg mb-2">{meals.breakfast.name || 'N/A'}</p>
                            {meals.breakfast.nutrition && (
                              <p className="text-sm text-gray-400 mb-2">
                                {meals.breakfast.nutrition.calories || 0} kcal • 
                                P: {meals.breakfast.nutrition.protein || 0}g • 
                                C: {meals.breakfast.nutrition.carbs || 0}g • 
                                F: {meals.breakfast.nutrition.fat || 0}g
                              </p>
                            )}
                            {meals.breakfast.ingredients && Array.isArray(meals.breakfast.ingredients) && meals.breakfast.ingredients.length > 0 && (
                              <div className="mt-3 mb-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Ingredients:</p>
                                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                                  {meals.breakfast.ingredients.map((ing: string, i: number) => (
                                    <li key={i}>{ing}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {meals.breakfast.instructions && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Instructions:</p>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {meals.breakfast.instructions}
                                </p>
                              </div>
                            )}
                            {!meals.breakfast.instructions && (
                              <p className="text-xs text-gray-500 italic mt-2">No instructions available</p>
                            )}
                          </div>
                        )}
                        {meals.lunch && (
                          <div className="border-l-4 border-primary pl-4 mb-4">
                            <h4 className="font-bold text-primary mb-2">Lunch</h4>
                            <p className="text-white font-semibold text-lg mb-2">{meals.lunch.name || 'N/A'}</p>
                            {meals.lunch.nutrition && (
                              <p className="text-sm text-gray-400 mb-2">
                                {meals.lunch.nutrition.calories || 0} kcal • 
                                P: {meals.lunch.nutrition.protein || 0}g • 
                                C: {meals.lunch.nutrition.carbs || 0}g • 
                                F: {meals.lunch.nutrition.fat || 0}g
                              </p>
                            )}
                            {meals.lunch.ingredients && Array.isArray(meals.lunch.ingredients) && meals.lunch.ingredients.length > 0 && (
                              <div className="mt-3 mb-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Ingredients:</p>
                                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                                  {meals.lunch.ingredients.map((ing: string, i: number) => (
                                    <li key={i}>{ing}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {meals.lunch.instructions && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Instructions:</p>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {meals.lunch.instructions}
                                </p>
                              </div>
                            )}
                            {!meals.lunch.instructions && (
                              <p className="text-xs text-gray-500 italic mt-2">No instructions available</p>
                            )}
                          </div>
                        )}
                        {meals.dinner && (
                          <div className="border-l-4 border-primary pl-4 mb-4">
                            <h4 className="font-bold text-primary mb-2">Dinner</h4>
                            <p className="text-white font-semibold text-lg mb-2">{meals.dinner.name || 'N/A'}</p>
                            {meals.dinner.nutrition && (
                              <p className="text-sm text-gray-400 mb-2">
                                {meals.dinner.nutrition.calories || 0} kcal • 
                                P: {meals.dinner.nutrition.protein || 0}g • 
                                C: {meals.dinner.nutrition.carbs || 0}g • 
                                F: {meals.dinner.nutrition.fat || 0}g
                              </p>
                            )}
                            {meals.dinner.ingredients && Array.isArray(meals.dinner.ingredients) && meals.dinner.ingredients.length > 0 && (
                              <div className="mt-3 mb-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Ingredients:</p>
                                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                                  {meals.dinner.ingredients.map((ing: string, i: number) => (
                                    <li key={i}>{ing}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {meals.dinner.instructions && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Instructions:</p>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {meals.dinner.instructions}
                                </p>
                              </div>
                            )}
                            {!meals.dinner.instructions && (
                              <p className="text-xs text-gray-500 italic mt-2">No instructions available</p>
                            )}
                          </div>
                        )}
                        {meals.snacks && Array.isArray(meals.snacks) && meals.snacks.length > 0 && (
                          <div className="border-l-4 border-primary pl-4 mb-4">
                            <h4 className="font-bold text-primary mb-2">Snacks</h4>
                            {meals.snacks.map((snack: Meal, i: number) => (
                              <div key={i} className="mb-4">
                                <p className="text-white font-semibold text-lg mb-1">{snack.name || 'Snack'}</p>
                                {snack.nutrition && (
                                  <p className="text-sm text-gray-400 mb-2">
                                    {snack.nutrition.calories || 0} kcal • 
                                    {snack.nutrition.protein ? ` P: ${snack.nutrition.protein}g` : ''} • 
                                    {snack.nutrition.carbs ? ` C: ${snack.nutrition.carbs}g` : ''} • 
                                    {snack.nutrition.fat ? ` F: ${snack.nutrition.fat}g` : ''}
                                  </p>
                                )}
                                {snack.ingredients && Array.isArray(snack.ingredients) && snack.ingredients.length > 0 && (
                                  <div className="mt-2 mb-2">
                                    <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Ingredients:</p>
                                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                                      {snack.ingredients.map((ing: string, j: number) => (
                                        <li key={j}>{ing}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {snack.instructions && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Instructions:</p>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                      {snack.instructions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-400">No meal data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Grocery List Tab */}
          <TabsContent value="grocery">
            {groceryList && Object.keys(groceryList).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(groceryList).map(([category, items]: [string, any]) => {
                  if (!Array.isArray(items) || items.length === 0) return null;
                  return (
                    <Card key={category} className="bg-gray-900/50 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white capitalize">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {items.map((item: string, i: number) => (
                            <li key={i} className="text-gray-300 flex items-center gap-2">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-400">No grocery list available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

