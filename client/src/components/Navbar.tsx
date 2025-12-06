import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/how-it-works", label: "HOW IT WORKS" },
    { href: "/features", label: "FEATURES" },
    { href: "/pricing", label: "PRICING" },
    { href: "/professionals", label: "PRO" },
  ];

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled ? "bg-white border-b border-gray-100 shadow-sm text-black py-2" : "bg-transparent text-white py-4"
    )}>
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-12">
          <Link href="/" className="mr-4 flex items-center space-x-2">
            <span className={cn("font-heading text-2xl font-bold tracking-tighter italic transition-colors", scrolled ? "text-primary" : "text-white")}>
              TAILORED<span className={cn("not-italic", scrolled ? "text-black" : "text-white")}>MEALPLAN</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn("transition-colors hover:text-primary", scrolled ? "text-gray-700" : "text-white/90")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className={cn("font-bold tracking-wide hover:bg-primary/10", scrolled ? "text-black hover:text-primary" : "text-white hover:text-primary")}>
              LOG IN
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold tracking-wide px-6 rounded-none skew-x-[-10deg]">
              <span className="skew-x-[10deg]">START NOW</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className={cn("hover:bg-primary/10", scrolled ? "text-black" : "text-white")}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-4 animate-in slide-in-from-top-5 shadow-lg absolute w-full left-0">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="block text-lg font-bold text-black hover:text-primary py-2 tracking-wide"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center border-gray-200 text-black font-bold">LOG IN</Button>
            </Link>
            <Link href="/onboarding" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-primary text-white font-bold">GET PLAN</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
