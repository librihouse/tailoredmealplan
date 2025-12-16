"use client";
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
  Wallet,
  Baby
} from "lucide-react";

const imgPregnancy = "/attached_assets/stock_images/pregnant_woman_eatin_7af35d9c.jpg";
const imgMother = "/attached_assets/stock_images/mother_holding_newbo_e1a8332a.jpg";

export default function Features() {
  return (
    <Layout>
      <div className="bg-black text-white py-20 min-h-screen">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">System Capabilities</span>
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 leading-none">
              Precision <span className="text-primary">Nutrition</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium">
              The most advanced dietary engine on the market. Built for performance, recovery, and life.
            </p>
          </div>

          {/* Goal-Oriented Plans */}
          <div className="mb-32">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-4 border-primary pl-6 uppercase">Goal-Oriented Protocols</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Activity, title: "Weight Management", desc: "Calorie-controlled partitioning for rapid fat loss or controlled mass gain." },
                { icon: Dumbbell, title: "Athletic Performance", desc: "Timing-specific macronutrients for pre-workout energy and post-workout recovery." },
                { icon: Heart, title: "Post-Surgery Recovery", desc: "Anti-inflammatory nutrient density to accelerate tissue healing and immunity." },
                { icon: Baby, title: "Pregnancy & Postpartum", desc: "Complete nutritional support for pre-conception, pregnancy, and postpartum recovery." }
              ].map((feature, i) => (
                <Card key={i} className="bg-gray-900 border-white/10 hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <div className="h-12 w-12 bg-white/5 rounded-none flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-black transition-colors">
                      <feature.icon className="h-6 w-6 text-primary group-hover:text-black" />
                    </div>
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pregnancy Special Feature */}
          <div className="mb-32 bg-gray-900 border border-white/10 p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 skew-x-[-20deg] hidden md:block"></div>
             <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
               <div>
                  <h3 className="font-heading text-3xl md:text-5xl font-bold uppercase mb-6">Maternal <span className="text-primary">Health</span></h3>
                  <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                    Pregnancy requires a specialized nutritional strategy. Our system adapts trimester-by-trimester to support fetal development and maternal energy levels, followed by a comprehensive postpartum recovery protocol focused on lactation support and nutrient replenishment.
                  </p>
                  <ul className="space-y-4 font-bold text-white uppercase tracking-wide">
                    <li className="flex items-center gap-3"><span className="text-primary">✓</span> Trimester-Specific Micros</li>
                    <li className="flex items-center gap-3"><span className="text-primary">✓</span> Lactation Support Meals</li>
                    <li className="flex items-center gap-3"><span className="text-primary">✓</span> Postpartum Healing Foods</li>
                  </ul>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <img src={imgPregnancy} alt="Healthy Pregnancy" className="w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500 border border-white/10" />
                  <img src={imgMother} alt="Postpartum Wellness" className="w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500 border border-white/10 mt-8" />
               </div>
             </div>
          </div>

          {/* Dietary Customizations */}
          <div className="mb-32">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-4 border-primary pl-6 uppercase">Dietary & Cultural Architecture</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Religious Diets", desc: "Strict adherence to Halal, Kosher, Jain, Hindu, and Buddhist guidelines." },
                { icon: Leaf, title: "Lifestyle Choices", desc: "Vegan, Vegetarian, Keto, Paleo, Low-Carb, Mediterranean protocols." },
                { icon: Heart, title: "Medical Conditions", desc: "Diabetic, Low-Sodium, GERD, Renal, Low-FODMAP modifications." }
              ].map((feature, i) => (
                <Card key={i} className="bg-transparent border border-dashed border-white/20 hover:border-solid hover:border-primary transition-all">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-white mb-2" />
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Smart Features */}
          <div className="mb-20">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-4 border-primary pl-6 uppercase">AI Intelligence</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Global Language", desc: "Plans available in 20+ languages including English, Spanish, French, Hindi." },
                { icon: ChefHat, title: "Zero Waste Logic", desc: "Smartly plans meals to use up leftovers and reduce grocery waste." },
                { icon: Wallet, title: "Cost Optimization", desc: "Set your weekly grocery budget and we'll find high-quality recipes that fit." }
              ].map((feature, i) => (
                <Card key={i} className="bg-gray-900 border-none shadow-xl">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Output Details */}
          <div>
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-4 border-primary pl-6 uppercase">Deep Analytics</h2>
            <div className="bg-gray-900 border border-white/10 p-8 md:p-12 grid md:grid-cols-2 gap-12">
               <div>
                 <h3 className="font-heading text-2xl font-bold mb-6 text-white uppercase">Nutritional Breakdown</h3>
                 <ul className="space-y-4">
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-primary skew-x-[-10deg]"></div> Calories & Macros (Protein, Carbs, Fat)</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-primary skew-x-[-10deg]"></div> Fiber & Sugar Content Analysis</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-primary skew-x-[-10deg]"></div> Micronutrient Density (Vitamins & Minerals)</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-primary skew-x-[-10deg]"></div> Glycemic Load Optimization</li>
                 </ul>
               </div>
               <div>
                 <h3 className="font-heading text-2xl font-bold mb-6 text-white uppercase">Recipe Engineering</h3>
                 <ul className="space-y-4">
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-white skew-x-[-10deg]"></div> Step-by-step Execution</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-white skew-x-[-10deg]"></div> Prep Time & Cooking Velocity</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-white skew-x-[-10deg]"></div> Complexity Grading</li>
                   <li className="flex items-center gap-3 text-gray-300 font-medium"><div className="w-3 h-3 bg-white skew-x-[-10deg]"></div> Allergen Exclusion Protocols</li>
                 </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
