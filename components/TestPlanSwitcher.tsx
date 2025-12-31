"use client";

/**
 * Test Plan Switcher Component
 * Only visible to test user - allows quick switching between plans for testing
 * Remove this component when PayPal integration is ready
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function TestPlanSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID || "";
  const isTestUser = user?.id === TEST_USER_ID;

  // Fetch current plan
  useEffect(() => {
    if (isTestUser && user?.id) {
      // You can add an API call here to fetch current subscription
      // For now, we'll just show the switcher
    }
  }, [isTestUser, user?.id]);

  if (!isTestUser || !TEST_USER_ID) {
    return null; // Don't show for non-test users
  }

  const assignPlan = async (planId: string) => {
    setLoading(planId);
    try {
      const data = await apiRequest<{
        success: boolean;
        message: string;
        credits: number;
      }>("/subscriptions/assign-test-plan", {
        method: "POST",
        body: JSON.stringify({
          planId,
          billingInterval: "monthly",
        }),
      });

      setCurrentPlan(planId);

      toast({
        title: "Plan Switched",
        description: `Switched to ${planId} plan (${data.credits} credits)`,
      });

      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch plan",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 z-50 shadow-lg">
      <p className="text-xs text-gray-400 mb-2 font-semibold">🧪 Test Mode - Plan Switcher</p>
      <p className="text-xs text-gray-500 mb-3">Quick switch plans for testing</p>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={currentPlan === "free" ? "default" : "outline"}
          onClick={() => assignPlan("free")}
          disabled={loading !== null}
          className="text-xs"
        >
          {loading === "free" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Free
        </Button>
        <Button
          size="sm"
          variant={currentPlan === "individual" ? "default" : "outline"}
          onClick={() => assignPlan("individual")}
          disabled={loading !== null}
          className="text-xs"
        >
          {loading === "individual" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Individual
        </Button>
        <Button
          size="sm"
          variant={currentPlan === "family" ? "default" : "outline"}
          onClick={() => assignPlan("family")}
          disabled={loading !== null}
          className="text-xs"
        >
          {loading === "family" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Family
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">
        Remove this component when PayPal is ready
      </p>
    </div>
  );
}

