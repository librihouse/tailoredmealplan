import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-primary">
            <span className="text-4xl">🥗</span>
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase">Creating Your Fuel Plan...</h2>
          <p className="text-gray-400 text-lg">Our AI is analyzing 50+ biomarkers to build your perfect weekly menu.</p>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-white/10">
            <div className="bg-primary h-3 rounded-full animate-progress w-full origin-left duration-[3000ms] ease-linear transition-all"></div>
          </div>
          <Link href="/auth">
            <Button className="w-full mt-8 bg-primary text-black font-bold h-12 uppercase tracking-wide hover:bg-primary/90">Create Account to Save Plan</Button>
          </Link>
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
             {step > 1 && (
               <Button variant="ghost" size="icon" onClick={prevStep} className="text-white hover:text-primary hover:bg-white/10">
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
            
            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Let's get to know you</h2>
                  <p className="text-gray-400 text-lg">Basic measurements help us calculate your caloric needs.</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block text-gray-300 uppercase tracking-wide font-bold">Gender</Label>
                    <RadioGroup defaultValue="female" onValueChange={(v) => setFormData({...formData, gender: v})} className="grid grid-cols-3 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">Age</Label>
                      <Input type="number" placeholder="25" className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">Height (cm)</Label>
                      <Input type="number" placeholder="170" className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">Current Weight (kg)</Label>
                      <Input type="number" placeholder="70" className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 uppercase font-bold">Target Weight (kg)</Label>
                      <Input type="number" placeholder="65" className="bg-black/40 border-white/20 h-12 text-lg focus:border-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">What is your main goal?</h2>
                  <p className="text-gray-400 text-lg">We'll adjust your macros to help you get there.</p>
                </div>
                
                <RadioGroup defaultValue="lose_weight" onValueChange={(v) => setFormData({...formData, goal: v})} className="space-y-3">
                  {[
                    { id: "lose_weight", label: "Lose Weight", desc: "Burn fat and get leaner" },
                    { id: "build_muscle", label: "Build Muscle", desc: "Gain lean mass and strength" },
                    { id: "maintain", label: "Maintain Weight", desc: "Stay healthy and fit" },
                    { id: "health", label: "Improve Health", desc: "Focus on nutrition quality" }
                  ].map((goal) => (
                    <div key={goal.id} className="relative flex items-center space-x-4 border border-white/20 rounded-none p-6 hover:bg-white/5 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={goal.id} id={goal.id} className="border-white/50 text-primary" />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full">
                        <Label htmlFor={goal.id} className="font-bold cursor-pointer text-xl uppercase tracking-wide group-has-[:checked]:text-primary transition-colors">
                          {goal.label}
                        </Label>
                        <p className="text-sm text-gray-400 group-has-[:checked]:text-gray-300">
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
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">How active are you?</h2>
                  <p className="text-gray-400 text-lg">Be honest! This changes your calorie budget significantly.</p>
                </div>

                <RadioGroup defaultValue="moderate" onValueChange={(v) => setFormData({...formData, activity: v})} className="space-y-3">
                  {[
                    { id: "sedentary", label: "Sedentary", desc: "Desk job, little to no exercise" },
                    { id: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                    { id: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                    { id: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
                    { id: "athlete", label: "Extra Active", desc: "Physical job or athletic training" }
                  ].map((level) => (
                    <div key={level.id} className="relative flex items-center space-x-4 border border-white/20 rounded-none p-6 hover:bg-white/5 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={level.id} id={level.id} className="border-white/50 text-primary" />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full">
                        <Label htmlFor={level.id} className="font-bold cursor-pointer text-xl uppercase tracking-wide group-has-[:checked]:text-primary transition-colors">
                          {level.label}
                        </Label>
                        <p className="text-sm text-gray-400 group-has-[:checked]:text-gray-300">
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
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Any dietary preferences?</h2>
                  <p className="text-gray-400 text-lg">Select all that apply.</p>
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
                        "flex items-center justify-between p-4 rounded-none border cursor-pointer transition-all",
                        formData.diet.includes(diet) ? "border-primary bg-primary/10 text-primary" : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                      )}
                    >
                      <span className="font-bold uppercase tracking-wide text-sm">{diet}</span>
                      {formData.diet.includes(diet) && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-4 bg-white/5 border border-white/10 text-sm text-gray-400 italic">
                   <span>Note: Select "None" by not checking anything if you have no restrictions.</span>
                </div>
              </div>
            )}

            {/* Step 5: Religious/Cultural */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Religious or Cultural Needs?</h2>
                  <p className="text-gray-400 text-lg">We strictly adhere to these requirements.</p>
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
                    <div key={rel.id} className="relative flex items-center space-x-4 border border-white/20 rounded-none p-6 hover:bg-white/5 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={rel.id} id={rel.id} className="border-white/50 text-primary" />
                      <div className="grid gap-1.5 leading-none cursor-pointer w-full">
                        <Label htmlFor={rel.id} className="font-bold cursor-pointer text-xl uppercase tracking-wide group-has-[:checked]:text-primary transition-colors">
                          {rel.label}
                        </Label>
                        {rel.desc && <p className="text-sm text-gray-400 group-has-[:checked]:text-gray-300 mt-1">{rel.desc}</p>}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 6: Conditions */}
            {step === 6 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Health Conditions</h2>
                  <p className="text-gray-400 text-lg">Do you have any conditions we should account for?</p>
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
                        "flex items-center justify-between p-4 rounded-none border cursor-pointer transition-all",
                        formData.conditions.includes(cond) ? "border-primary bg-primary/10 text-primary" : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                      )}
                    >
                      <span className="font-bold uppercase tracking-wide text-sm">{cond}</span>
                      {formData.conditions.includes(cond) && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Allergies */}
            {step === 7 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl font-bold uppercase">Any Allergies?</h2>
                  <p className="text-gray-400 text-lg">We'll exclude any recipes containing these ingredients.</p>
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
                        "flex items-center justify-between p-4 rounded-none border cursor-pointer transition-all",
                        formData.allergies.includes(allergy) ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-white/20 hover:border-destructive/50 hover:bg-white/5"
                      )}
                    >
                      <span className="font-bold uppercase tracking-wide text-sm">{allergy}</span>
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
               <Button variant="outline" onClick={prevStep} className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wide">Back</Button>
             )}
             
             <Button onClick={nextStep} className="bg-primary hover:bg-primary/90 text-black px-10 h-12 font-bold uppercase tracking-widest rounded-none">
               {step === totalSteps ? "Generate Plan" : "Next"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
