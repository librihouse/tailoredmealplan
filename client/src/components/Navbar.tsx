import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/how-it-works", label: "HOW IT WORKS" },
    { href: "/features", label: "FEATURES" },
    { href: "/pricing", label: "PRICING" },
    { href: "/professionals", label: "PROFESSIONAL" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/90 backdrop-blur text-white">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
        <div className="flex items-center gap-12">
          <Link href="/" className="mr-4 flex items-center space-x-2">
            <span className="font-heading text-2xl font-bold tracking-tighter text-primary italic">
              TAILORED<span className="text-white not-italic">MEALPLAN</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 font-bold tracking-wide">
              LOG IN
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold tracking-wide px-6 py-5 rounded-none skew-x-[-10deg]">
              <span className="skew-x-[10deg]">START NOW</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white hover:bg-white/10">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black p-4 space-y-4 animate-in slide-in-from-top-5">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="block text-lg font-bold text-white hover:text-primary py-2 tracking-wide"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center border-white/20 text-white hover:bg-white/10 font-bold bg-transparent">LOG IN</Button>
            </Link>
            <Link href="/onboarding" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-primary text-black font-bold">GET PLAN</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
