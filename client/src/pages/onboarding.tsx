import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Loader2, LayoutDashboard } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { saveUserProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

export default function Onboarding() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3; // Reduced to 3 steps for basic onboarding
  const [saving, setSaving] = useState(false);
  const [checkingUserType, setCheckingUserType] = useState(true);

  // Check user type and redirect if business user
  useEffect(() => {
    const checkUserType = async () => {
      if (!authLoading && user) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const customerType = currentUser?.user_metadata?.customer_type;
          
          if (customerType === "business") {
            // Redirect business users to professional onboarding
            setLocation("/professional-onboarding");
            return;
          }
        } catch (error) {
          console.error("Error checking user type:", error);
        }
        setCheckingUserType(false);
      } else if (!authLoading && !isAuthenticated) {
        setLocation("/auth?redirect=/onboarding");
      }
    };

    checkUserType();
  }, [isAuthenticated, authLoading, user, setLocation]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth?redirect=/onboarding");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const nextStep = () => setStep(Math.min(step + 1, totalSteps + 1));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  // Load saved progress from localStorage
  const loadSavedProgress = () => {
    if (!user) return null;
    try {
      const saved = localStorage.getItem(`individual-onboarding-${user.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
    }
    return null;
  };

  const [formData, setFormData] = useState(() => {
    const saved = loadSavedProgress();
    return saved || {
      firstName: "",
      lastName: "",
      phone: "",
      gender: "",
      genderSpecify: "",
      isTransitioning: "",
      transitionMedications: "",
      additionalHealthInfo: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en",
      currency: "USD"
    };
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!user) return;
    const saveProgress = () => {
      try {
        localStorage.setItem(`individual-onboarding-${user.id}`, JSON.stringify(formData));
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    };

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, user]);


  const handleComplete = async () => {
    if (saving) return;
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide your first and last name.",
        variant: "destructive",
      });
      return;
    }

    // Validate gender "Other" fields
    if (formData.gender === "other") {
      if (!formData.genderSpecify) {
        toast({
          title: "Missing Information",
          description: "Please specify your gender identity.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSaving(true);
    try {
      // Refresh session before saving to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Save basic profile data including gender and transition info
      await saveUserProfile({
        onboardingCompleted: true,
        gender: formData.gender === "other" ? formData.genderSpecify : formData.gender,
        // Store transition-related info in a JSON field or as additional metadata
        transitionInfo: formData.gender === "other" ? {
          genderSpecify: formData.genderSpecify,
          isTransitioning: formData.isTransitioning,
          transitionMedications: formData.transitionMedications,
          additionalHealthInfo: formData.additionalHealthInfo,
        } : undefined,
      });

      // Update user metadata with basic info
      if (user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            gender: formData.gender === "other" ? formData.genderSpecify : formData.gender,
            timezone: formData.timezone,
            language: formData.language,
            currency: formData.currency,
            // Store transition info in metadata
            ...(formData.gender === "other" && {
              gender_specify: formData.genderSpecify,
              is_transitioning: formData.isTransitioning,
              transition_medications: formData.transitionMedications,
              additional_health_info: formData.additionalHealthInfo,
            }),
          }
        });

        if (updateError) {
          console.error("Error updating user metadata:", updateError);
          // Don't fail the whole process if metadata update fails
        }
      }

      toast({
        title: "Welcome!",
        description: "Your profile has been set up. You can now generate your first meal plan.",
      });

      // Clear saved progress from localStorage
      if (user) {
        localStorage.removeItem(`individual-onboarding-${user.id}`);
      }

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const errorMessage = error.message || "Failed to save profile. Please try again.";
      
      // If it's an auth error, suggest signing in again
      if (errorMessage.includes("session") || errorMessage.includes("expired") || errorMessage.includes("Unauthorized")) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again to continue.",
          variant: "destructive",
        });
        // Redirect to auth page after a delay
        setTimeout(() => {
          setLocation("/auth?redirect=/onboarding");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setSaving(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  // Show loading if checking auth or user type
  if (authLoading || checkingUserType) {
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

  if (step > totalSteps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-primary">
            {saving ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : (
              <span className="text-4xl">🥗</span>
            )}
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase">
            {saving ? "Saving Your Profile..." : "Profile Complete!"}
          </h2>
          <p className="text-gray-400 text-lg">
            {saving 
              ? "We're saving your information and redirecting you to the dashboard..."
              : "Your profile has been saved. Redirecting to dashboard..."}
          </p>
          {saving && (
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-white/10">
              <div className="bg-primary h-3 rounded-full animate-progress w-full origin-left duration-[1000ms] ease-linear transition-all"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header / Progress */}
      <div className="bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="container max-w-screen-md py-4 px-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link href="/dashboard">
               <Button 
                 variant="ghost" 
                 size="sm"
                 className="text-white hover:text-primary hover:bg-white/10 flex items-center gap-2"
                 title="Back to Dashboard"
               >
                 <LayoutDashboard className="h-4 w-4" />
                 <span className="hidden sm:inline text-xs font-bold uppercase">Dashboard</span>
               </Button>
             </Link>
             {step > 1 && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={prevStep} 
                 className="text-white hover:text-primary hover:bg-white/10"
                 title="Previous Step"
               >
                 <ArrowLeft className="h-5 w-5" />
               </Button>
             )}
             <span className="font-heading font-bold text-primary text-xl italic tracking-tighter">TAILORED<span className="text-white not-italic">MEALPLAN</span></span>
           </div>
           <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">Step {step} of {totalSteps}</span>
        </div>
        <div className="h-1 bg-gray-800 w-full">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(132,204,22,0.5)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 container max-w-screen-md px-4 py-8 md:py-12">
        <Card className="border-white/10 bg-gray-900/50 backdrop-blur shadow-2xl text-white">
          <CardContent className="p-6 md:p-10">
            
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Welcome to TailoredMealPlan</h2>
                  <p className="text-gray-400 text-lg">Let's start with some basic information about you.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">First Name *</Label>
                      <Input 
                        type="text" 
                        placeholder="John" 
                        className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">Last Name *</Label>
                      <Input 
                        type="text" 
                        placeholder="Doe" 
                        className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">Phone Number (Optional)</Label>
                    <Input 
                      type="tel" 
                      placeholder="+1 (555) 123-4567" 
                      className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-gray-300 uppercase font-bold block">Gender</Label>
                    <RadioGroup 
                      value={formData.gender} 
                      onValueChange={(v) => setFormData({...formData, gender: v, genderSpecify: "", isTransitioning: "", transitionMedications: ""})} 
                      className="grid grid-cols-3 gap-4"
                    >
                      {["Female", "Male", "Other"].map((g) => (
                        <div key={g}>
                          <RadioGroupItem value={g.toLowerCase()} id={g.toLowerCase()} className="peer sr-only" />
                          <Label
                            htmlFor={g.toLowerCase()}
                            className="flex flex-col items-center justify-between rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide"
                          >
                            {g}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Show additional fields when "Other" is selected */}
                    {formData.gender === "other" && (
                      <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-none animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label className="text-gray-300 uppercase font-bold text-sm">Please specify your gender identity *</Label>
                          <Input 
                            type="text" 
                            placeholder="e.g., Non-binary, Genderqueer, Agender, etc." 
                            className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                            value={formData.genderSpecify}
                            onChange={(e) => setFormData({...formData, genderSpecify: e.target.value})}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300 uppercase font-bold text-sm">Are you currently transitioning or planning to transition?</Label>
                          <RadioGroup 
                            value={formData.isTransitioning} 
                            onValueChange={(v) => setFormData({...formData, isTransitioning: v, transitionMedications: v === "no" ? "" : formData.transitionMedications})} 
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="yes" id="transitioning-yes" className="peer sr-only" />
                              <Label
                                htmlFor="transitioning-yes"
                                className="flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-3 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                              >
                                Yes
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="no" id="transitioning-no" className="peer sr-only" />
                              <Label
                                htmlFor="transitioning-no"
                                className="flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-3 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                              >
                                No
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {formData.isTransitioning === "yes" && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-gray-300 uppercase font-bold text-sm">Hormones or medications you're taking (if applicable)</Label>
                            <Textarea 
                              placeholder="e.g., Testosterone, Estrogen, Anti-androgens, etc. This helps us create meal plans that support your health during transition."
                              className="bg-black/40 border-white/20 text-lg focus:border-primary min-h-[100px] resize-none"
                              value={formData.transitionMedications}
                              onChange={(e) => setFormData({...formData, transitionMedications: e.target.value})}
                            />
                            <p className="text-xs text-gray-400 italic">This information is kept private and helps us tailor nutritional recommendations to support your transition journey.</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-gray-300 uppercase font-bold text-sm">Additional health information for AI meal plan generation</Label>
                          <Textarea 
                            placeholder="Any other relevant information about your health, body composition goals, or nutritional needs that would help our AI create a better meal plan for you..."
                            className="bg-black/40 border-white/20 text-lg focus:border-primary min-h-[120px] resize-none"
                            value={formData.additionalHealthInfo}
                            onChange={(e) => setFormData({...formData, additionalHealthInfo: e.target.value})}
                          />
                          <p className="text-xs text-gray-400 italic">This helps our AI generator create more personalized and accurate meal plans tailored to your unique needs.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Your Preferences</h2>
                  <p className="text-gray-400 text-lg">We'll use these settings to personalize your experience.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">Language</Label>
                    <select
                      className="w-full bg-black/40 border border-white/20 h-12 text-lg focus:border-primary text-white px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="hi">Hindi</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">Currency</Label>
                    <select
                      className="w-full bg-black/40 border border-white/20 h-12 text-lg focus:border-primary text-white px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">Timezone</Label>
                    <Input 
                      type="text" 
                      value={formData.timezone}
                      className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                      readOnly
                    />
                    <p className="text-sm text-gray-400">Detected automatically. You can change this in settings later.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Ready to Start */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2 text-center">
                  <h2 className="font-heading text-4xl font-bold uppercase">You're All Set!</h2>
                  <p className="text-gray-400 text-lg">We've saved your basic information.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-primary/10 border border-primary/20 rounded-none">
                    <h3 className="font-bold text-xl uppercase mb-4 text-primary">What's Next?</h3>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>When you're ready to create your first meal plan, we'll ask you detailed questions about your health goals, dietary preferences, and nutritional needs.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>You can generate meal plans anytime from your dashboard.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Your preferences are saved and can be updated anytime in settings.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 text-sm text-gray-400">
                    <p className="font-bold text-white mb-2">Note:</p>
                    <p>The detailed questionnaire (health goals, activity level, dietary restrictions, allergies, etc.) will be asked when you generate your first meal plan. This ensures we have the most up-to-date information for creating your personalized meal plan.</p>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="px-6 md:px-10 pb-8 flex justify-between">
             {step === 1 ? (
               <Button variant="ghost" disabled className="invisible">Back</Button>
             ) : (
               <Button variant="outline" onClick={prevStep} className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide">Back</Button>
             )}
             
             <Button 
               onClick={step === totalSteps ? handleComplete : nextStep}
               disabled={saving}
               className="bg-primary hover:bg-primary/90 text-black px-10 h-12 font-bold uppercase tracking-widest rounded-none"
             >
               {saving ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Saving...
                 </>
               ) : (
                 step === totalSteps ? "Complete" : "Next"
               )}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
