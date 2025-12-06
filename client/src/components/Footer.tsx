import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-12 md:py-16">
      <div className="container max-w-screen-2xl px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <Link href="/">
              <span className="font-serif text-2xl font-bold mb-4 block cursor-pointer">
                TailoredMealPlan.com
              </span>
            </Link>
            <p className="text-primary-foreground/80 text-sm mb-6 leading-relaxed">
              AI-powered nutrition plans that respect your dietary needs, health goals, and cultural preferences.
            </p>
            <div className="flex gap-4">
              <Facebook className="h-5 w-5 opacity-80 hover:opacity-100 cursor-pointer" />
              <Twitter className="h-5 w-5 opacity-80 hover:opacity-100 cursor-pointer" />
              <Instagram className="h-5 w-5 opacity-80 hover:opacity-100 cursor-pointer" />
              <Youtube className="h-5 w-5 opacity-80 hover:opacity-100 cursor-pointer" />
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-lg">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/professionals" className="hover:text-white">For Professionals</Link></li>
              <li><Link href="/testimonials" className="hover:text-white">Testimonials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-lg">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/recipes" className="hover:text-white">Recipe Database</Link></li>
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-lg">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
            </ul>
            
            <div className="mt-6 pt-6 border-t border-primary-light/30">
               <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                 <span>Language:</span>
                 <select className="bg-transparent border-none focus:ring-0 font-medium cursor-pointer">
                   <option value="en" className="text-black">English</option>
                   <option value="es" className="text-black">Español</option>
                   <option value="fr" className="text-black">Français</option>
                 </select>
               </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-light/30 pt-8 text-center text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} TailoredMealPlan.com. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
