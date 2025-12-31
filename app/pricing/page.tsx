"use client";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createRazorpayOrder, apiRequest } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Spinner } from "@/components/ui/spinner";

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Map plan names to plan IDs
  const getPlanId = (planName: string): string => {
    const planMap: Record<string, string> = {
      "Free Tier": "free",
      "Individual": "individual",
      "Family": "family",
    };
    return planMap[planName] || planName.toLowerCase().replace(/\s+/g, "_");
  };

  const handleSubscribe = async (plan: any) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // All plans are B2C now
      const userType = "individual";
      
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      router.push(`/auth?userType=${userType}&redirect=/pricing`);
      return;
    }

    // Skip payment for free tier
    if (plan.name === "Free Tier") {
      // Free tier is always individual
      if (!isAuthenticated) {
        // Not logged in, redirect to auth with onboarding redirect
        router.push("/auth?userType=individual&redirect=/onboarding");
      } else {
        // Already logged in, just redirect to onboarding (or dashboard if completed)
        router.push("/onboarding");
      }
      return;
    }

    setProcessingPlan(plan.name);

    try {
      const planId = getPlanId(plan.name);
      const billingInterval = "monthly"; // Only monthly billing for MVP

      // CHECK: If this is test user, bypass payment
      const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID || "";
      const isTestUser = user?.id === TEST_USER_ID;

      if (isTestUser && TEST_USER_ID) {
        // Bypass payment for test user - directly assign plan
        try {
          const data = await apiRequest<{
            success: boolean;
            message: string;
            subscription: any;
            credits: number;
          }>("/subscriptions/assign-test-plan", {
            method: "POST",
            body: JSON.stringify({
              planId,
              billingInterval,
            }),
          });

          toast({
            title: "Success!",
            description: data.message || `You've been assigned the ${plan.name} plan (Test Mode)`,
          });

          setProcessingPlan(null);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
          return;
        } catch (testError: any) {
          toast({
            title: "Error",
            description: testError.message || "Failed to assign test plan. Please try again.",
            variant: "destructive",
          });
          setProcessingPlan(null);
          return;
        }
      }

      // For other users, proceed with normal payment flow
      // (This will be enabled when PayPal is ready)
      // TEMPORARILY DISABLED - Uncomment when PayPal is ready
      /*
      const orderData = await createRazorpayOrder({
        planId,
        billingInterval,
      });

      // Get user info
      const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
      const userEmail = user?.email || "";

      // Open Razorpay checkout
      // Payment verification will be handled by the /payment/processing page
      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        planName: `${plan.name} - Monthly`,
        userEmail,
        userName,
        planId: orderData.planId,
        billingInterval,
        onFailure: (error: any) => {
          toast({
            title: "Payment Failed",
            description: error.reason || "Payment was cancelled or failed. Please try again.",
            variant: "destructive",
          });
          setProcessingPlan(null);
        },
      });
      */
      
      // TEMPORARY: Show message for non-test users
      toast({
        title: "Payment Coming Soon",
        description: "Paid plans will be available soon. For now, enjoy our free tier!",
        variant: "default",
      });
      setProcessingPlan(null);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  interface MealPlanOptions {
    daily: { count: number; credits: number };
    weekly: { count: number; credits: number };
    monthly?: { count: number; credits: number };
  }

  interface PlanCard {
    name: string;
    price: string;
    period: string;
    description: string;
    mealPlanOptions: MealPlanOptions;
    features: string[];
    limitations: string[];
    cta: string;
    popular: boolean;
  }

  const plans: PlanCard[] = [
    {
      name: "Free Tier",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out personalized nutrition with 7 lifetime credits.",
      mealPlanOptions: {
        daily: { count: 1, credits: 1 },
        weekly: { count: 1, credits: 2 },
      },
      features: [
        "Full Health Questionnaire",
        "Religious & Medical Diets",
        "Dietary Preferences Support",
        "Detailed Recipes with Ingredients",
        "Complete Nutritional Breakdown",
        "Organized Grocery Lists",
        "PDF Export",
      ],
      limitations: [
        "Watermarked PDFs",
        "7 Credits Total (Lifetime)",
        "Monthly Plans Not Available"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Individual",
      price: "$7.99",
      period: "per month",
      description: "Unlimited nutrition planning with 42 credits per month. Perfect for consistent meal planning.",
      mealPlanOptions: {
        daily: { count: 30, credits: 1 },
        weekly: { count: 4, credits: 2 },
        monthly: { count: 1, credits: 4 },
      },
      features: [
        "Full Health Questionnaire",
        "Religious & Medical Diets",
        "Dietary Preferences Support",
        "Detailed Recipes with Ingredients",
        "Complete Nutritional Breakdown",
        "Organized Grocery Lists",
        "Monthly Plans (30 days)",
        "Clean PDF Exports (No Watermarks)",
        "42 Credits Per Month"
      ],
      limitations: [],
      cta: "Choose Individual",
      popular: true
    },
    {
      name: "Family",
      price: "$12.99",
      period: "per month",
      description: "Perfect for families with up to 5 members. 210 credits per month shared across all family members.",
      mealPlanOptions: {
        daily: { count: 150, credits: 1 }, // 30 per member × 5
        weekly: { count: 20, credits: 2 }, // 4 per member × 5
        monthly: { count: 5, credits: 4 }, // 1 per member × 5
      },
      features: [
        "Up to 5 Family Members",
        "Individual Profiles & Goals",
        "Full Health Questionnaire (Per Member)",
        "Religious & Medical Diets",
        "Dietary Preferences Support",
        "Detailed Recipes with Ingredients",
        "Complete Nutritional Breakdown",
        "Organized Grocery Lists",
        "Monthly Plans (30 days)",
        "Clean PDF Exports (No Watermarks)",
        "210 Credits Per Month (Shared)"
      ],
      limitations: [],
      cta: "Choose Family",
      popular: false
    },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  return (
    <Layout>
      <div className="bg-black text-white py-24 md:py-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 text-white">
              Simple, <span className="text-primary">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Choose the plan that fits your needs. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "relative flex flex-col border-2 transition-all duration-300 hover:shadow-xl bg-gray-900/50 backdrop-blur",
                  plan.popular ? "border-primary shadow-lg shadow-primary/20 scale-105 z-10" : "border-white/10 shadow-md hover:border-primary/30"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold font-mono text-white">{plan.price}</span>
                      <span className="text-gray-400 ml-2">{plan.period}</span>
                    </div>

                    {/* What You Can Create Section */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                        What You Can Create
                      </h3>
                      <div className={cn(
                        "grid gap-3",
                        plan.mealPlanOptions.monthly ? "grid-cols-3" : "grid-cols-2"
                      )}>
                        {/* Daily Plans */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">📅</div>
                          <div className="text-xl font-bold text-white mb-1">
                            {plan.mealPlanOptions.daily.count}
                          </div>
                          <div className="text-xs text-gray-300 mb-1">Daily Plans</div>
                          <div className="text-xs text-primary font-medium">
                            {plan.mealPlanOptions.daily.credits} credit{plan.mealPlanOptions.daily.credits > 1 ? 's' : ''}
                          </div>
                        </div>
                        {/* Weekly Plans */}
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">📆</div>
                          <div className="text-xl font-bold text-white mb-1">
                            {plan.mealPlanOptions.weekly.count}
                          </div>
                          <div className="text-xs text-gray-300 mb-1">Weekly Plans</div>
                          <div className="text-xs text-primary font-medium">
                            {plan.mealPlanOptions.weekly.credits} credit{plan.mealPlanOptions.weekly.credits > 1 ? 's' : ''}
                          </div>
                        </div>
                        {/* Monthly Plans - Only show for paid plans */}
                        {plan.mealPlanOptions.monthly && (
                          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">📅</div>
                            <div className="text-xl font-bold text-white mb-1">
                              {plan.mealPlanOptions.monthly.count}
                            </div>
                            <div className="text-xs text-gray-300 mb-1">Monthly Plans</div>
                            <div className="text-xs text-primary font-medium">
                              {plan.mealPlanOptions.monthly.credits} credit{plan.mealPlanOptions.monthly.credits > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-3">
                        Mix and match any combination
                      </p>
                    </div>

                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start gap-3 opacity-50">
                          <X className="h-5 w-5 text-gray-500 shrink-0" />
                          <span className="text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={processingPlan === plan.name}
                      className={cn(
                        "w-full h-12 font-medium text-lg font-bold uppercase tracking-wide rounded-none",
                        plan.popular ? "bg-primary hover:bg-primary/90 text-black" : "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black",
                        processingPlan === plan.name && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processingPlan === plan.name ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>


          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-16 text-center"
          >
             <h3 className="font-heading text-3xl font-bold mb-8 text-white uppercase">Frequently Asked Questions</h3>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
               <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                 <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Can I cancel anytime?</h4>
                 <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.</p>
               </div>
               <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                 <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Do you offer refunds?</h4>
                 <p className="text-gray-400 text-sm">We offer a money-back guarantee for all paid plans if you're not satisfied. Contact support for details.</p>
               </div>
               <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                 <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Can I mix different plan types?</h4>
                 <p className="text-gray-400 text-sm">Yes! You can use your monthly allocation however you want - mix daily, weekly, and monthly plans as needed. Monthly plans count as 4x weekly plans.</p>
               </div>
             </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
