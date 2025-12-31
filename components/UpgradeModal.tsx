"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Loader2, Badge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Check if we're in test mode (Razorpay test keys)
  const isTestMode = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes("test") || 
                     process.env.NODE_ENV === "development";

  // Map plan names to plan IDs
  const getPlanId = (planName: string): string => {
    const planMap: Record<string, string> = {
      "Individual": "individual",
      "Family": "family",
    };
    return planMap[planName] || planName.toLowerCase().replace(/\s+/g, "_");
  };

  const handleSubscribe = async (plan: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      onOpenChange(false);
      router.push("/auth?redirect=/dashboard");
      return;
    }

    setProcessingPlan(plan.name);

    try {
      const planId = getPlanId(plan.name);
      const billingInterval = "monthly"; // Only monthly billing for MVP

      // Create Razorpay order
      const orderData = await createRazorpayOrder({
        planId,
        billingInterval,
      });

      // Get user info
      const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
      const userEmail = user?.email || "";

      // Open Razorpay checkout
      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        planName: `${plan.name} - Monthly`,
        userEmail,
        userName,
        onSuccess: async (response: any) => {
          try {
            // Verify payment
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: orderData.planId,
              billingInterval,
            });

            toast({
              title: "Success!",
              description: "Your subscription has been activated successfully!",
            });

            // Close modal and refresh dashboard
            onOpenChange(false);
            setTimeout(() => {
              router.refresh();
              window.location.reload(); // Force refresh to update subscription status
            }, 1000);
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Failed to verify payment. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setProcessingPlan(null);
          }
        },
        onFailure: (error: any) => {
          toast({
            title: "Payment Failed",
            description: error.reason || "Payment was cancelled or failed. Please try again.",
            variant: "destructive",
          });
          setProcessingPlan(null);
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  const plans = [
    {
      name: "Individual",
      price: "$7.99",
      period: "per month",
      description: "For dedicated health enthusiasts.",
      features: [
        "50 Meal Plans / Month",
        "Daily, Weekly, Monthly Plans",
        "Full Dietary Customization",
        "All Religious Diet Options",
        "Medical Conditions Support",
        "Detailed Recipes & Timing",
        "Smart Grocery Lists",
        "Progress Tracking",
        "AI Chat Support",
        "Multi-language Support",
        "No Watermarks",
      ],
      limitations: [],
      cta: "Choose Individual",
      popular: true,
    },
    {
      name: "Family",
      price: "$12.99",
      period: "per month",
      description: "Healthy habits for the whole house.",
      features: [
        "Everything in Individual",
        "Up to 5 Family Members",
        "50 Plans/Month per Member",
        "Individual Profiles & Goals",
        "Family Meal Coordination",
        "Shared Grocery Lists",
        "Family Dashboard",
        "Priority Support",
      ],
      limitations: [],
      cta: "Choose Family",
      popular: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading font-bold uppercase text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Choose the plan that fits your needs. Cancel anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Test Mode Indicator */}
        {isTestMode && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-yellow-200 text-sm font-bold">
              <Badge className="bg-yellow-500 text-black text-xs px-2 py-0.5">TEST MODE</Badge>
              <span>Using Razorpay test keys. Use test card: 4111 1111 1111 1111</span>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "bg-gray-900/50 border-white/10 relative",
                plan.popular && "border-primary border-2"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-black text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-heading font-bold uppercase">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    "w-full font-bold uppercase tracking-wide h-12",
                    plan.popular
                      ? "bg-primary hover:bg-primary/90 text-black"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-white/20"
                  )}
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingPlan === plan.name || !!processingPlan}
                >
                  {processingPlan === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Cancel anytime. No long-term commitment required.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

