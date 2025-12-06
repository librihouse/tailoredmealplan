import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const nextStep = () => setStep(Math.min(step + 1, totalSteps + 1));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  const [formData, setFormData] = useState({
    gender: "female",
    goal: "lose_weight",
    activity: "moderate",
    diet: [] as string[],
    religious: "none",
    conditions: [] as string[],
    allergies: [] as string[]
  });

  const toggleSelection = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(i => i !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const progress = (step / totalSteps) * 100;

  if (step > totalSteps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-cream">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <span className="text-4xl">🥗</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-text-dark">Creating Your Perfect Plan...</h2>
          <p className="text-muted-foreground">Our AI is analyzing 50+ data points to build your personalized weekly menu.</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
            <div className="bg-primary h-2.5 rounded-full animate-progress w-full origin-left duration-[3000ms] ease-linear transition-all"></div>
          </div>
          <Link href="/auth">
            <Button className="w-full mt-8">Create Account to Save Plan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col">
      {/* Header / Progress */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-screen-md py-4 px-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             {step > 1 && (
               <Button variant="ghost" size="icon" onClick={prevStep}>
                 <ArrowLeft className="h-5 w-5" />
               </Button>
             )}
             <span className="font-serif font-bold text-primary">TailoredMealPlan</span>
           </div>
           <span className="text-sm font-medium text-muted-foreground">Step {step} of {totalSteps}</span>
        </div>
        <div className="h-1 bg-gray-100 w-full">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 container max-w-screen-md px-4 py-8 md:py-12">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6 md:p-10">
            
            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">Let's get to know you</h2>
                  <p className="text-muted-foreground">Basic measurements help us calculate your caloric needs.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Gender</Label>
                    <RadioGroup defaultValue="female" onValueChange={(v) => setFormData({...formData, gender: v})} className="grid grid-cols-3 gap-4">
                      {["Female", "Male", "Other"].map((g) => (
                        <div key={g}>
                          <RadioGroupItem value={g.toLowerCase()} id={g.toLowerCase()} className="peer sr-only" />
                          <Label
                            htmlFor={g.toLowerCase()}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                          >
                            {g}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input type="number" placeholder="25" />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input type="number" placeholder="170" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Current Weight (kg)</Label>
                      <Input type="number" placeholder="70" />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Weight (kg)</Label>
                      <Input type="number" placeholder="65" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">What is your main goal?</h2>
                  <p className="text-muted-foreground">We'll adjust your macros to help you get there.</p>
                </div>
                
                <RadioGroup defaultValue="lose_weight" onValueChange={(v) => setFormData({...formData, goal: v})} className="space-y-3">
                  {[
                    { id: "lose_weight", label: "Lose Weight", desc: "Burn fat and get leaner" },
                    { id: "build_muscle", label: "Build Muscle", desc: "Gain lean mass and strength" },
                    { id: "maintain", label: "Maintain Weight", desc: "Stay healthy and fit" },
                    { id: "health", label: "Improve Health", desc: "Focus on nutrition quality" }
                  ].map((goal) => (
                    <div key={goal.id} className="relative flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value={goal.id} id={goal.id} />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full pl-2">
                        <Label htmlFor={goal.id} className="font-bold cursor-pointer text-lg">
                          {goal.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {goal.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Activity */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">How active are you?</h2>
                  <p className="text-muted-foreground">Be honest! This changes your calorie budget significantly.</p>
                </div>

                <RadioGroup defaultValue="moderate" onValueChange={(v) => setFormData({...formData, activity: v})} className="space-y-3">
                  {[
                    { id: "sedentary", label: "Sedentary", desc: "Desk job, little to no exercise" },
                    { id: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                    { id: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                    { id: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
                    { id: "athlete", label: "Extra Active", desc: "Physical job or athletic training" }
                  ].map((level) => (
                    <div key={level.id} className="relative flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value={level.id} id={level.id} />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full pl-2">
                        <Label htmlFor={level.id} className="font-bold cursor-pointer text-lg">
                          {level.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {level.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 4: Dietary Preference */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">Any dietary preferences?</h2>
                  <p className="text-muted-foreground">Select all that apply.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Vegetarian", "Vegan", "Pescatarian", "Keto", 
                    "Paleo", "Mediterranean", "Low-Carb", "Dairy-Free", 
                    "Gluten-Free", "Low-FODMAP"
                  ].map((diet) => (
                    <div 
                      key={diet}
                      onClick={() => toggleSelection("diet", diet)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                        formData.diet.includes(diet) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium">{diet}</span>
                      {formData.diet.includes(diet) && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-sm text-muted-foreground">
                   <span>Note: Select "None" by not checking anything if you have no restrictions.</span>
                </div>
              </div>
            )}

            {/* Step 5: Religious/Cultural */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">Religious or Cultural Needs?</h2>
                  <p className="text-muted-foreground">We strictly adhere to these requirements.</p>
                </div>

                <RadioGroup defaultValue="none" onValueChange={(v) => setFormData({...formData, religious: v})} className="space-y-3">
                  {[
                    { id: "none", label: "No Religious Restrictions" },
                    { id: "halal", label: "Halal", desc: "No pork, alcohol, compliant meat sourcing" },
                    { id: "kosher", label: "Kosher", desc: "Separation of meat/dairy, compliant ingredients" },
                    { id: "jain", label: "Jain Vegetarian", desc: "No root vegetables (onions, potatoes, garlic)" },
                    { id: "hindu", label: "Hindu Vegetarian", desc: "No meat, fish, eggs (lacto-vegetarian)" },
                    { id: "buddhist", label: "Buddhist", desc: "Often vegetarian, avoiding pungent spices" }
                  ].map((rel) => (
                    <div key={rel.id} className="relative flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value={rel.id} id={rel.id} />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full pl-2">
                        <Label htmlFor={rel.id} className="font-bold cursor-pointer text-lg">
                          {rel.label}
                        </Label>
                        {rel.desc && <p className="text-sm text-muted-foreground">{rel.desc}</p>}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 6: Conditions */}
            {step === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">Health Conditions</h2>
                  <p className="text-muted-foreground">Do you have any conditions we should account for?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Type 1 Diabetes", "Type 2 Diabetes", "High Blood Pressure", 
                    "High Cholesterol", "Heart Disease", "Kidney Disease", 
                    "GERD / Acid Reflux", "IBS / Digestive", "PCOS", "Thyroid Condition"
                  ].map((cond) => (
                    <div 
                      key={cond}
                      onClick={() => toggleSelection("conditions", cond)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                        formData.conditions.includes(cond) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium">{cond}</span>
                      {formData.conditions.includes(cond) && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Allergies */}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold">Any Allergies?</h2>
                  <p className="text-muted-foreground">We'll exclude any recipes containing these ingredients.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    "Peanuts", "Tree Nuts", "Shellfish", 
                    "Fish", "Eggs", "Dairy", 
                    "Wheat/Gluten", "Soy", "Sesame"
                  ].map((allergy) => (
                    <div 
                      key={allergy}
                      onClick={() => toggleSelection("allergies", allergy)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                        formData.allergies.includes(allergy) ? "border-destructive/50 bg-destructive/5" : "border-muted hover:border-destructive/30"
                      )}
                    >
                      <span className="font-medium">{allergy}</span>
                      {formData.allergies.includes(allergy) && <Check className="h-5 w-5 text-destructive" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="px-6 md:px-10 pb-8 flex justify-between">
             {step === 1 ? (
               <Button variant="ghost" disabled className="invisible">Back</Button>
             ) : (
               <Button variant="outline" onClick={prevStep}>Back</Button>
             )}
             
             <Button onClick={nextStep} className="bg-primary hover:bg-primary-light text-white px-8">
               {step === totalSteps ? "Generate Plan" : "Next"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
