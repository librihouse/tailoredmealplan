import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Leaf, 
  Heart, 
  Globe, 
  ShieldCheck, 
  Dumbbell,
  Activity,
  ChefHat,
  Clock,
  Wallet
} from "lucide-react";

export default function Features() {
  return (
    <Layout>
      <div className="bg-bg-sage/30 py-20">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-dark mb-6">Comprehensive Nutrition Features</h1>
            <p className="text-xl text-muted-foreground">
              We've built the most extensive dietary support system available.
            </p>
          </div>

          {/* Dietary Customizations */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-bold mb-8 border-b pb-4">Dietary & Cultural Support</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Religious Diets", desc: "Halal, Kosher, Jain (No root veg), Hindu Vegetarian, Buddhist." },
                { icon: Leaf, title: "Lifestyle Diets", desc: "Vegan, Vegetarian, Keto, Paleo, Low-Carb, Mediterranean." },
                { icon: Heart, title: "Medical Diets", desc: "Diabetic, Low-Sodium, GERD, Renal, Low-FODMAP." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Health Goals */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-bold mb-8 border-b pb-4">Goal-Oriented Plans</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Activity, title: "Weight Management", desc: "Healthy weight loss or gain with calorie-controlled portions." },
                { icon: Dumbbell, title: "Athletic Performance", desc: "High-protein plans for muscle building and endurance." },
                { icon: Heart, title: "Post-Surgery Recovery", desc: "Nutrient-dense meals to support healing and immunity." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-accent mb-2" />
                    <CardTitle className="font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Smart Features */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-bold mb-8 border-b pb-4">Smart AI Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Multi-Language", desc: "Plans available in 20+ languages including English, Spanish, French, Hindi." },
                { icon: ChefHat, title: "Leftover Utilization", desc: "Smartly plan meals to use up leftovers and reduce waste." },
                { icon: Wallet, title: "Budget Conscious", desc: "Set your weekly grocery budget and we'll find recipes that fit." }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary-light mb-2" />
                    <CardTitle className="font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Output Details */}
          <div>
            <h2 className="font-serif text-3xl font-bold mb-8 border-b pb-4">Detailed Insights</h2>
            <div className="bg-white p-8 rounded-xl shadow-sm grid md:grid-cols-2 gap-8">
               <div>
                 <h3 className="font-serif text-xl font-bold mb-4">Nutritional Breakdown</h3>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-primary rounded-full"></div> Calories & Macros (Protein, Carbs, Fat)</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-primary rounded-full"></div> Fiber & Sugar Content</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-primary rounded-full"></div> Micronutrients (Vitamins & Minerals)</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-primary rounded-full"></div> Glycemic Index Indicators</li>
                 </ul>
               </div>
               <div>
                 <h3 className="font-serif text-xl font-bold mb-4">Recipe Details</h3>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-accent rounded-full"></div> Step-by-step Instructions</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-accent rounded-full"></div> Prep Time & Cooking Time</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-accent rounded-full"></div> Difficulty Level</li>
                   <li className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-accent rounded-full"></div> Allergen Warnings</li>
                 </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
