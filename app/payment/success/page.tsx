"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { getSubscriptionStatus } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PaymentErrorBoundary } from "@/components/PaymentErrorBoundary";

function PaymentSuccessContent() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  // Refresh subscription status
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionStatus,
    refetchOnMount: true,
  });

  useEffect(() => {
    // Auto-redirect to dashboard after 3 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const planName = subscriptionData?.subscription?.planId
    ? subscriptionData.subscription.planId
        .replace("_monthly", "")
        .replace("_annual", "")
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Your Plan";

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-black text-white py-24">
        <Card className="w-full max-w-md mx-4 bg-gray-900/50 border-white/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="h-20 w-20 text-primary" />
                <div className="absolute inset-0 animate-ping opacity-20">
                  <CheckCircle className="h-20 w-20 text-primary" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-300 text-lg">
                Your subscription has been activated successfully.
              </p>
              <p className="text-primary font-semibold">{planName}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className="text-primary font-semibold">Active</span>
              </div>
              {subscriptionData?.subscription?.currentPeriodEnd && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Next billing:</span>
                  <span className="text-gray-300">
                    {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-gray-500">
                Redirecting automatically in {countdown} second{countdown !== 1 ? "s" : ""}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <PaymentErrorBoundary>
      <PaymentSuccessContent />
    </PaymentErrorBoundary>
  );
}

