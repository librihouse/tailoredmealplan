import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ClipboardList, 
  Wand2, 
  Utensils, 
  TrendingUp,
  Leaf,
  Heart,
  Globe,
  ShieldCheck
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <Layout>
      <Hero />
      
      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-dark mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get your personalized nutrition plan in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -z-10"></div>

            {[
              { icon: ClipboardList, title: "Tell Us About You", desc: "Share your goals, dietary needs, and preferences." },
              { icon: Wand2, title: "AI Creates Plan", desc: "Our AI analyzes 50+ factors to build your perfect plan." },
              { icon: Utensils, title: "Enjoy Meals", desc: "Get delicious, easy-to-follow recipes every week." },
              { icon: TrendingUp, title: "Track Progress", desc: "Monitor your health improvements and adjust as needed." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-bg-sage rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors relative">
                  <step.icon className="h-10 w-10 text-primary" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold font-mono shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold mb-2 text-text-dark">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-bg-sage/30">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-dark mb-4">Why Choose TailoredMealPlan?</h2>
            <p className="text-muted-foreground text-lg">We don't just count calories. We understand culture, taste, and lifestyle.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Health Condition Support", desc: "Plans adapted for Diabetes, PCOS, Hypertension, and more." },
              { icon: ShieldCheck, title: "Religious Compliance", desc: "Strictly Halal, Kosher, Jain, and Hindu vegetarian options." },
              { icon: Globe, title: "Global Cuisines", desc: "Enjoy Mediterranean, Asian, Indian, Mexican, or local favorites." },
              { icon: Leaf, title: "Special Diets", desc: "Keto, Paleo, Vegan, Low-FODMAP, and allergen-free plans." },
              { icon: ClipboardList, title: "Smart Grocery Lists", desc: "Automated shopping lists organized by store aisle." },
              { icon: TrendingUp, title: "Progress Tracking", desc: "Track weight, energy levels, and water intake easily." }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-serif text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Persona Cards */}
      <section className="py-20 bg-primary text-white">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <div className="text-center mb-16">
             <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Nutrition for Everyone</h2>
             <p className="text-primary-foreground/80 text-lg">Find the plan that fits your life stage and goals.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["Weight Loss", "Muscle Gain", "Health Mgmt", "Lifestyle", "Religious", "Families"].map((persona, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-colors cursor-pointer border border-white/10">
                <div className="font-serif font-bold text-lg mb-1">{persona}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-bg-cream text-center">
        <div className="container max-w-lg mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold text-text-dark mb-6">Ready to transform your health?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join 10,000+ users who have discovered the power of personalized nutrition.</p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-primary hover:bg-primary-light text-white h-14 px-10 text-xl rounded-full shadow-xl shadow-primary/20 w-full sm:w-auto">
              Get Started for Free
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required for free plan.</p>
        </div>
      </section>
    </Layout>
  );
}
