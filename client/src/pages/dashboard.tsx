import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UsageDashboard } from "@/components/UsageDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { getQuota, getMealPlans, generateMealPlan, getCurrentUser, getSubscriptionStatus, getOnboardingStatus, getUserProfile } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  BarChart3,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@shared/types";
import { isB2BPlan } from "@shared/plans";
import { supabase } from "@/lib/supabase";

function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generatingPlanType, setGeneratingPlanType] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [customerType, setCustomerType] = useState<"individual" | "business" | null>(null);

  // Fetch quota info
  const { data: quota, isLoading: quotaLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: getQuota,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch user info
  const { data: userInfo } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    enabled: !!user,
  });

  // Fetch recent meal plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["mealPlans", "recent"],
    queryFn: () => getMealPlans({ limit: 3 }),
    enabled: !!user,
  });

  // Fetch subscription status
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionStatus,
    enabled: !!user,
  });

  // Fetch onboarding status
  const { data: onboardingStatus } = useQuery({
    queryKey: ["onboardingStatus"],
    queryFn: getOnboardingStatus,
    enabled: !!user,
  });

  // Fetch user profile
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
    enabled: !!user,
  });

  // Get customer type from user metadata or subscription
  useEffect(() => {
    const checkCustomerType = async () => {
      if (user) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const metadataType = currentUser?.user_metadata?.customer_type;
          
          if (metadataType === "business" || metadataType === "individual") {
            setCustomerType(metadataType);
          } else {
            // Fallback to subscription plan
            const planId = subscriptionData?.subscription?.planId || "free";
            const isB2B = isB2BPlan(planId as any);
            setCustomerType(isB2B ? "business" : "individual");
          }
        } catch (error) {
          console.error("Error checking customer type:", error);
          // Fallback to subscription plan
          const planId = subscriptionData?.subscription?.planId || "free";
          const isB2B = isB2BPlan(planId as any);
          setCustomerType(isB2B ? "business" : "individual");
        }
      }
    };

    if (user && subscriptionData !== undefined) {
      checkCustomerType();
    }
  }, [user, subscriptionData]);

  const planId = subscriptionData?.subscription?.planId || "free";
  const isProfessional = customerType === "business" || isB2BPlan(planId as any);
  
  const planName = planId.split("_")[0].charAt(0).toUpperCase() + 
    planId.split("_")[0].slice(1);
  
  const subscriptionStatus = subscriptionData?.subscription?.status || "free";
  const billingPeriodEnd = subscriptionData?.subscription?.currentPeriodEnd 
    ? new Date(subscriptionData.subscription.currentPeriodEnd)
    : null;

  // Check onboarding and redirect if needed
  useEffect(() => {
    if (onboardingStatus && !onboardingStatus.completed && customerType) {
      if (customerType === "business") {
        // Don't auto-redirect, show prompt instead
        // setLocation("/professional-onboarding");
      } else {
        // Show prompt for individual onboarding (don't force redirect)
        // Users can still use the dashboard
      }
    }
  }, [onboardingStatus, customerType, setLocation]);

  // Generate meal plan mutation
  const generateMutation = useMutation({
    mutationFn: async (planType: "daily" | "weekly" | "monthly") => {
      setGeneratingPlanType(planType);
      
      // Get user profile from onboarding data (would need to be stored)
      // For now, using a placeholder - in real app, fetch from user_profiles table
      const userProfile = {
        gender: "female",
        age: 30,
        height: 165,
        currentWeight: 70,
        targetWeight: 65,
        goal: "lose_weight",
        activity: "moderate",
        diet: [],
        religious: "none",
        conditions: [],
        allergies: [],
      };

      return generateMealPlan({
        planType,
        userProfile,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Meal plan generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });
      setGeneratingPlanType(null);
      
      // Navigate to the new plan using the database ID
      if (data.mealPlanId || data.mealPlan?.id) {
        setLocation(`/meal-plans/${data.mealPlanId || data.mealPlan.id}`);
      } else {
        // Fallback: navigate to plans list
        setLocation("/meal-plans");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan",
        variant: "destructive",
      });
      setGeneratingPlanType(null);
    },
  });

  const firstName = userInfo?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

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

  return (
    <div className="bg-black text-white min-h-screen py-8">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-2">
                Welcome back, <span className="text-primary">{firstName}!</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "border-primary/30 bg-primary/10",
                    subscriptionStatus === "active" ? "text-primary" : "text-gray-400"
                  )}
                >
                  {planName} Plan {subscriptionStatus === "active" && "• Active"}
                </Badge>
                {planName === "Free" && (
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black">
                      Upgrade
                    </Button>
                  </Link>
                )}
                {subscriptionStatus === "active" && billingPeriodEnd && (
                  <span className="text-xs text-gray-400">
                    Renews {billingPeriodEnd.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats Section */}
        {quotaLoading ? (
          <Card className="bg-gray-900/50 border-white/10 mb-8">
            <CardContent className="p-8 flex items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        ) : quota ? (
          <div className="mb-8">
            <UsageDashboard
              weeklyPlansUsed={quota.weeklyPlans.used}
              weeklyPlansLimit={quota.weeklyPlans.limit}
              monthlyPlansUsed={quota.monthlyPlans.used}
              monthlyPlansLimit={quota.monthlyPlans.limit}
              clientsUsed={quota.clients.used}
              clientsLimit={quota.clients.limit}
              resetDate={new Date(quota.resetDate)}
            />
          </div>
        ) : null}

        {/* Onboarding Prompt */}
        {onboardingStatus && !onboardingStatus.completed && (
          <Card className="bg-primary/10 border-primary/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-gray-300">
                    {isProfessional 
                      ? "Complete your business setup to start serving clients."
                      : "Complete your onboarding to generate personalized meal plans."}
                  </p>
                </div>
                <Link href="/customer-type-selection">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                    Complete Onboarding
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {isProfessional ? (
            <>
              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-primary" />
                    Manage Clients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Add and manage your clients to generate meal plans for them.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide h-12"
                    disabled
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Clients (Coming Soon)
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    View analytics and insights about your practice.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide h-12"
                    disabled
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Analytics (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate New Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Create a personalized meal plan tailored to your goals and preferences.
                  </p>
                  {onboardingStatus?.completed ? (
                    <Button 
                      onClick={() => setLocation("/meal-plans")}
                      className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Generate Plan
                    </Button>
                  ) : (
                    <Link href="/customer-type-selection">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12">
                        <Plus className="mr-2 h-5 w-5" />
                        Complete Onboarding First
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-primary" />
                    View All Plans
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Browse and manage all your generated meal plans.
                  </p>
                  <Link href="/meal-plans">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide h-12">
                      View Plans
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Generate Plan Section - Only for Individuals */}
        {!isProfessional && (
          <Card className="bg-gray-900/50 border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white uppercase">Quick Generate</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {(["daily", "weekly", "monthly"] as const).map((type) => {
                  const quotaForType = type === "monthly" ? quota?.monthlyPlans : quota?.weeklyPlans;
                  const remaining = quotaForType ? quotaForType.limit - quotaForType.used : 0;
                  const isExceeded = remaining <= 0;
                  const isGenerating = generatingPlanType === type;

                  return (
                    <div key={type}>
                      <Button
                        onClick={() => generateMutation.mutate(type)}
                        disabled={isExceeded || isGenerating || generatingPlanType !== null}
                        className={`
                          w-full h-20 font-bold uppercase tracking-wide
                          ${isExceeded 
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                            : "bg-primary hover:bg-primary/90 text-black"
                          }
                        `}
                      >
                        {isGenerating ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Generating...
                          </>
                        ) : (
                          getPlanTypeLabel(type)
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
              {generatingPlanType && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Generating your personalized meal plan...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        This may take 15-30 seconds. Please don't close this page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Recent Meal Plans Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold uppercase text-white">Recent Meal Plans</h2>
            {plansData && plansData.plans.length > 0 && (
              <Link href="/meal-plans">
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {plansLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
          ) : plansData && plansData.plans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {plansData.plans.map((plan: any) => (
                <Card key={plan.id} className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(plan.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Daily Calories</p>
                        <p className="text-xl font-bold text-white">
                          {plan.plan_data?.overview?.dailyCalories || "N/A"} kcal
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-lg font-semibold text-white">
                          {plan.plan_data?.overview?.duration || plan.plan_data?.duration || "N/A"} days
                        </p>
                      </div>
                      <Link href={`/meal-plans/${plan.id}`}>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 border-white/20 text-white hover:bg-white/10 group-hover:border-primary"
                        >
                          View Plan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900/50 border-white/10 border-dashed">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold text-white mb-2">No meal plans yet</h3>
                <p className="text-gray-400 mb-6">
                  Generate your first personalized meal plan to get started!
                </p>
                <Link href="/customer-type-selection">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                    <Plus className="mr-2 h-5 w-5" />
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}

