"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md space-y-8">
          <Link href="/auth">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </Link>
          
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-white">Set New Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your new password below.
            </p>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-900/50 border-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-200">
                    Password reset successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}
              
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light text-white"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-8 bg-primary/10 rounded-lg border border-primary/20">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-center text-gray-400 text-sm">
                    Your password has been reset successfully. You will be redirected to the login page shortly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
            "Security and convenience go hand in hand. Set a strong password and keep your account safe."
          </blockquote>
          <div>
            <p className="font-bold text-lg">Secure & Simple</p>
            <p className="text-primary-foreground/80">Your data is protected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

