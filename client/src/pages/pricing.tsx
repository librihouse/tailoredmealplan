import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, X, HelpCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [view, setView] = useState<"b2c" | "b2b">("b2c");

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
      price: "$49",
      period: "per month",
      description: "For solo nutritionists and coaches.",
      features: [
        "Up to 100 Clients",
        "200 Meal Plans / Month",
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
      name: "Professional",
      price: "$129",
      period: "per month",
      description: "For growing clinics and gyms.",
      features: [
        "Up to 500 Clients",
        "1,500 Meal Plans / Month",
        "Full White-labeling",
        "Custom Branding",
        "Bulk Generation",
        "3 Team Seats",
        "Priority Support"
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$349",
      period: "per month",
      description: "For large organizations.",
      features: [
        "Up to 2,000 Clients",
        "6,000 Meal Plans / Month",
        "Complete White-labeling",
        "Custom Domain",
        "Unlimited Team Members",
        "Dedicated Account Manager"
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

          <div className="grid md:grid-cols-3 gap-8">
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
                    <Link href={view === "b2c" ? "/onboarding" : "/contact"} className="w-full">
                      <Button className={cn(
                        "w-full h-12 font-medium text-lg font-bold uppercase tracking-wide rounded-none",
                        plan.popular ? "bg-primary hover:bg-primary/90 text-black" : "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black"
                      )}>
                        {plan.cta}
                      </Button>
                    </Link>
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
             <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
               <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                 <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Can I cancel anytime?</h4>
                 <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.</p>
               </div>
               <div className="bg-gray-900/50 border border-white/10 p-6 rounded-lg backdrop-blur">
                 <h4 className="font-bold mb-2 flex items-center gap-2 text-white"><HelpCircle className="h-4 w-4 text-primary"/> Do you offer refunds?</h4>
                 <p className="text-gray-400 text-sm">We offer a 7-day money-back guarantee for all paid plans if you're not satisfied.</p>
               </div>
             </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
