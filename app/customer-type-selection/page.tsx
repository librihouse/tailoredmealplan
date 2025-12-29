"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

export default function CustomerTypeSelection() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated or if customer_type is already set
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!authLoading && !isAuthenticated) {
        router.push("/auth?redirect=/customer-type-selection");
        return;
      }
      
      if (!authLoading && user) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const customerType = currentUser?.user_metadata?.customer_type;
          
          // If customer_type is already set, redirect to appropriate onboarding
          if (customerType === "business") {
            router.push("/professional-onboarding");
          } else if (customerType === "individual") {
            router.push("/onboarding");
          }
        } catch (error) {
          // Ignore errors, let user proceed
        }
      }
    };
    
    checkAndRedirect();
  }, [isAuthenticated, authLoading, user, router]);

  const handleSelectType = async (customerType: "individual" | "business") => {
    if (saving) return;
    
    setSaving(true);
    try {
      // Store customer type in user metadata
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: {
            customer_type: customerType,
          },
        });

        if (error) {
          throw error;
        }

        // Route to appropriate onboarding
        if (customerType === "individual") {
          router.push("/onboarding");
        } else {
          router.push("/professional-onboarding");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save customer type. Please try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  // Show loading if checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Spinner />
      </div>
    );
  }

  // Redirect if not authenticated (handled by useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="container max-w-screen-md py-4 px-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-primary hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-heading font-bold text-primary text-xl italic tracking-tighter">
            TAILORED<span className="text-white not-italic">MEALPLAN</span>
          </span>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="flex-1 container max-w-screen-lg px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-4">
            Let's Get Started
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            First, tell us who you are so we can personalize your experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Individual Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card
              className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all cursor-pointer group h-full"
              onClick={() => !saving && handleSelectType("individual")}
            >
              <CardContent className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase mb-4">
                  Individual
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  I want personalized meal plans for myself and my family
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2 mb-8 flex-grow">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Personal health questionnaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Daily, weekly, and monthly meal plans</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Track your nutrition goals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Personalized recipes and grocery lists</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12"
                  disabled={saving}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectType("individual");
                  }}
                >
                  {saving ? (
                    "Loading..."
                  ) : (
                    <>
                      Choose Individual
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all cursor-pointer group h-full"
              onClick={() => !saving && handleSelectType("business")}
            >
              <CardContent className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase mb-4">
                  Business
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  I'm a business, coach, gym, or clinic serving clients
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2 mb-8 flex-grow">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>White-label meal plans with your branding</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Manage multiple clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Custom logo and theme colors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Bulk meal plan generation</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide h-12"
                  disabled={saving}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectType("business");
                  }}
                >
                  {saving ? (
                    "Loading..."
                  ) : (
                    <>
                      Choose Business
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            You can change this later in your settings
          </p>
        </div>
      </div>
    </div>
  );
}

