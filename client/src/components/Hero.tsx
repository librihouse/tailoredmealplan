import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import heroImage from "@assets/generated_images/a_beautiful,_healthy_meal_spread_for_a_nutrition_app_hero_section..png";

export function Hero() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-bg-cream">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              AI-Powered Nutrition
            </div>
            
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-text-dark">
              Your Perfect Meal Plan, <span className="text-primary relative">
                Tailored
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                   <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span> Just for You
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              AI-powered nutrition plans that respect your dietary needs, health goals, and cultural preferences. Whether you're vegan, keto, or halal—we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/onboarding">
                <Button size="lg" className="bg-primary hover:bg-primary-light text-white h-12 px-8 text-lg rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  Get Your Free Meal Plan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/professionals">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-primary/20 text-primary hover:bg-primary/5">
                  For Professionals
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>10,000+ Plans Created</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>50+ Diet Types</span>
              </div>
            </div>
          </div>

          <div className="relative lg:h-[600px] w-full flex items-center justify-center">
             <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl transform rotate-12 scale-75 opacity-60"></div>
             <img 
               src={heroImage} 
               alt="Healthy meal spread" 
               className="relative rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 ease-out object-cover w-full max-w-md lg:max-w-full h-auto border-8 border-white"
             />
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 md:bottom-10 md:left-0 bg-white p-4 rounded-xl shadow-lg border border-border/40 flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-1000 delay-300">
               <div className="bg-primary/10 p-2 rounded-full text-primary">
                 <Star className="h-6 w-6 fill-current" />
               </div>
               <div>
                 <p className="font-bold text-text-dark">4.9/5 Rating</p>
                 <p className="text-xs text-muted-foreground">from 2,000+ reviews</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
