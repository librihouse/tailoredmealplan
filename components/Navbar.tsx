"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, LayoutDashboard, Users, BarChart3, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getSubscriptionStatus } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { isB2BPlan } from "@shared/plans";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const pathname = usePathname();

  // Fetch subscription to determine user type
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscriptionStatus,
    enabled: isAuthenticated,
  });

  const planId = subscriptionData?.subscription?.planId || "free";
  const isProfessional = isAuthenticated && isB2BPlan(planId as any);

  const publicLinks = [
    { href: "/how-it-works", label: "HOW IT WORKS" },
    { href: "/features", label: "FEATURES" },
    { href: "/pricing", label: "PRICING" },
    { href: "/professionals", label: "PROFESSIONAL" },
  ];

  // Different nav links for professionals vs individuals
  const individualLinks = [
    { href: "/dashboard", label: "DASHBOARD" },
    { href: "/meal-plans", label: "MY PLANS" },
    { href: "/pricing", label: "PRICING" },
  ];

  const professionalLinks = [
    { href: "/dashboard", label: "DASHBOARD" },
    { href: "/pricing", label: "PRICING" },
  ];

  const authLinks = isProfessional ? professionalLinks : individualLinks;

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
            {isAuthenticated ? (
              authLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-primary",
                    pathname === link.href && "text-primary"
                  )}
                >
                  {link.label}
                </Link>
              ))
            ) : (
              publicLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 font-bold tracking-wide flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user?.email?.split("@")[0] || "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white w-56">
                <DropdownMenuLabel className="text-gray-400">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {isProfessional ? (
                  <>
                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                      <Users className="mr-2 h-4 w-4" />
                      Clients (Coming Soon)
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics (Coming Soon)
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/meal-plans" className="cursor-pointer flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      My Plans
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth?tab=login">
                <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5 font-bold tracking-wide">
                  LOG IN
                </Button>
              </Link>
              <Link href="/auth?tab=signup">
                <Button className="bg-primary hover:bg-primary/90 text-black font-bold tracking-wide px-6 py-5 rounded-none skew-x-[-10deg]">
                  <span className="skew-x-[10deg]">START NOW</span>
                </Button>
              </Link>
            </>
          )}
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
          {isAuthenticated ? (
            <>
              {authLinks.map((link) => (
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
                <Button 
                  variant="outline" 
                  className="w-full justify-center border-white/20 text-white hover:bg-white/10 font-bold bg-transparent"
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  SIGN OUT
                </Button>
              </div>
            </>
          ) : (
            <>
              {publicLinks.map((link) => (
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
                <Link href="/auth?tab=login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-center border-white/20 text-white hover:bg-white/10 font-bold bg-transparent">LOG IN</Button>
                </Link>
                <Link href="/auth?tab=signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary text-black font-bold">GET PLAN</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
