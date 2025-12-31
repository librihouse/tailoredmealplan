"use client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMealPlan, deleteMealPlan, exportMealPlanPDF } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Download, 
  Trash2, 
  Calendar,
  UtensilsCrossed,
  ShoppingCart,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { MealPlan, Meal } from "@shared/types";

function MealPlanViewContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [planId, setPlanId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Resolve params promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setPlanId(resolvedParams.id);
    });
  }, [params]);

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ["mealPlan", planId],
    queryFn: () => getMealPlan(planId!),
    enabled: !!planId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMealPlan(planId!),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Meal plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      router.push("/meal-plans");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan",
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

  const copyGroceryList = () => {
    if (!plan?.plan_data?.groceryList) return;
    
    const items: string[] = [];
    Object.entries(plan.plan_data.groceryList).forEach(([category, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        items.push(`${category.toUpperCase()}:`);
        list.forEach((item) => items.push(`- ${item}`));
        items.push("");
      }
    });

    navigator.clipboard.writeText(items.join("\n"));
    toast({
      title: "Copied!",
      description: "Grocery list copied to clipboard",
    });
  };

  const toggleGroceryItem = (item: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <Card className="bg-gray-900/50 border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-red-400 mb-4">Failed to load meal plan</p>
            <Button onClick={() => router.push("/meal-plans")} variant="outline">
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle both direct plan_data and nested structure
  const planData = plan.plan_data || plan;
  const overview = planData?.overview || planData?.overview;
  const days = planData?.days || [];
  const groceryList = planData?.groceryList || {};
  const validationNotes = planData?.validationNotes || [];

  // Prepare data for charts
  const macroData = overview ? [
    { name: "Protein", value: overview.macros.protein, color: "#84cc16" },
    { name: "Carbs", value: overview.macros.carbs, color: "#3b82f6" },
    { name: "Fat", value: overview.macros.fat, color: "#f59e0b" },
  ] : [];

  const dailyCalories = days.map((day: any, index: number) => ({
    day: `Day ${day.day || index + 1}`,
    calories: day.meals.breakfast.nutrition.calories +
              day.meals.lunch.nutrition.calories +
              day.meals.dinner.nutrition.calories +
              (day.meals.snacks?.reduce((sum: number, snack: any) => sum + snack.nutrition.calories, 0) || 0),
  }));

  const MealCard = ({ meal, mealType }: { meal: Meal; mealType: string }) => (
    <Card className="bg-gray-900/50 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white capitalize">{mealType}</CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {meal.nutrition.calories} kcal
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-white mt-2">{meal.name}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Protein</p>
            <p className="font-bold text-white">{meal.nutrition.protein}g</p>
          </div>
          <div>
            <p className="text-gray-400">Carbs</p>
            <p className="font-bold text-white">{meal.nutrition.carbs}g</p>
          </div>
          <div>
            <p className="text-gray-400">Fat</p>
            <p className="font-bold text-white">{meal.nutrition.fat}g</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">Ingredients</p>
          <ul className="space-y-1">
            {meal.ingredients.map((ingredient, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">Instructions</p>
          <p className="text-sm text-gray-300 leading-relaxed">{meal.instructions}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-black text-white min-h-screen py-8">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        {/* AI Disclaimer Banner */}
        <div className="mb-6 bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-yellow-300 text-sm">
            <strong className="text-yellow-400">AI-Generated Content Notice:</strong> This meal plan is generated using artificial intelligence. 
            AI-generated content may contain inaccuracies. Please verify all ingredients, nutritional information, and allergens. 
            Consult with a healthcare professional before making significant dietary changes. 
            <Link href="/terms" className="text-yellow-400 underline ml-1">View Terms of Service</Link>
          </p>
        </div>

        {/* Validation Notes - Simple informational notes for customer */}
        {validationNotes && validationNotes.length > 0 && (
          <div className="mb-6 bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-300 text-sm font-medium mb-2">
              <strong className="text-blue-400">Note:</strong> Please review the following:
            </p>
            <ul className="space-y-1 text-blue-200 text-sm">
              {validationNotes.map((note: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1">
                  {(plan.plan_type || 'Daily').charAt(0).toUpperCase() + (plan.plan_type || 'daily').slice(1)} Plan
                </Badge>
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(plan.created_at)}
                </span>
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase">
                Meal Plan <span className="text-primary">Details</span>
              </h1>
            </div>
            <div className="flex gap-3">
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
                {isExportingPDF ? "Generating..." : "Download PDF"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Meal Plan?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete your meal plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Overview Stats */}
          {overview && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Daily Calories</p>
                  <p className="text-2xl font-bold text-white">{overview.dailyCalories} kcal</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Protein</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.protein}g</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Carbs</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.carbs}g</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 mb-1">Fat</p>
                  <p className="text-2xl font-bold text-white">{overview.macros.fat}g</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="bg-gray-900/50 border-white/10 mb-6">
            <TabsTrigger value="meals" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Meals
            </TabsTrigger>
            <TabsTrigger value="grocery" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Grocery List
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <BarChart3 className="mr-2 h-4 w-4" />
              Nutrition
            </TabsTrigger>
          </TabsList>

          {/* Meals Tab */}
          <TabsContent value="meals" className="space-y-6">
            {days.map((day: any, index: number) => {
              const dayNum = day.day || index + 1;
              const isExpanded = expandedDays.has(dayNum);
              
              return (
                <Card key={index} className="bg-gray-900/50 border-white/10">
                  <CardHeader>
                    <Button
                      variant="ghost"
                      onClick={() => toggleDay(dayNum)}
                      className="w-full justify-between p-0 h-auto hover:bg-transparent"
                    >
                      <CardTitle className="text-2xl font-bold text-white">
                        Day {dayNum}
                      </CardTitle>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-6 pt-0">
                      <MealCard meal={day.meals.breakfast} mealType="Breakfast" />
                      <MealCard meal={day.meals.lunch} mealType="Lunch" />
                      <MealCard meal={day.meals.dinner} mealType="Dinner" />
                      {day.meals.snacks && day.meals.snacks.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-bold text-lg text-white">Snacks</h4>
                          {day.meals.snacks.map((snack: any, i: number) => (
                            <MealCard key={i} meal={snack} mealType={`Snack ${i + 1}`} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* Grocery List Tab */}
          <TabsContent value="grocery">
            <Card className="bg-gray-900/50 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Shopping List</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyGroceryList}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy List
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groceryList).map(([category, items]) => {
                  if (!Array.isArray(items) || items.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="font-bold text-lg text-white mb-3 uppercase">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item, i) => {
                          const isChecked = checkedItems.has(item);
                          return (
                            <label
                              key={i}
                              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-primary/50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleGroceryItem(item)}
                                className="w-5 h-5 rounded border-white/20 text-primary focus:ring-primary"
                              />
                              <span className={`flex-1 ${isChecked ? "line-through text-gray-500" : "text-white"}`}>
                                {item}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(groceryList).length === 0 && (
                  <p className="text-gray-400 text-center py-8">No grocery list available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Macro Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {macroData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Daily Calories</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyCalories.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyCalories}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="calories" fill="#84cc16" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function MealPlanView({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <Layout>
        <MealPlanViewContent params={params} />
      </Layout>
    </ProtectedRoute>
  );
}

