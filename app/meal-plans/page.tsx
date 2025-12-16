"use client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { getMealPlans } from "@/lib/api";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { 
  FileText, 
  Calendar, 
  ArrowRight,
  Plus,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import type { MealPlan } from "@shared/types";

function MealPlansContent() {
  const [filterType, setFilterType] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["mealPlans", filterType, sortOrder],
    queryFn: () => getMealPlans({
      type: filterType === "all" ? undefined : filterType,
      limit: 50,
    }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPlanTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const plans = data?.plans || [];
  
  // Sort plans
  const sortedPlans = [...plans].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="bg-black text-white min-h-screen py-8">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-2">
              My Meal <span className="text-primary">Plans</span>
            </h1>
            <p className="text-gray-400">
              View and manage all your generated meal plans
            </p>
          </div>
          <Link href="/customer-type-selection">
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Generate New Plan
            </Button>
          </Link>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 space-y-4">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full">
            <TabsList className="bg-gray-900/50 border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                All
              </TabsTrigger>
              <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {sortOrder === "newest" ? (
                <>
                  <SortDesc className="mr-2 h-4 w-4" />
                  Newest First
                </>
              ) : (
                <>
                  <SortAsc className="mr-2 h-4 w-4" />
                  Oldest First
                </>
              )}
            </Button>
            <span className="text-sm text-gray-400">
              {sortedPlans.length} {sortedPlans.length === 1 ? "plan" : "plans"}
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900/50 border-white/10">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error || sortedPlans.length === 0 ? (
          <Card className="bg-gray-900/50 border-white/10 border-dashed">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-bold text-white mb-2">
                {filterType === "all" ? "No Meal Plans Yet" : `No ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Plans Yet`}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {filterType === "all" 
                  ? "You haven't created any meal plans yet. Complete your profile to start generating personalized meal plans tailored to your goals and preferences."
                  : `You haven't generated any ${filterType} meal plans yet. Create one to get started!`
                }
              </p>
              <Link href="/customer-type-selection">
                <Button className="bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12 px-8">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlans.map((plan: any) => (
              <Card 
                key={plan.id} 
                className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all group cursor-pointer"
              >
                <Link href={`/meal-plans/${plan.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(plan.created_at)}
                      </span>
                    </div>
                    <CardTitle className="text-white text-lg">
                      {getPlanTypeLabel(plan.plan_type)} Meal Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Daily Calories</p>
                        <p className="text-2xl font-bold text-white">
                          {plan.plan_data?.overview?.dailyCalories || plan.plan_data?.overview?.dailyCalories || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Duration</p>
                          <p className="font-semibold text-white">
                            {plan.plan_data?.overview?.duration || plan.plan_data?.duration || "N/A"} days
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Meals</p>
                          <p className="font-semibold text-white">
                            {plan.plan_data?.days?.length || "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-white/20 text-white hover:bg-white/10 group-hover:border-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/meal-plans/${plan.id}`;
                        }}
                      >
                        View Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination - if more than 10 plans */}
        {sortedPlans.length > 10 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="border-white/20 text-white">
                Previous
              </Button>
              <span className="text-sm text-gray-400 px-4">
                Page 1 of {Math.ceil(sortedPlans.length / 10)}
              </span>
              <Button variant="outline" size="sm" disabled className="border-white/20 text-white">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MealPlans() {
  return (
    <ProtectedRoute>
      <Layout>
        <MealPlansContent />
      </Layout>
    </ProtectedRoute>
  );
}

