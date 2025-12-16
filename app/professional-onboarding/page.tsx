"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Upload, Image, X, Check, Home, LayoutDashboard } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { saveBusinessProfile, generateMealPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

const BUSINESS_TYPES = [
  "Nutritionist",
  "Dietitian",
  "Personal Trainer",
  "Gym/Fitness Studio",
  "Medical Clinic",
  "Wellness Coach",
  "Corporate Wellness",
  "Other",
];

export default function ProfessionalOnboarding() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth?redirect=/professional-onboarding");
    }
  }, [isAuthenticated, authLoading, router.push]);

  const nextStep = () => setStep(Math.min(step + 1, totalSteps + 1));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  // Load saved progress from localStorage
  const loadSavedProgress = () => {
    if (!user) return null;
    try {
      const saved = localStorage.getItem(`business-onboarding-${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't restore logoUrl from localStorage (too large, will cause issues)
        const { logoUrl, logoFile, ...rest } = parsed;
        return rest;
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
    }
    return null;
  };

  const [formData, setFormData] = useState(() => {
    const saved = loadSavedProgress();
    return saved || {
      businessName: "",
      businessType: "",
      website: "",
      phone: "",
      tagline: "",
      logoFile: null as File | null,
      logoUrl: "",
      themeColors: {
        primary: "#10b981",
        secondary: "#059669",
        background: "dark" as "light" | "dark",
      },
      freeDailyPlan: false,
    };
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!user) return;
    const saveProgress = () => {
      try {
        // Don't save logoUrl to localStorage (too large)
        const { logoUrl, logoFile, ...dataToSave } = formData;
        localStorage.setItem(`business-onboarding-${user.id}`, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    };

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, user]);

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const base64String = canvas.toDataURL('image/jpeg', quality);
          resolve(base64String);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;

    // Check file size first (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Compress and resize image before converting to base64
      const compressedBase64 = await compressImage(file, 800, 800, 0.7);
      
      // Check if compressed image is still too large (limit to ~2MB base64)
      if (compressedBase64.length > 2 * 1024 * 1024) {
        // Try with more aggressive compression
        const moreCompressed = await compressImage(file, 600, 600, 0.6);
        setFormData({ ...formData, logoUrl: moreCompressed, logoFile: file });
      } else {
        setFormData({ ...formData, logoUrl: compressedBase64, logoFile: file });
      }
      
      setUploadingLogo(false);
      toast({
        title: "Logo uploaded",
        description: "Logo has been uploaded and compressed successfully.",
      });
    } catch (error: any) {
      setUploadingLogo(false);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (saving || !formData.businessName) {
      if (!formData.businessName) {
        toast({
          title: "Required Field",
          description: "Business name is required.",
          variant: "destructive",
        });
      }
      return;
    }

    setSaving(true);
    try {
      // Check if logo is too large even after compression (limit to 1MB base64)
      let logoUrlToSend = formData.logoUrl;
      if (logoUrlToSend) {
        // Base64 strings are ~33% larger than the original binary
        // Limit to 1MB base64 string (~750KB actual image)
        if (logoUrlToSend.length > 1024 * 1024) {
          console.warn("Logo too large, skipping logo upload");
          toast({
            title: "Logo too large",
            description: "Saving without logo. You can add it later in settings.",
            variant: "default",
          });
          logoUrlToSend = undefined;
        }
      }

      // Save business profile (logo is optional)
      await saveBusinessProfile({
        businessName: formData.businessName,
        businessType: formData.businessType || undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        tagline: formData.tagline || undefined,
        logoUrl: logoUrlToSend, // Can be undefined
        themeColors: formData.themeColors,
        freeDailyPlan: formData.freeDailyPlan,
      });

      toast({
        title: "Profile saved!",
        description: "Your business profile has been saved successfully.",
      });

      // If free daily plan requested, generate it
      if (formData.freeDailyPlan) {
        toast({
          title: "Generating free daily plan...",
          description: "This may take a few moments.",
        });

        try {
          // Generate a basic daily plan
          await generateMealPlan({
            planType: "daily",
            userProfile: {
              gender: "female",
              age: 30,
              height: 165,
              currentWeight: 70,
              targetWeight: 65,
              goal: "maintain",
              activity: "moderate",
              diet: [],
              religious: "none",
              conditions: [],
              allergies: [],
            },
          });

          toast({
            title: "Free daily plan generated!",
            description: "Check your meal plans to view it.",
          });
        } catch (error: any) {
          console.error("Failed to generate free plan:", error);
          // Don't fail the whole onboarding if plan generation fails
          toast({
            title: "Note",
            description: "Profile saved, but free plan generation failed. You can generate plans later.",
          });
        }
      }

      // Clear saved progress from localStorage
      if (user) {
        localStorage.removeItem(`business-onboarding-${user.id}`);
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const progress = (step / totalSteps) * 100;

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

  if (step > totalSteps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-primary">
            {saving ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : (
              <span className="text-4xl">🏢</span>
            )}
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase">
            {saving ? "Saving Your Profile..." : "Profile Complete!"}
          </h2>
          <p className="text-gray-400 text-lg">
            {saving
              ? "We're saving your information and redirecting you to the dashboard..."
              : "Your business profile has been saved. Redirecting to dashboard..."}
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
            <span className="font-heading font-bold text-primary text-xl italic tracking-tighter">
              TAILORED<span className="text-white not-italic">MEALPLAN</span>
            </span>
          </div>
          <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">
            Step {step} of {totalSteps}
          </span>
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
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">
                    Business Information
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Tell us about your business to get started.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Acme Nutrition Clinic"
                      className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({ ...formData, businessName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">
                      Business Type
                    </Label>
                    <RadioGroup
                      value={formData.businessType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, businessType: v })
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <div key={type}>
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type}
                            className="flex items-center justify-center rounded-none border border-white/20 bg-black/40 p-4 hover:bg-white/5 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all font-bold uppercase tracking-wide text-sm"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">
                        Website
                      </Label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">
                        Phone
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">
                      Tagline
                    </Label>
                    <Textarea
                      placeholder="A brief description of your business..."
                      className="bg-black/40 border-white/20 min-h-[100px] text-lg focus:border-primary resize-none"
                      value={formData.tagline}
                      onChange={(e) =>
                        setFormData({ ...formData, tagline: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Logo Upload */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">
                    Upload Your Logo
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Add your business logo to personalize meal plans (optional - you can skip this step).
                  </p>
                </div>

                <div className="space-y-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please upload an image smaller than 5MB.",
                            variant: "destructive",
                          });
                          return;
                        }
                        handleLogoUpload(file);
                      }
                    }}
                  />

                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-lg bg-black/40 hover:border-primary/50 transition-colors">
                    {formData.logoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.logoUrl}
                          alt="Logo preview"
                          className="max-h-48 max-w-full object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          onClick={() => {
                            setFormData({ ...formData, logoUrl: "", logoFile: null });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          {uploadingLogo ? (
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                          ) : (
                            <Image className="h-10 w-10 text-primary" />
                          )}
                        </div>
                        <p className="text-gray-400 mb-4">
                          {uploadingLogo ? "Uploading and compressing..." : "No logo uploaded (optional)"}
                        </p>
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadingLogo ? "Processing..." : "Upload Logo"}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, or SVG up to 5MB (will be compressed automatically)
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Or skip this step and add a logo later
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Theme Customization */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">
                    Theme Customization
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Customize colors and background for your branded meal plans.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-gray-300 uppercase font-bold">
                      Brand Colors
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-400">
                          Primary Color
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="h-12 w-20 p-1 bg-black/40 border-white/20 cursor-pointer"
                            value={formData.themeColors.primary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                themeColors: {
                                  ...formData.themeColors,
                                  primary: e.target.value,
                                },
                              })
                            }
                          />
                          <Input
                            type="text"
                            className="flex-1 bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                            value={formData.themeColors.primary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                themeColors: {
                                  ...formData.themeColors,
                                  primary: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-400">
                          Secondary Color
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="h-12 w-20 p-1 bg-black/40 border-white/20 cursor-pointer"
                            value={formData.themeColors.secondary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                themeColors: {
                                  ...formData.themeColors,
                                  secondary: e.target.value,
                                },
                              })
                            }
                          />
                          <Input
                            type="text"
                            className="flex-1 bg-black/40 border-white/20 h-12 text-lg focus:border-primary"
                            value={formData.themeColors.secondary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                themeColors: {
                                  ...formData.themeColors,
                                  secondary: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-gray-300 uppercase font-bold">
                      Background Style
                    </Label>
                    <RadioGroup
                      value={formData.themeColors.background}
                      onValueChange={(v: "light" | "dark") =>
                        setFormData({
                          ...formData,
                          themeColors: {
                            ...formData.themeColors,
                            background: v,
                          },
                        })
                      }
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="light"
                          id="light"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="light"
                          className="flex flex-col items-center justify-center rounded-none border border-white/20 bg-white/5 p-6 hover:bg-white/10 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                        >
                          <div className="w-16 h-16 bg-white rounded mb-2 border-2 border-gray-300"></div>
                          <span className="font-bold uppercase tracking-wide text-sm">
                            Light Background
                          </span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="dark"
                          id="dark"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="dark"
                          className="flex flex-col items-center justify-center rounded-none border border-white/20 bg-black/40 p-6 hover:bg-white/10 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                        >
                          <div className="w-16 h-16 bg-black rounded mb-2 border-2 border-gray-600"></div>
                          <span className="font-bold uppercase tracking-wide text-sm">
                            Dark Background
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 uppercase font-bold">
                      Preview
                    </Label>
                    <div
                      className={`p-6 rounded-lg border-2 ${
                        formData.themeColors.background === "light"
                          ? "bg-white text-black"
                          : "bg-black text-white border-white/20"
                      }`}
                      style={{
                        borderColor: formData.themeColors.primary,
                      }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {formData.logoUrl && (
                          <img
                            src={formData.logoUrl}
                            alt="Logo"
                            className="h-12 object-contain"
                          />
                        )}
                        <h3
                          className="text-2xl font-bold"
                          style={{ color: formData.themeColors.primary }}
                        >
                          {formData.businessName || "Your Business Name"}
                        </h3>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: formData.themeColors.secondary }}
                      >
                        Sample meal plan preview with your branding
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Free Daily Plan Option */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">
                    Test Drive
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Generate a free daily meal plan to see how it works with your branding.
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          id="free-plan"
                          checked={formData.freeDailyPlan}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              freeDailyPlan: checked === true,
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="free-plan"
                            className="text-lg font-bold cursor-pointer"
                          >
                            Generate a free daily meal plan
                          </Label>
                          <p className="text-sm text-gray-300 mt-2">
                            We'll create a sample daily meal plan with your branding so you can see how it looks. This is completely free and won't count against your quota.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {formData.freeDailyPlan && (
                    <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">
                        ✓ A free daily meal plan will be generated after you complete setup
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">
                    Review Your Information
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Review your business information before completing setup.
                  </p>
                </div>

                <div className="space-y-4 bg-black/40 border border-white/10 p-6">
                  <div>
                    <Label className="text-sm text-gray-400 uppercase tracking-wide">
                      Business Name
                    </Label>
                    <p className="text-xl font-bold text-white mt-1">
                      {formData.businessName || "Not provided"}
                    </p>
                  </div>
                  {formData.businessType && (
                    <div>
                      <Label className="text-sm text-gray-400 uppercase tracking-wide">
                        Business Type
                      </Label>
                      <p className="text-xl font-bold text-white mt-1">
                        {formData.businessType}
                      </p>
                    </div>
                  )}
                  {formData.website && (
                    <div>
                      <Label className="text-sm text-gray-400 uppercase tracking-wide">
                        Website
                      </Label>
                      <p className="text-xl font-bold text-white mt-1">
                        {formData.website}
                      </p>
                    </div>
                  )}
                  {formData.phone && (
                    <div>
                      <Label className="text-sm text-gray-400 uppercase tracking-wide">
                        Phone
                      </Label>
                      <p className="text-xl font-bold text-white mt-1">
                        {formData.phone}
                      </p>
                    </div>
                  )}
                  {formData.logoUrl && (
                    <div>
                      <Label className="text-sm text-gray-400 uppercase tracking-wide">
                        Logo
                      </Label>
                      <div className="mt-2">
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="h-16 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-400 uppercase tracking-wide">
                      Theme Colors
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <div
                        className="w-12 h-12 rounded border-2 border-white/20"
                        style={{ backgroundColor: formData.themeColors.primary }}
                      ></div>
                      <div
                        className="w-12 h-12 rounded border-2 border-white/20"
                        style={{ backgroundColor: formData.themeColors.secondary }}
                      ></div>
                      <div className="flex items-center ml-2">
                        <span className="text-sm text-gray-400">
                          {formData.themeColors.background === "light"
                            ? "Light Background"
                            : "Dark Background"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {formData.freeDailyPlan && (
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span className="text-white">Free daily meal plan will be generated</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-6 md:px-10 pb-8 flex justify-between">
            {step === 1 ? (
              <Button variant="ghost" disabled className="invisible">
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={prevStep}
                className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide"
              >
                Back
              </Button>
            )}

            <Button
              onClick={step === totalSteps ? handleComplete : nextStep}
              disabled={saving || (step === 1 && !formData.businessName)}
              className="bg-primary hover:bg-primary/90 text-black px-10 h-12 font-bold uppercase tracking-widest rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : step === totalSteps ? (
                "Complete Setup"
              ) : step === 2 ? (
                "Skip & Continue"
              ) : step === 3 ? (
                "Continue"
              ) : (
                "Next"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
