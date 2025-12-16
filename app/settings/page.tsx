"use client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubscriptionStatus, cancelSubscription } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Calendar, CreditCard, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionStatus,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const subscription = subscriptionData?.subscription;
  const hasSubscription = subscriptionData?.hasSubscription;

  const formatPlanName = (planId: string) => {
    if (!planId) return "Free";
    const parts = planId.split("_");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  const formatPrice = (planId: string, interval: string) => {
    const prices: Record<string, { monthly: number; annual: number }> = {
      individual: { monthly: 9, annual: 89 },
      family: { monthly: 19, annual: 189 },
      starter: { monthly: 29, annual: 288 },
      growth: { monthly: 49, annual: 468 },
      professional: { monthly: 99, annual: 948 },
      enterprise: { monthly: 199, annual: 1908 },
    };

    const basePlan = planId.split("_")[0];
    const isAnnual = interval === "annual";
    const price = prices[basePlan]?.[isAnnual ? "annual" : "monthly"] || 0;
    
    if (isAnnual) {
      return `$${price}/year`;
    }
    return `$${price}/month`;
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="bg-black text-white min-h-screen py-8">
          <div className="container max-w-screen-2xl px-4 md:px-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-8">
              Settings
            </h1>

            {/* Subscription Section */}
            <Card className="bg-gray-900/50 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6 text-primary" />
                  </div>
                ) : hasSubscription && subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                        <p className="text-2xl font-bold text-white">
                          {formatPlanName(subscription.planId)} - {formatPrice(subscription.planId, subscription.billingInterval)}
                        </p>
                      </div>
                      <Badge 
                        className={cn(
                          subscription.status === "active" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        )}
                      >
                        {subscription.status === "active" ? "Active" : subscription.status}
                      </Badge>
                    </div>

                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {subscription.cancelAtPeriodEnd 
                            ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-sm text-yellow-400">
                          Your subscription will be cancelled at the end of the current billing period.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Link href="/pricing">
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          Change Plan
                        </Button>
                      </Link>
                      {!subscription.cancelAtPeriodEnd && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                              <X className="mr-2 h-4 w-4" />
                              Cancel Subscription
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Cancel Subscription?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Your subscription will remain active until the end of your current billing period. 
                                You'll lose access to premium features after {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "the period ends"}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                                Keep Subscription
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate()}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Cancel Subscription
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400">You're currently on the free plan.</p>
                    <Link href="/pricing">
                      <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Other Settings */}
            <Card className="bg-gray-900/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">More settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

