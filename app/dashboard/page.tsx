"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreditCounter } from "@/components/CreditCounter";
import { FamilyMemberSelector, type FamilyMember } from "@/components/FamilyMemberSelector";
import { PlanCard } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { 
  getQuota, 
  getMealPlanHistory, 
  getCurrentUser, 
  getSubscriptionStatus, 
  getOnboardingStatus, 
  getUserProfile,
  getFamilyMembers,
  deleteMealPlan,
  exportMealPlanPDF,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, FileText, ArrowRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isB2BPlan } from "@shared/plans";
import { supabase } from "@/lib/supabase";
import { PlanExpirationWarning } from "@/components/PlanExpirationWarning";
import { UpgradeModal } from "@/components/UpgradeModal";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<"individual" | "business" | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [exportingPlanId, setExportingPlanId] = useState<string | null>(null);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  // Fetch quota info
  const { data: quota, isLoading: quotaLoading } = useQuery({
    queryKey: ["quota", selectedMemberId],
    queryFn: getQuota,
    refetchInterval: 30000,
  });

  // Fetch user info
  const { data: userInfo } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
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

  // Fetch family members
  const { data: familyData, refetch: refetchFamily } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: getFamilyMembers,
    enabled: !!user,
  });

  // Fetch meal plan history for active tab
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["mealPlanHistory", activeTab, selectedMemberId],
    queryFn: () => getMealPlanHistory({
      type: activeTab,
      familyMemberId: selectedMemberId || undefined,
      limit: 100,
    }),
    enabled: !!user,
  });

  // Show welcome modal once after onboarding completion
  useEffect(() => {
    if (onboardingStatus?.completed && user) {
      const welcomeDismissedKey = `welcome-modal-dismissed-${user.id}`;
      const hasBeenDismissed = localStorage.getItem(welcomeDismissedKey);
      
      // Only show if not dismissed before and user has no plans yet
      if (!hasBeenDismissed && (!plansData || plansData.plans.length === 0)) {
        setWelcomeModalOpen(true);
      }
    }
  }, [onboardingStatus, user, plansData]);

  // Handle welcome modal close
  const handleWelcomeModalClose = () => {
    if (user) {
      const welcomeDismissedKey = `welcome-modal-dismissed-${user.id}`;
      localStorage.setItem(welcomeDismissedKey, "true");
    }
    setWelcomeModalOpen(false);
  };

  // Check if user is on free tier (from plansData response)
  const isFreeTier = plansData?.isFreeTier ?? false;

  // Refresh queries when component mounts (e.g., returning from generation)
  useEffect(() => {
    // Invalidate queries to refresh data when user returns to dashboard
    queryClient.invalidateQueries({ queryKey: ["mealPlanHistory"] });
    queryClient.invalidateQueries({ queryKey: ["quota"] });
    
    // Check if we're returning from a successful generation (via URL params or sessionStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const generatedPlanId = urlParams.get("generated");
    
    if (generatedPlanId) {
      // Show success message
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully!",
      });
      // Clean up URL
      router.replace("/dashboard");
    }
  }, [queryClient, router, toast]);

  // Listen for upgrade modal events from PlanExpirationWarning components
  useEffect(() => {
    const handleOpenUpgradeModal = () => {
      setUpgradeModalOpen(true);
    };

    window.addEventListener('openUpgradeModal', handleOpenUpgradeModal);
    return () => {
      window.removeEventListener('openUpgradeModal', handleOpenUpgradeModal);
    };
  }, []);

  // Determine if user has family plan
  const isFamilyPlan = familyData?.members && familyData.members.length > 0;
  const isProfessional = customerType === "business";

  // Get customer type
  useEffect(() => {
    const checkCustomerType = async () => {
      if (user && subscriptionData) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const metadataType = currentUser?.user_metadata?.customer_type;
          
          if (metadataType === "business" || metadataType === "individual") {
            setCustomerType(metadataType);
          } else {
            const planId = subscriptionData?.subscription?.planId || "free";
            const isB2B = isB2BPlan(planId as any);
            setCustomerType(isB2B ? "business" : "individual");
          }
        } catch (error) {
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

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "Meal plan has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["mealPlanHistory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });


  const firstName = userInfo?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const planId = subscriptionData?.subscription?.planId || "free";
  const planName = planId.split("_")[0].charAt(0).toUpperCase() + planId.split("_")[0].slice(1);

  // Get selected member's credits (for family plans)
  const displayCredits = quota?.credits || { used: 0, limit: 0 };

  // Helper function to render plans with expiration warnings
  const renderPlansWithExpiration = (plans: any[]) => {
    const activePlans = plans.filter((plan: any) => !plan.expiration?.isExpired);
    const hasExpiringPlans = isFreeTier && activePlans.some((plan: any) => plan.expiration);

    return (
      <div className="space-y-6">
        {/* Show general expiration notice for free tier */}
        {hasExpiringPlans && (
          <Card className="bg-yellow-900/20 border-yellow-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-200">
                <strong>Free Tier Notice:</strong> Your meal plans expire after 12 hours.{" "}
                <button 
                  onClick={() => setUpgradeModalOpen(true)}
                  className="text-primary hover:underline font-bold"
                >
                  Upgrade to keep your plans forever!
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan: any) => (
            <div key={plan.id} className="space-y-2">
              {/* Show expiration warning above each plan card for free tier */}
              {isFreeTier && plan.expiration && (
                <PlanExpirationWarning
                  expiresAt={plan.expiration.expiresAt}
                  hoursRemaining={plan.expiration.hoursRemaining}
                  minutesRemaining={plan.expiration.minutesRemaining}
                  isExpired={plan.expiration.isExpired}
                  isExpiringSoon={plan.expiration.isExpiringSoon}
                  planType={plan.plan_type}
                  planId={plan.id}
                />
              )}
              <PlanCard
                id={plan.id}
                type={plan.plan_type}
                createdAt={plan.created_at}
                dailyCalories={plan.plan_data?.overview?.dailyCalories}
                duration={plan.plan_data?.overview?.duration || plan.plan_data?.duration}
                onView={() => router.push(`/dashboard/plans/${plan.id}`)}
                onDownload={async () => {
                  setExportingPlanId(plan.id);
                  try {
                    const blob = await exportMealPlanPDF(plan.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `meal-plan-${plan.id}-${new Date().toISOString().split('T')[0]}.pdf`;
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
                    setExportingPlanId(null);
                  }
                }}
                onDelete={() => {
                  if (confirm("Are you sure you want to delete this plan?")) {
                    deleteMutation.mutate(plan.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Don't show dashboard for professionals (they have different dashboard)
  if (isProfessional) {
    return (
      <div className="bg-black text-white min-h-screen py-8">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <h1 className="font-heading text-4xl font-bold uppercase mb-4">
            Professional Dashboard
          </h1>
          <p className="text-gray-400">Professional dashboard features coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-8">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-2">
            Welcome back, <span className="text-primary">{firstName}!</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {planName} Plan
            </Badge>
            {planName === "Free" && (
              <Link href="/pricing">
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Credit Counter - Always visible when user is authenticated */}
        {quotaLoading ? (
          <Card className="bg-gray-900/50 border-white/10 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Spinner className="h-5 w-5 text-primary" />
                  <span className="text-gray-400">Loading credits...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : quota?.credits ? (
          <CreditCounter
            used={displayCredits.used}
            limit={displayCredits.limit}
            resetDate={quota.resetDate ? new Date(quota.resetDate) : undefined}
          />
        ) : (
          <Card className="bg-gray-900/50 border-white/10 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Credits</p>
                  <p className="text-lg font-bold text-white">Loading...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Member Selector */}
        {isFamilyPlan && familyData?.members && (
          <div className="mb-6">
            <FamilyMemberSelector
              members={familyData.members}
              selectedMemberId={selectedMemberId}
              onMemberChange={setSelectedMemberId}
              onMemberAdded={() => {
                refetchFamily();
                queryClient.invalidateQueries({ queryKey: ["quota"] });
              }}
              maxMembers={5}
            />
          </div>
        )}

        {/* Onboarding Prompt */}
        {onboardingStatus && !onboardingStatus.completed && (
          <Card className="bg-primary/10 border-primary/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-gray-300">
                    Complete your onboarding to generate personalized meal plans.
                  </p>
                </div>
                <Link href={onboardingStatus.type === "business" ? "/professional-onboarding" : "/onboarding"}>
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                    Complete Onboarding
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Modal - Shows once after onboarding */}
        <Dialog open={welcomeModalOpen} onOpenChange={(open) => {
          if (!open) {
            handleWelcomeModalClose();
          }
        }}>
          <DialogContent className="bg-gray-900 border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                🎉 Welcome to TailoredMealPlan!
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                Your profile is set up and ready. Create your first personalized meal plan to get started on your nutrition journey.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-4">
                Use the tabs below to create Daily, Weekly, or Monthly meal plans based on your preferences.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleWelcomeModalClose}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs for Daily/Weekly/Monthly */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "daily" | "weekly" | "monthly")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border-white/10 mb-6">
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

          {/* Daily Tab */}
          <TabsContent value="daily" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold uppercase">Daily Meal Plans</h2>
              {displayCredits.limit - displayCredits.used >= 1 ? (
                <Link href="/dashboard/create/daily">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold uppercase">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Daily Plan
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-gray-700 text-gray-400 cursor-not-allowed"
                  disabled
                  onClick={() => setUpgradeModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Daily Plan (No Credits)
                </Button>
              )}
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : plansData && plansData.plans.length > 0 ? (
              renderPlansWithExpiration(plansData.plans)
            ) : (
              <Card className="bg-gray-900/50 border-white/10 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-bold text-white mb-2">No daily plans yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first daily meal plan to get started!
                  </p>
                  {displayCredits.limit - displayCredits.used >= 1 ? (
                    <Link href="/dashboard/create/daily">
                      <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                        <Plus className="mr-2 h-5 w-5" />
                        Create Daily Plan
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="bg-gray-700 text-gray-400 cursor-not-allowed"
                      disabled
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Daily Plan (No Credits)
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Weekly Tab */}
          <TabsContent value="weekly" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold uppercase">Weekly Meal Plans</h2>
              {displayCredits.limit - displayCredits.used >= 2 ? (
                <Link href="/dashboard/create/weekly">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold uppercase">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Weekly Plan
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-gray-700 text-gray-400 cursor-not-allowed"
                  disabled
                  onClick={() => setUpgradeModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Weekly Plan (No Credits)
                </Button>
              )}
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : plansData && plansData.plans.length > 0 ? (
              renderPlansWithExpiration(plansData.plans)
            ) : (
              <Card className="bg-gray-900/50 border-white/10 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-bold text-white mb-2">No weekly plans yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first weekly meal plan to get started!
                  </p>
                  {displayCredits.limit - displayCredits.used >= 2 ? (
                    <Link href="/dashboard/create/weekly">
                      <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                        <Plus className="mr-2 h-5 w-5" />
                        Create Weekly Plan
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="bg-gray-700 text-gray-400 cursor-not-allowed"
                      disabled
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Weekly Plan (No Credits)
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold uppercase">Monthly Meal Plans</h2>
              {displayCredits.limit - displayCredits.used >= 4 ? (
                <Link href="/dashboard/create/monthly">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-bold uppercase">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Monthly Plan
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-gray-700 text-gray-400 cursor-not-allowed"
                  disabled
                  onClick={() => setUpgradeModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Monthly Plan (No Credits)
                </Button>
              )}
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : plansData && plansData.plans.length > 0 ? (
              renderPlansWithExpiration(plansData.plans)
            ) : (
              <Card className="bg-gray-900/50 border-white/10 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-heading text-xl font-bold text-white mb-2">No monthly plans yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first monthly meal plan to get started!
                  </p>
                  {displayCredits.limit - displayCredits.used >= 4 ? (
                    <Link href="/dashboard/create/monthly">
                      <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                        <Plus className="mr-2 h-5 w-5" />
                        Create Monthly Plan
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="bg-gray-700 text-gray-400 cursor-not-allowed"
                      disabled
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Monthly Plan (No Credits)
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upgrade Modal */}
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
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
