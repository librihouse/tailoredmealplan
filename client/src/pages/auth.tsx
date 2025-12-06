import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [location] = useLocation();
  const defaultTab = location.includes("login") ? "login" : "signup";
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-bg-cream">
        <div className="w-full max-w-md space-y-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-text-dark">Welcome to TailoredMealPlan</h1>
            <p className="text-muted-foreground mt-2">Your journey to better health starts here.</p>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password">
                        <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                      </Link>
                    </div>
                    <Input id="password" type="password" />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary-light text-white">Log In</Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-bg-cream px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">Google</Button>
                    <Button variant="outline">Apple</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input id="first-name" placeholder="Jane" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input id="last-name" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" />
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="terms" className="rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the <span className="text-primary hover:underline cursor-pointer">Terms</span> and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
                    </label>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary-light text-white">Create Account</Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-bg-cream px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">Google</Button>
                    <Button variant="outline">Apple</Button>
                  </div>
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
