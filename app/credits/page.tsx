"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuota, getSubscriptionStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Coins, Calendar, TrendingUp, Info, Sparkles, Zap, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPlan } from "@/shared/plans";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";

// Credit costs for each plan type
const CREDIT_COSTS = {
  daily: 1,
  weekly: 2,
  monthly: 4,
};

export default function CreditsPage() {
  const { isAuthenticated } = useAuth();

  // Fetch quota information
  const { data: quota, isLoading: quotaLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: getQuota,
    enabled: isAuthenticated,
  });

  // Fetch subscription to determine plan
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionStatus,
    enabled: isAuthenticated,
  });

  const planId = subscriptionData?.subscription?.planId || "free";
  const plan = getPlan(planId as any);
  const isFreeTier = planId === "free";
  const creditsUsed = quota?.credits?.used || 0;
  const creditsLimit = quota?.credits?.limit || plan.limits.monthlyCredits;
  const creditsRemaining = creditsLimit - creditsUsed;
  const resetDate = quota?.resetDate ? new Date(quota.resetDate) : null;
  const usagePercentage = creditsLimit > 0 
    ? Math.min((creditsUsed / creditsLimit) * 100, 100) 
    : 0;

  // Calculate what user can do with remaining credits
  const calculatePossibilities = (credits: number) => {
    const possibilities = [];
    
    if (credits >= CREDIT_COSTS.daily) {
      possibilities.push({
        type: "daily",
        count: Math.floor(credits / CREDIT_COSTS.daily),
        label: "Daily Plans",
        cost: CREDIT_COSTS.daily,
        icon: "📅",
        description: "1 day of meals",
      });
    }
    
    if (credits >= CREDIT_COSTS.weekly) {
      possibilities.push({
        type: "weekly",
        count: Math.floor(credits / CREDIT_COSTS.weekly),
        label: "Weekly Plans",
        cost: CREDIT_COSTS.weekly,
        icon: "📆",
        description: "7 days of meals",
      });
    }
    
    if (credits >= CREDIT_COSTS.monthly) {
      possibilities.push({
        type: "monthly",
        count: Math.floor(credits / CREDIT_COSTS.monthly),
        label: "Monthly Plans",
        cost: CREDIT_COSTS.monthly,
        icon: "📅",
        description: "30 days of meals",
      });
    }
    
    return possibilities;
  };

  const remainingPossibilities = calculatePossibilities(creditsRemaining);
  const totalPossibilities = calculatePossibilities(creditsLimit);

  // Format reset date
  const formatResetDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate days until reset
  const daysUntilReset = resetDate
    ? Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // For non-authenticated users, show general credit information
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white py-12">
          <div className="container max-w-7xl px-4 md:px-8 mx-auto">
            {/* Hero Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 mb-6">
                <Coins className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Credits & Usage
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Understand our credit system and meal plan generation capacity
              </p>
            </div>

            <div className="space-y-8">
              {/* Understanding Credits Section */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    Understanding the Credit System
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Credits are the currency for meal plan generation. Each plan type requires a specific number of credits.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📅</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.daily} Credit
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Daily Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat tomorrow</div>
                      <div className="text-xs text-gray-400 mt-2">1 day of meals</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📆</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.weekly} Credits
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Weekly Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat this week</div>
                      <div className="text-xs text-gray-400 mt-2">7 days of meals</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📅</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.monthly} Credits
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Monthly Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat this month</div>
                      <div className="text-xs text-gray-400 mt-2">30 days of meals</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Tiers */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Credit Allocations by Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-2">Free Tier</div>
                      <div className="text-3xl font-bold text-primary mb-1">7</div>
                      <div className="text-xs text-gray-500">Lifetime credits</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-2">Individual</div>
                      <div className="text-3xl font-bold text-primary mb-1">42</div>
                      <div className="text-xs text-gray-500">Credits per month</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-5 border border-primary/20">
                      <div className="text-sm text-primary mb-2">Family</div>
                      <div className="text-3xl font-bold text-primary mb-1">210</div>
                      <div className="text-xs text-gray-500">Credits per month</div>
                      <div className="text-xs text-primary/80 mt-1">Up to 5 members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    Credit Management Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Daily Plans</h4>
                      <p className="text-sm text-gray-300">
                        Ideal for experimentation and short-term planning. Perfect for trying new dietary approaches or planning individual days.
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Weekly Plans</h4>
                      <p className="text-sm text-gray-300">
                        Optimal for structured meal preparation. Enables comprehensive weekly shopping and meal prep strategies.
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Monthly Plans</h4>
                      <p className="text-sm text-gray-300">
                        Maximum efficiency for long-term planning. Provides comprehensive monthly nutrition strategies with minimal planning overhead.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white py-12">
        <div className="container max-w-7xl px-4 md:px-8 mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 mb-6">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Credits & Usage
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Monitor your meal plan generation capacity and optimize your nutrition planning workflow
            </p>
          </div>

          {quotaLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-10 w-10 text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Credit Status - Hero Card */}
              <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-primary/20 shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Usage Overview */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-white">Current Credit Balance</h2>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border-primary/30 text-primary",
                              usagePercentage >= 80 ? "border-yellow-500/30 text-yellow-400" : "",
                              usagePercentage >= 100 ? "border-red-500/30 text-red-400" : ""
                            )}
                          >
                            {usagePercentage >= 100 ? "Limit Reached" : 
                             usagePercentage >= 80 ? "Running Low" : 
                             "Active"}
                          </Badge>
                        </div>
                        
                        {/* Large Credit Display */}
                        <div className="bg-black/40 rounded-xl p-6 border border-white/5 mb-6">
                          <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-6xl font-bold text-primary">{creditsRemaining}</span>
                            <span className="text-2xl text-gray-400">credits remaining</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            of {creditsLimit} total available
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Usage Progress</span>
                            <span className={cn(
                              "font-semibold",
                              usagePercentage >= 100 ? "text-red-400" :
                              usagePercentage >= 80 ? "text-yellow-400" :
                              "text-primary"
                            )}>
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-white/10">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 rounded-full",
                                usagePercentage >= 100 ? "bg-red-500" :
                                usagePercentage >= 80 ? "bg-yellow-500" :
                                "bg-primary"
                              )}
                              style={{ width: `${usagePercentage}%` }}
                            />
                            {usagePercentage >= 100 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">Limit Reached</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{creditsUsed} used</span>
                            <span>{creditsLimit} total</span>
                          </div>
                        </div>
                      </div>

                      {/* Credit Breakdown */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <div className="text-sm text-gray-400 mb-1">Base Credits</div>
                          <div className="text-2xl font-bold text-white">{creditsLimit}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {isFreeTier ? "Lifetime allocation" : "Monthly allocation"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                      <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Reset Date</span>
                        </div>
                        {isFreeTier ? (
                          <div className="text-white font-semibold">Lifetime Plan</div>
                        ) : resetDate ? (
                          <>
                            <div className="text-white font-semibold">{formatResetDate(resetDate)}</div>
                            {daysUntilReset !== null && daysUntilReset > 0 && (
                              <div className="text-xs text-primary mt-1">
                                {daysUntilReset} {daysUntilReset === 1 ? "day" : "days"} remaining
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">N/A</div>
                        )}
                      </div>

                      <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">Plan Tier</span>
                        </div>
                        <div className="text-white font-semibold capitalize">{plan.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Understanding Credits Section */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    Understanding the Credit System
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Credits are the currency for meal plan generation. Each plan type requires a specific number of credits.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📅</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.daily} Credit
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Daily Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat tomorrow</div>
                      <div className="text-xs text-gray-400 mt-2">1 day of meals</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📆</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.weekly} Credits
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Weekly Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat this week</div>
                      <div className="text-xs text-gray-400 mt-2">7 days of meals</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/30 rounded-xl p-6 text-center">
                      <div className="text-5xl mb-4">📅</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {CREDIT_COSTS.monthly} Credits
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Monthly Plan</div>
                      <div className="text-sm text-gray-300 mb-1">What to eat this month</div>
                      <div className="text-xs text-gray-400 mt-2">30 days of meals</div>
                    </div>
                  </div>

                  {/* Example Calculation */}
                  <div className="mt-8 bg-black/40 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-white">Example Calculation</h3>
                    </div>
                    <p className="text-gray-300 mb-4">
                      With <span className="text-primary font-bold">{creditsLimit}</span> credits, you can create:
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-2xl font-bold text-primary">{Math.floor(creditsLimit / CREDIT_COSTS.daily)}</span>
                        <div className="text-sm text-gray-400 mt-1">Daily Plans</div>
                      </div>
                      <div className="text-primary font-bold text-xl">OR</div>
                      <div>
                        <span className="text-2xl font-bold text-primary">{Math.floor(creditsLimit / CREDIT_COSTS.weekly)}</span>
                        <div className="text-sm text-gray-400 mt-1">Weekly Plans</div>
                      </div>
                      <div className="col-span-3 text-primary font-bold text-xl my-2">OR</div>
                      <div className="col-span-3">
                        <span className="text-2xl font-bold text-primary">
                          {Math.floor(creditsLimit / CREDIT_COSTS.monthly)}
                        </span>
                        <span className="text-gray-400 ml-2">Monthly Plan{Math.floor(creditsLimit / CREDIT_COSTS.monthly) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What You Can Create Now */}
              {creditsRemaining > 0 && (
                <Card className="bg-gray-900/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                      Available Generation Options
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      You have <span className="text-primary font-semibold">{creditsRemaining}</span> credits available. Here's what you can create right now.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {remainingPossibilities.map((possibility) => (
                        <div
                          key={possibility.type}
                          className="bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 rounded-xl p-6 text-center hover:scale-105 transition-transform hover:shadow-lg hover:shadow-primary/20"
                        >
                          <div className="text-5xl mb-4">{possibility.icon}</div>
                          <div className="text-4xl font-bold text-primary mb-2">
                            {possibility.count}
                          </div>
                          <div className="text-lg font-semibold text-white mb-2">
                            {possibility.label}
                          </div>
                          <div className="text-sm text-gray-300 mb-1">{possibility.description}</div>
                          <div className="text-xs text-gray-400">
                            {possibility.cost} credit{possibility.cost > 1 ? "s" : ""} each
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Credits Available */}
              {creditsRemaining === 0 && (
                <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-2 border-red-500/30">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Credit Limit Reached</h3>
                    <p className="text-gray-300 mb-6">
                      You've utilized all available credits. {isFreeTier 
                        ? "Upgrade to a paid plan for monthly credit allocations." 
                        : "Your credits will reset on " + formatResetDate(resetDate) + "."}
                    </p>
                    <div className="text-gray-400 text-sm">
                      {isFreeTier 
                        ? "Upgrade to a paid plan for monthly credit allocations." 
                        : `Your credits will reset on ${formatResetDate(resetDate)}.`}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plan Details */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Your Subscription Details
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {plan.name} - {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-2">
                        {isFreeTier ? "Lifetime Credits" : "Monthly Credit Allocation"}
                      </div>
                      <div className="text-3xl font-bold text-primary mb-1">
                        {plan.limits.monthlyCredits}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isFreeTier ? "One-time allocation" : "Resets monthly"}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-2">Daily Plan Capacity</div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.floor(plan.limits.monthlyCredits / CREDIT_COSTS.daily)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isFreeTier ? "lifetime" : "per month"}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-2">Weekly Plan Capacity</div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.floor(plan.limits.monthlyCredits / CREDIT_COSTS.weekly)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isFreeTier ? "lifetime" : "per month"}
                      </div>
                    </div>
                  </div>

                  {isFreeTier && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                        <p className="text-primary font-semibold">Upgrade Available</p>
                        <p className="text-xs text-gray-400 mt-1">Visit pricing page to upgrade your plan</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    Credit Management Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Daily Plans</h4>
                      <p className="text-sm text-gray-300">
                        Ideal for experimentation and short-term planning. Perfect for trying new dietary approaches or planning individual days.
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Weekly Plans</h4>
                      <p className="text-sm text-gray-300">
                        Optimal for structured meal preparation. Enables comprehensive weekly shopping and meal prep strategies.
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-5">
                      <div className="text-3xl mb-3">💡</div>
                      <h4 className="font-semibold text-white mb-2">Monthly Plans</h4>
                      <p className="text-sm text-gray-300">
                        Maximum efficiency for long-term planning. Provides comprehensive monthly nutrition strategies with minimal planning overhead.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
