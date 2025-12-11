import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ClipboardList, Cpu, UtensilsCrossed, ShoppingCart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      desc: "Sign up in 30 seconds. We just need your basics to get started.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Complete Health Questionnaire",
      desc: "Tell us about your health conditions, dietary restrictions, allergies, and goals.",
      icon: ClipboardList,
    },
    {
      number: "03",
      title: "AI Analysis",
      desc: "Our advanced AI analyzes 50+ factors including BMI, preferences, and nutritional science.",
      icon: Cpu,
    },
    {
      number: "04",
      title: "Receive Your Plan",
      desc: "Get a complete weekly meal plan with breakfast, lunch, dinner, and snacks.",
      icon: UtensilsCrossed,
    },
    {
      number: "05",
      title: "Smart Shopping",
      desc: "Get an automated grocery list organized by store aisle to save time.",
      icon: ShoppingCart,
    },
    {
      number: "06",
      title: "Track & Adapt",
      desc: "Log your progress. As your body changes, your plan adapts automatically.",
      icon: TrendingUp,
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  return (
    <Layout>
      <div className="bg-black text-white py-24 md:py-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 text-white">
              How It <span className="text-primary">Works</span>
            </h1>
            <p className="text-xl text-gray-400">
              Our process combines advanced nutritional science with AI to create the perfect plan for you.
            </p>
          </motion.div>

          <div className="relative space-y-24 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-primary/50 before:to-transparent md:before:mx-auto md:before:translate-x-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              >
                
                {/* Icon Bubble */}
                <div className="absolute left-0 md:left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-black bg-primary shadow-lg md:h-14 md:w-14 group-hover:scale-110 group-hover:bg-primary/80 transition-all z-10">
                  <step.icon className="h-5 w-5 text-black md:h-6 md:w-6" />
                </div>

                {/* Content Card */}
                <div className="ml-16 w-full rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur p-6 shadow-lg md:w-[calc(50%-2.5rem)] md:ml-0 hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/20 text-primary border border-primary/30">
                        Step {step.number}
                      </span>
                   </div>
                   <h3 className="font-heading text-2xl font-bold mb-2 text-white">{step.title}</h3>
                   <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-24 text-center"
          >
             <div className="bg-primary/10 border border-primary/20 rounded-3xl p-12 max-w-4xl mx-auto">
               <h3 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white uppercase">Ready to get started?</h3>
               <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">Your personalized plan is just a few clicks away. Join thousands of others achieving their health goals.</p>
               <Link href="/onboarding">
                 <Button size="lg" className="bg-primary hover:bg-primary/90 text-black h-14 px-12 font-bold uppercase tracking-wide rounded-none shadow-lg">
                   Create My Plan
                   <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
               </Link>
             </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
