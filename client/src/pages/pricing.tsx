import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Spinner } from "@/components/ui/spinner";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [view, setView] = useState<"b2c" | "b2b">("b2c");
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Map plan names to plan IDs
  const getPlanId = (planName: string): string => {
    const planMap: Record<string, string> = {
      "Free Tier": "free",
      "Individual": "individual",
      "Family": "family",
      "Starter": "starter",
      "Growth": "growth",
      "Professional": "professional",
      "Enterprise": "enterprise",
    };
    return planMap[planName] || planName.toLowerCase().replace(/\s+/g, "_");
  };

  const handleSubscribe = async (plan: any) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // Determine user type from plan
      const isB2BPlan = ["Starter", "Growth", "Professional", "Enterprise"].includes(plan.name);
      const userType = isB2BPlan ? "professional" : "individual";
      
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      setLocation(`/auth?userType=${userType}&redirect=/pricing`);
      return;
    }

    // Skip payment for free tier
    if (plan.name === "Free Tier") {
      // Free tier is always individual
      setLocation("/auth?userType=individual&redirect=/onboarding");
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
              setLocation("/dashboard");
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

  const b2cPlans = [
    {
      name: "Free Tier",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out personalized nutrition.",
      features: [
        "1 Meal Plan (Lifetime)",
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
      price: isAnnual ? "$7.40" : "$9",
      period: "per month",
      description: "For dedicated health enthusiasts.",
      features: [
        "50 Meal Plans / Month",
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
      price: isAnnual ? "$15.75" : "$19",
      period: "per month",
      description: "Healthy habits for the whole house.",
      features: [
        "Everything in Individual",
        "Up to 5 Family Members",
        "Family Meal Coordination",
        "Shared Grocery Lists",
        "Family Dashboard",
        "Priority Support"
      ],
      limitations: [],
      cta: "Choose Family",
      popular: false
    }
  ];

  const b2bPlans = [
    {
      name: "Starter",
      price: isAnnual ? "$24" : "$29",
      period: "per month",
      description: "For solo nutritionists and coaches.",
      features: [
        "Up to 50 Clients",
        "80 Weekly Plans / Month",
        "10 Monthly Plans / Month",
        "1 Team Seat",
        "Basic White-labeling",
        "PDF Export with Logo",
        "Client Dashboard",
        "Email Support"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: false
    },
    {
      name: "Growth",
      price: isAnnual ? "$39" : "$49",
      period: "per month",
      description: "For expanding practices.",
      features: [
        "Up to 150 Clients",
        "200 Weekly Plans / Month",
        "25 Monthly Plans / Month",
        "2 Team Seats",
        "Full White-labeling",
        "Custom Branding",
        "Client Dashboard",
        "Priority Email Support"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: false
    },
    {
      name: "Professional",
      price: isAnnual ? "$79" : "$99",
      period: "per month",
      description: "For growing clinics and gyms.",
      features: [
        "Up to 400 Clients",
        "500 Weekly Plans / Month",
        "60 Monthly Plans / Month",
        "5 Team Seats",
        "Full White-labeling",
        "Custom Branding",
        "Bulk Generation",
        "API Access",
        "Priority Support"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: isAnnual ? "$159" : "$199",
      period: "per month",
      description: "For large organizations.",
      features: [
        "Up to 1,500 Clients",
        "1,500 Weekly Plans / Month",
        "150 Monthly Plans / Month",
        "Unlimited Team Seats",
        "Complete White-labeling",
        "Custom Domain",
        "Dedicated Account Manager",
        "SLA Guarantee",
        "Advanced Analytics",
        "API Access"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const plans = view === "b2c" ? b2cPlans : b2bPlans;

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

            {/* View Toggle */}
            <div className="inline-flex bg-gray-900/50 border border-white/10 p-1 rounded-lg mb-8">
              <button 
                onClick={() => setView("b2c")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-all",
                  view === "b2c" ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                For Individuals & Families
              </button>
              <button 
                onClick={() => setView("b2b")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-all",
                  view === "b2b" ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                For Professionals
              </button>
            </div>

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

          <div className={cn(
            "grid gap-8",
            view === "b2c" ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"
          )}>
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
               {view === "b2b" && (
                 <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                   <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> What's the difference between weekly and monthly plans?</h4>
                   <p className="text-gray-400 text-sm">Weekly plans cover 1-7 day meal plans, perfect for regular check-ins. Monthly plans are comprehensive 30-day plans with full grocery lists.</p>
                 </div>
               )}
               {view === "b2b" && (
                 <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                   <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Can I upgrade mid-cycle?</h4>
                   <p className="text-gray-400 text-sm">Yes! When you upgrade, you'll get immediate access to higher limits and we'll prorate the cost.</p>
                 </div>
               )}
             </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
