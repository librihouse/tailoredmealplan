import type { Metadata } from "next";
import { Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TailoredMealPlan.com - Fuel Your Life",
  description: "AI-powered nutrition plans that respect your dietary needs, health goals, and cultural preferences",
  keywords: ["meal plan", "nutrition", "diet", "AI", "personalized", "health"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Hide Next.js error overlay - always remove from public view */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove Next.js error overlay and all error indicators
                const removeErrorOverlay = () => {
                  // Remove Next.js portal (error overlay container)
                  const portal = document.querySelector('nextjs-portal');
                  if (portal) {
                    portal.remove();
                  }
                  // Remove error dialogs
                  const dialogs = document.querySelectorAll('[data-nextjs-dialog]');
                  dialogs.forEach(el => el.remove());
                  // Remove error toasts/indicators
                  const toasts = document.querySelectorAll('[data-nextjs-toast]');
                  toasts.forEach(el => el.remove());
                  // Remove build watcher
                  const watcher = document.getElementById('__next-build-watcher');
                  if (watcher) watcher.remove();
                  // Remove error overlay
                  const overlay = document.getElementById('__nextjs-error-overlay');
                  if (overlay) overlay.remove();
                  // Remove any red error banners
                  const errorBanners = document.querySelectorAll('div[style*="background"][style*="red"], div[style*="background-color"][style*="red"]');
                  errorBanners.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.backgroundColor.includes('rgb(220, 38, 38)') || style.backgroundColor.includes('rgb(239, 68, 68)')) {
                      el.remove();
                    }
                  });
                  // Remove any fixed position error elements
                  const fixedErrors = document.querySelectorAll('div[style*="position: fixed"][style*="z-index"]');
                  fixedErrors.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (parseInt(style.zIndex) > 1000) {
                      el.remove();
                    }
                  });
                };
                // Run immediately
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeErrorOverlay);
                } else {
                  removeErrorOverlay();
                }
                // Watch for dynamically added overlays
                const observer = new MutationObserver(() => {
                  removeErrorOverlay();
                });
                observer.observe(document.body, { childList: true, subtree: true });
                // Also watch document head for portal injection
                observer.observe(document.head, { childList: true });
              })();
            `,
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${oswald.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

