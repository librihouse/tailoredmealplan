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

import imgPregnancy from "@assets/stock_images/pregnant_woman_eatin_7af35d9c.jpg";
import imgMother from "@assets/stock_images/mother_holding_newbo_e1a8332a.jpg";

export default function Features() {
  return (
    <Layout>
      <div className="bg-white text-black py-20 min-h-screen">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 pt-10">
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">System Capabilities</span>
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 leading-none text-black">
              Precision <span className="text-primary">Nutrition</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              The most advanced dietary engine on the market. Built for performance, recovery, and life.
            </p>
          </div>

          {/* Goal-Oriented Plans */}
          <div className="mb-32">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-8 border-primary pl-6 uppercase text-black">Goal-Oriented Protocols</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Activity, title: "Weight Management", desc: "Calorie-controlled partitioning for rapid fat loss or controlled mass gain." },
                { icon: Dumbbell, title: "Athletic Performance", desc: "Timing-specific macronutrients for pre-workout energy and post-workout recovery." },
                { icon: Heart, title: "Post-Surgery Recovery", desc: "Anti-inflammatory nutrient density to accelerate tissue healing and immunity." },
                { icon: Baby, title: "Pregnancy & Postpartum", desc: "Complete nutritional support for pre-conception, pregnancy, and postpartum recovery." }
              ].map((feature, i) => (
                <Card key={i} className="bg-gray-50 border-gray-200 hover:border-primary hover:bg-white hover:shadow-xl transition-all group duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 bg-white rounded-none flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors border border-gray-200 group-hover:border-primary">
                      <feature.icon className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-black">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pregnancy Special Feature */}
          <div className="mb-32 bg-gray-50 border border-gray-100 p-8 md:p-12 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 skew-x-[-20deg] hidden md:block"></div>
             <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
               <div>
                  <h3 className="font-heading text-3xl md:text-5xl font-bold uppercase mb-6 text-black">Maternal <span className="text-primary">Health</span></h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                    Pregnancy requires a specialized nutritional strategy. Our system adapts trimester-by-trimester to support fetal development and maternal energy levels, followed by a comprehensive postpartum recovery protocol focused on lactation support and nutrient replenishment.
                  </p>
                  <ul className="space-y-4 font-bold text-black uppercase tracking-wide">
                    <li className="flex items-center gap-3"><span className="text-primary font-black">✓</span> Trimester-Specific Micros</li>
                    <li className="flex items-center gap-3"><span className="text-primary font-black">✓</span> Lactation Support Meals</li>
                    <li className="flex items-center gap-3"><span className="text-primary font-black">✓</span> Postpartum Healing Foods</li>
                  </ul>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <img src={imgPregnancy} alt="Healthy Pregnancy" className="w-full h-64 object-cover hover:scale-105 transition-all duration-500 shadow-md" />
                  <img src={imgMother} alt="Postpartum Wellness" className="w-full h-64 object-cover hover:scale-105 transition-all duration-500 shadow-md mt-8" />
               </div>
             </div>
          </div>

          {/* Dietary Customizations */}
          <div className="mb-32">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-8 border-primary pl-6 uppercase text-black">Dietary & Cultural Architecture</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Religious Diets", desc: "Strict adherence to Halal, Kosher, Jain, Hindu, and Buddhist guidelines." },
                { icon: Leaf, title: "Lifestyle Choices", desc: "Vegan, Vegetarian, Keto, Paleo, Low-Carb, Mediterranean protocols." },
                { icon: Heart, title: "Medical Conditions", desc: "Diabetic, Low-Sodium, GERD, Renal, Low-FODMAP modifications." }
              ].map((feature, i) => (
                <Card key={i} className="bg-white border-2 border-gray-100 hover:border-primary transition-all shadow-sm hover:shadow-lg">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-black mb-2" />
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-black">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Smart Features */}
          <div className="mb-20">
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-8 border-primary pl-6 uppercase text-black">AI Intelligence</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Global Language", desc: "Plans available in 20+ languages including English, Spanish, French, Hindi." },
                { icon: ChefHat, title: "Zero Waste Logic", desc: "Smartly plans meals to use up leftovers and reduce grocery waste." },
                { icon: Wallet, title: "Cost Optimization", desc: "Set your weekly grocery budget and we'll find high-quality recipes that fit." }
              ].map((feature, i) => (
                <Card key={i} className="bg-gray-50 border-none shadow-md hover:shadow-xl transition-all">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-black">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Output Details */}
          <div>
            <h2 className="font-heading text-4xl font-bold mb-12 border-l-8 border-primary pl-6 uppercase text-black">Deep Analytics</h2>
            <div className="bg-gray-900 text-white p-8 md:p-12 grid md:grid-cols-2 gap-12 rounded-xl shadow-2xl">
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
