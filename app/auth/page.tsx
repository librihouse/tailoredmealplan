"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { getOnboardingStatus } from "@/lib/api";

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "signup";
  const { signUp, signIn } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get user type and redirect URL from query params
  const userType = searchParams.get("userType") || "individual";
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const name = `${firstName} ${lastName}`.trim() || undefined;
      const result = await signUp(email, password, name);
      
      if (result?.user) {
        setSuccess(true);
        
        // Get current user to check if customer_type is already set
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const existingCustomerType = currentUser?.user_metadata?.customer_type;
        
        // Determine redirect based on plan
        let finalRedirect = redirect;
        
        // If customer_type is not set, go to customer-type-selection
        if (!existingCustomerType) {
          finalRedirect = "/customer-type-selection";
        } else {
          // Customer type is set, determine redirect based on type and redirect param
          const customerType = existingCustomerType;
          
          // If redirect is /pricing and user selected free tier, go to onboarding
          if (redirect === "/pricing" && userType === "individual") {
            finalRedirect = "/onboarding";
          } else if (redirect === "/pricing" && userType === "professional") {
            // Professional users go to professional onboarding
            finalRedirect = "/professional-onboarding";
          } else if (redirect === "/dashboard" || redirect === "/") {
            // New signup should go to appropriate onboarding
            if (customerType === "business") {
              finalRedirect = "/professional-onboarding";
            } else {
              finalRedirect = "/onboarding";
            }
          } else if (redirect === "/onboarding" || redirect === "/professional-onboarding") {
            // Already going to onboarding, keep it
            finalRedirect = redirect;
          }
        }
        
        // Redirect after successful signup
        setTimeout(() => {
          router.push(finalRedirect);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Get user metadata to determine redirect
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const customerType = currentUser?.user_metadata?.customer_type;
      
      // Determine redirect based on customer type and onboarding status
      let finalRedirect = redirect;
      
      // If redirect is /dashboard, check onboarding status
      if (redirect === "/dashboard" || redirect === "/") {
        try {
          const onboardingStatus = await getOnboardingStatus();
          
          if (!onboardingStatus.completed) {
            // Redirect to appropriate onboarding if not completed
            if (customerType === "business") {
              finalRedirect = "/professional-onboarding";
            } else {
              finalRedirect = "/onboarding";
            }
          } else {
            // Onboarding complete, go to dashboard
            finalRedirect = "/dashboard";
          }
        } catch (error) {
          // If we can't check onboarding status, check customer_type
          if (!customerType) {
            // No customer type set, go to selection
            finalRedirect = "/customer-type-selection";
          } else if (customerType === "business") {
            finalRedirect = "/professional-onboarding";
          } else {
            finalRedirect = "/onboarding";
          }
        }
      }
      
      router.push(finalRedirect);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md space-y-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-white">Welcome to TailoredMealPlan</h1>
            <p className="text-muted-foreground mt-2">Your journey to better health starts here.</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password">
                          <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-light text-white"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Log In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="bg-green-900/50 border-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-200">
                        Account created! Redirecting...
                      </AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input 
                          id="first-name" 
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input 
                          id="last-name" 
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input 
                        id="email-signup" 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Password</Label>
                      <Input 
                        id="password-signup" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        required
                        disabled={loading}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </label>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-light text-white"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden lg:flex bg-primary flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
        
        <div className="relative z-10">
           <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
             <span className="bg-white/20 p-1 rounded">TMP</span> TailoredMealPlan
           </h3>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <CheckCircle key={i} className="h-5 w-5 text-accent fill-accent" />
            ))}
          </div>
          <blockquote className="font-serif text-3xl font-bold leading-tight mb-6">
            "I've tried every diet app out there. This is the only one that actually understood my cultural dietary needs while helping me hit my macros."
          </blockquote>
          <div>
            <p className="font-bold text-lg">Amira K.</p>
            <p className="text-primary-foreground/80">Lost 15kg in 3 months</p>
          </div>
        </div>
      </div>
    </div>
  );
}

