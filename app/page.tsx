"use client";

import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Trophy, Globe } from "lucide-react";
import Link from "next/link";

// Stock Images - using public path
const imgDiverse = "/attached_assets/stock_images/diverse_group_of_fit_366fe9ff.jpg";
const imgBowl = "/attached_assets/stock_images/close_up_delicious_h_eb7900ea.jpg";
const imgIndian = "/attached_assets/stock_images/indian_healthy_veget_787c2b3b.jpg";
const imgMed = "/attached_assets/stock_images/mediterranean_diet_s_2ac4209c.jpg";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <Layout>
      <Hero />
      
      {/* Mission / High Energy Section */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase leading-none mb-8">
                Eat Like <br />
                <span className="text-primary">You Give a Damn.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Generic meal plans are dead. You need nutrition that understands your DNA, your gym schedule, and your grandma's recipes. We combine hardcore science with real food culture.
              </p>
              
              <div className="flex flex-wrap gap-6 mb-10">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">Trusted by Thousands</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/pricing">
                  <Button className="bg-primary hover:bg-primary/90 text-black h-14 px-8 font-bold tracking-wide rounded-none uppercase">
                    View Pricing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black h-14 px-8 font-bold tracking-wide rounded-none uppercase">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgDiverse} alt="Fit diverse group" className="h-full w-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="absolute -bottom-10 -left-10 w-2/3 border-4 border-black">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={imgBowl} alt="Healthy Bowl" className="w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cultural Inclusion / Food Grid */}
      <section className="bg-gray-900 text-white py-24 md:py-32 overflow-hidden">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">No More Chicken & Broccoli</span>
            <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 text-white">
              Culture on <br /> Your Plate
            </h2>
            <p className="text-xl text-gray-400">
              Whether you eat Halal, Kosher, Vegan, or Spicy Szechuan—our AI builds your macros around the food you actually love.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { img: imgIndian, title: "South Asian", desc: "High protein vegetarian thalis & curries." },
              { img: imgMed, title: "Mediterranean", desc: "Heart-healthy fats, seafood & fresh greens." },
              { img: imgBowl, title: "Modern Fusion", desc: "Macro-balanced bowls for the busy athlete." }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden mb-6 bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <h3 className="font-heading text-3xl font-bold uppercase mb-2 group-hover:text-primary transition-colors text-white">{item.title}</h3>
                <p className="text-gray-400 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Steps / Dark Mode */}
      <section className="bg-gray-900 text-white py-24 md:py-32">
         <div className="container max-w-screen-2xl px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-20">
              <motion.div
                 initial="hidden"
                 whileInView="visible"
                 viewport={{ once: true }}
                 variants={fadeInUp}
              >
                 <h2 className="font-heading text-5xl md:text-6xl font-bold uppercase mb-12">
                   The <span className="text-primary">Algorithm</span>
                 </h2>
                 
                 <div className="space-y-12">
                   {[
                     { icon: Globe, title: "01. Input Your Profile", desc: "Age, weight, goals, and cultural background." },
                     { icon: Flame, title: "02. AI Calculation", desc: "We crunch 50+ biomarkers to find your perfect fuel mix." },
                     { icon: Trophy, title: "03. Execute & Win", desc: "Get a weekly grocery list and recipes. Hit your PRs." }
                   ].map((step, i) => (
                     <div key={i} className="flex gap-6 group">
                       <div className="h-16 w-16 shrink-0 border border-white/20 flex items-center justify-center rounded-full group-hover:border-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                         <step.icon className="h-8 w-8" />
                       </div>
                       <div>
                         <h3 className="font-heading text-2xl font-bold uppercase mb-2">{step.title}</h3>
                         <p className="text-gray-400">{step.desc}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="bg-primary rounded-3xl p-1 lg:rotate-3 hover:rotate-0 transition-transform duration-500"
              >
                 <div className="bg-black h-full w-full rounded-[20px] overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgDiverse} className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" alt="App Preview" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Link href="/auth">
                         <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-20 w-20 rounded-full">
                           GO
                         </Button>
                       </Link>
                    </div>
                 </div>
              </motion.div>
            </div>
         </div>
      </section>

      {/* Credits Information Section */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Transparent Pricing</span>
            <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 text-white">
              Simple Credit System
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              Understand exactly how our credit system works and what you can create with each plan tier.
            </p>
            <Link href="/credits">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-black h-14 px-8 font-bold tracking-wide rounded-none uppercase">
                Learn About Credits
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Preview Section */}
      <section className="bg-gray-900 text-white py-24 md:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Got Questions?</span>
            <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase mb-6 text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Find answers to common questions about our meal planning service.
            </p>
            <Link href="/help">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-black h-14 px-8 font-bold tracking-wide rounded-none uppercase">
                View All FAQs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-32 text-center">
        <div className="container px-4">
          <h2 className="font-heading text-6xl md:text-9xl font-bold uppercase leading-none mb-8 text-black">
            Start Now
          </h2>
          <p className="text-xl md:text-2xl text-black/80 font-bold mb-12 max-w-2xl mx-auto">
            Your body is a machine. Stop fueling it with garbage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth">
              <Button className="bg-black text-white hover:bg-black/80 h-20 px-16 text-xl font-bold uppercase tracking-widest rounded-none">
                Build My Plan
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-black/30 text-black hover:bg-black hover:text-white h-20 px-12 text-xl font-bold uppercase tracking-widest rounded-none">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
