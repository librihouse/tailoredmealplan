import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-black text-white py-20 border-t border-white/10">
      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/">
              <span className="font-heading text-3xl font-bold italic tracking-tighter text-primary cursor-pointer block mb-6">
                TAILORED<span className="text-white not-italic">MEALPLAN</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              We build high-performance nutrition technology for humans who want to optimize their biology.
            </p>
          </div>

          <div>
            <h4 className="font-bold tracking-widest uppercase mb-6 text-sm text-gray-500">Platform</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/how-it-works" className="hover:text-primary transition-colors">HOW IT WORKS</Link></li>
              <li><Link href="/features" className="hover:text-primary transition-colors">FEATURES</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">PRICING</Link></li>
              <li><Link href="/professionals" className="hover:text-primary transition-colors">FOR COACHES</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold tracking-widest uppercase mb-6 text-sm text-gray-500">Resources</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/help" className="hover:text-primary transition-colors">SUPPORT</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold tracking-widest uppercase mb-6 text-sm text-gray-500">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-widest">
          <p>&copy; 2026 TAILOREDMEALPLAN. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}
