import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ClipboardList, Cpu, UtensilsCrossed, ShoppingCart, TrendingUp } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      desc: "Sign up in 30 seconds. We just need your basics to get started.",
      icon: ClipboardList,
      color: "bg-blue-100 text-blue-700"
    },
    {
      number: "02",
      title: "Complete Health Questionnaire",
      desc: "Tell us about your health conditions, dietary restrictions, allergies, and goals.",
      icon: ClipboardList,
      color: "bg-teal-100 text-teal-700"
    },
    {
      number: "03",
      title: "AI Analysis",
      desc: "Our advanced AI analyzes 50+ factors including BMI, preferences, and nutritional science.",
      icon: Cpu,
      color: "bg-purple-100 text-purple-700"
    },
    {
      number: "04",
      title: "Receive Your Plan",
      desc: "Get a complete weekly meal plan with breakfast, lunch, dinner, and snacks.",
      icon: UtensilsCrossed,
      color: "bg-orange-100 text-orange-700"
    },
    {
      number: "05",
      title: "Smart Shopping",
      desc: "Get an automated grocery list organized by store aisle to save time.",
      icon: ShoppingCart,
      color: "bg-yellow-100 text-yellow-700"
    },
    {
      number: "06",
      title: "Track & Adapt",
      desc: "Log your progress. As your body changes, your plan adapts automatically.",
      icon: TrendingUp,
      color: "bg-pink-100 text-pink-700"
    }
  ];

  return (
    <Layout>
      <div className="bg-white py-20">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-dark mb-6">How It Works</h1>
            <p className="text-xl text-muted-foreground">
              Our process combines advanced nutritional science with AI to create the perfect plan for you.
            </p>
          </div>

          <div className="relative space-y-24 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent md:before:mx-auto md:before:translate-x-0">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                
                {/* Icon Bubble */}
                <div className="absolute left-0 md:left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow md:h-14 md:w-14 group-hover:scale-110 transition-transform z-10">
                  <step.icon className="h-5 w-5 text-slate-600 md:h-6 md:w-6" />
                </div>

                {/* Content Card */}
                <div className="ml-16 w-full rounded-2xl border bg-white p-6 shadow-sm md:w-[calc(50%-2.5rem)] md:ml-0 hover:shadow-lg transition-shadow duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${step.color}`}>
                        Step {step.number}
                      </span>
                   </div>
                   <h3 className="font-serif text-2xl font-bold mb-2 text-text-dark">{step.title}</h3>
                   <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center">
             <div className="bg-primary/5 rounded-3xl p-12 max-w-4xl mx-auto">
               <h3 className="font-serif text-3xl font-bold mb-4">Ready to get started?</h3>
               <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Your personalized plan is just a few clicks away. Join thousands of others achieving their health goals.</p>
               <Link href="/onboarding">
                 <Button size="lg" className="bg-primary hover:bg-primary-light text-white h-12 px-8 rounded-full shadow-lg">
                   Create My Plan
                   <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
               </Link>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
