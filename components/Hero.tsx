"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
const heroVideo = "/attached_assets/generated_videos/diverse_fit_people_eating_healthy_in_a_modern_wellness_cafe.mp4";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-black text-white">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10"></div>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="h-full w-full object-cover opacity-80"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      </div>

      <div className="container relative z-20 flex h-full max-w-screen-2xl flex-col justify-center px-4 md:px-8 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 border border-primary/50 bg-black/50 px-4 py-2 backdrop-blur-md mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-bold text-sm tracking-widest text-primary uppercase">AI-Powered Nutrition</span>
          </div>
          
          <h1 className="font-heading text-6xl md:text-8xl font-bold uppercase leading-[0.9] tracking-tight mb-8">
            Fuel Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Ambition</span>
          </h1>
          
          <p className="max-w-xl text-lg md:text-xl font-medium text-gray-200 mb-10 leading-relaxed">
            Stop guessing. Start fueling. Personalized meal plans built for your biology, your goals, and your culture.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            
          </div>
        </motion.div>
      </div>

      {/* Scrolling Ticker */}
      <div className="absolute bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur-md py-4 overflow-hidden z-20">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {/* Duplicate content for seamless infinite scroll */}
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={`${setIndex}-${i}`} className="flex items-center mx-4 md:mx-8 shrink-0">
                  <span className="text-primary font-bold mx-2 md:mx-4">★</span>
                  <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-white/70">CULTURE • SCIENCE • PERFORMANCE • TASTE •</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
