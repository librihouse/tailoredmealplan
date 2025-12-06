import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Droplets, Trophy, Globe, Heart } from "lucide-react";
import { Link } from "wouter";

// Stock Images
import imgDiverse from "@assets/stock_images/diverse_group_of_fit_366fe9ff.jpg";
import imgBowl from "@assets/stock_images/close_up_delicious_h_eb7900ea.jpg";
import imgIndian from "@assets/stock_images/indian_healthy_veget_787c2b3b.jpg";
import imgMed from "@assets/stock_images/mediterranean_diet_s_2ac4209c.jpg";

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
      <section className="bg-white text-black py-24 md:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase leading-none mb-8 text-black">
                Eat Like <br />
                <span className="text-primary">You Give a Damn.</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
                Generic meal plans are dead. You need nutrition that understands your DNA, your gym schedule, and your grandma's recipes. We combine hardcore science with real food culture.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <h3 className="text-3xl font-bold text-black mb-2">10k+</h3>
                  <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">Athletes Fueled</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-black mb-2">50+</h3>
                  <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">Cuisines</p>
                </div>
              </div>

              <Link href="/features">
                <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white h-14 px-8 font-bold tracking-wide rounded-none uppercase transition-all">
                  Explore Features
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 shadow-2xl">
                <img src={imgDiverse} alt="Fit diverse group" className="h-full w-full object-cover opacity-100 hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="absolute -bottom-10 -left-10 w-2/3 border-8 border-white shadow-xl">
                 <img src={imgBowl} alt="Healthy Bowl" className="w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cultural Inclusion / Food Grid */}
      <section className="bg-gray-50 text-black py-24 md:py-32 overflow-hidden">
        <div className="container max-w-screen-2xl px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">No More Chicken & Broccoli</span>
            <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 text-black">
              Culture on <br /> Your Plate
            </h2>
            <p className="text-xl text-gray-600 font-medium">
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
              <motion.div key={i} variants={fadeInUp} className="group cursor-pointer bg-white p-4 shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-[4/3] overflow-hidden mb-6 bg-gray-100">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <h3 className="font-heading text-3xl font-bold uppercase mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-gray-600 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white text-black py-24 md:py-32">
         <div className="container max-w-screen-2xl px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-20">
              <motion.div
                 initial="hidden"
                 whileInView="visible"
                 viewport={{ once: true }}
                 variants={fadeInUp}
              >
                 <h2 className="font-heading text-5xl md:text-6xl font-bold uppercase mb-12 text-black">
                   The <span className="text-primary">Algorithm</span>
                 </h2>
                 
                 <div className="space-y-12">
                   {[
                     { icon: Globe, title: "01. Input Your Profile", desc: "Age, weight, goals, and cultural background." },
                     { icon: Flame, title: "02. AI Calculation", desc: "We crunch 50+ biomarkers to find your perfect fuel mix." },
                     { icon: Trophy, title: "03. Execute & Win", desc: "Get a weekly grocery list and recipes. Hit your PRs." }
                   ].map((step, i) => (
                     <div key={i} className="flex gap-6 group">
                       <div className="h-16 w-16 shrink-0 border-2 border-gray-200 flex items-center justify-center rounded-full group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                         <step.icon className="h-8 w-8" />
                       </div>
                       <div>
                         <h3 className="font-heading text-2xl font-bold uppercase mb-2">{step.title}</h3>
                         <p className="text-gray-600 font-medium">{step.desc}</p>
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
                 className="bg-primary rounded-3xl p-1 lg:rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl"
              >
                 <div className="bg-white h-full w-full rounded-[20px] overflow-hidden relative">
                    <img src={imgDiverse} className="w-full h-full object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-700" alt="App Preview" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Link href="/onboarding">
                         <Button size="lg" className="bg-black text-white hover:bg-black/90 font-bold h-20 w-20 rounded-full shadow-lg hover:scale-110 transition-transform">
                           GO
                         </Button>
                       </Link>
                    </div>
                 </div>
              </motion.div>
            </div>
         </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-32 text-center">
        <div className="container px-4">
          <h2 className="font-heading text-6xl md:text-9xl font-bold uppercase leading-none mb-8 text-white drop-shadow-sm">
            Start Now
          </h2>
          <p className="text-xl md:text-2xl text-white/90 font-bold mb-12 max-w-2xl mx-auto">
            Your body is a machine. Stop fueling it with garbage.
          </p>
          <Link href="/onboarding">
             <Button className="bg-white text-primary hover:bg-gray-100 h-20 px-16 text-xl font-bold uppercase tracking-widest rounded-none shadow-xl">
               Build My Plan
             </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
