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
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Spinner } from "@/components/ui/spinner";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
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
      const billingInterval = isAnnual ? "annual" : "monthly";

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
        planName: `${plan.name} - ${billingInterval === "annual" ? "Annual" : "Monthly"}`,
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

            // Redirect to dashboard
            setTimeout(() => {
              router.push("/dashboard");
            }, 1500);
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

  interface MealPlanOptions {
    daily: { count: number; credits: number };
    weekly: { count: number; credits: number };
    monthly: { count: number; credits: number };
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
      description: "Perfect for trying out personalized nutrition.",
      mealPlanOptions: {
        daily: { count: 1, credits: 1 },
        weekly: { count: 1, credits: 2 },
        monthly: { count: 1, credits: 4 },
      },
      features: [
        "Basic Questionnaire",
        "Recipes with Ingredients",
        "Nutritional Breakdown",
      ],
      limitations: [
        "Grocery Lists",
        "Progress Tracking",
        "AI Chat Support",
        "Watermarked Exports"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Individual",
      price: isAnnual ? "$7.40" : "$9.99",
      period: "per month",
      description: "Comprehensive nutrition planning for dedicated health enthusiasts.",
      mealPlanOptions: {
        daily: { count: 30, credits: 1 },
        weekly: { count: 4, credits: 2 },
        monthly: { count: 1, credits: 4 },
      },
      features: [
        "Full Dietary Customization",
        "Religious & Medical Diets",
        "Smart Grocery Lists",
        "Progress Tracking",
        "AI Chat Support",
        "No Watermarks"
      ],
      limitations: [],
      cta: "Start 7-Day Trial",
      popular: true
    },
    {
      name: "Family",
      price: isAnnual ? "$12.99" : "$14.99",
      period: "per month",
      description: "Perfect for families with up to 5 members. Each member gets 30 daily plans, 4 weekly plans, and 1 monthly plan per month.",
      mealPlanOptions: {
        daily: { count: 150, credits: 1 }, // 30 per member × 5
        weekly: { count: 20, credits: 2 }, // 4 per member × 5
        monthly: { count: 5, credits: 4 }, // 1 per member × 5
      },
      features: [
        "Up to 5 Family Members",
        "Individual Profiles & Goals",
        "Shared Meal Plans",
        "Full Dietary Customization",
        "Religious & Medical Diets",
        "Smart Grocery Lists",
        "Progress Tracking",
        "AI Chat Support",
        "No Watermarks"
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

            {/* Annual Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={cn("text-sm font-medium", !isAnnual ? "text-white" : "text-gray-400")}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
                  isAnnual ? "bg-primary" : "bg-gray-700"
                )}
              >
                <span 
                  className={cn(
                    "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm",
                    isAnnual ? "translate-x-6" : "translate-x-0"
                  )} 
                />
              </button>
              <span className={cn("text-sm font-medium flex items-center gap-2", isAnnual ? "text-white" : "text-gray-400")}>
                Annual <span className="text-xs text-primary font-bold bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">Save ~20%</span>
              </span>
            </div>
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
                      <div className="grid grid-cols-3 gap-3">
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
                        {/* Monthly Plans */}
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
                 <p className="text-gray-400 text-sm">We offer a 7-day money-back guarantee for all paid plans if you're not satisfied.</p>
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
