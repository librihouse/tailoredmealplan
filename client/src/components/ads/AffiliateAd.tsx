import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ShoppingBag } from "lucide-react";

export interface AffiliateAdProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  affiliateUrl: string;
  ctaText?: string;
  showDisclaimer?: boolean;
  className?: string;
  variant?: "banner" | "card" | "inline";
}

export function AffiliateAd({
  title = "Recommended Products",
  description = "Check out these carefully selected products that can help with your meal planning journey.",
  imageUrl,
  affiliateUrl,
  ctaText = "Shop Now",
  showDisclaimer = true,
  className = "",
  variant = "card",
}: AffiliateAdProps) {
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  useEffect(() => {
    // Simple ad blocker detection
    const checkAdBlock = async () => {
      try {
        const testAd = document.createElement("div");
        testAd.className = "adsbox";
        testAd.style.position = "absolute";
        testAd.style.left = "-9999px";
        document.body.appendChild(testAd);
        
        setTimeout(() => {
          const isBlocked = testAd.offsetHeight === 0 || 
                           window.getComputedStyle(testAd).display === "none";
          setIsAdBlocked(isBlocked);
          document.body.removeChild(testAd);
        }, 100);
      } catch (e) {
        // If error, assume not blocked
        setIsAdBlocked(false);
      }
    };

    checkAdBlock();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Track affiliate click (you can add analytics here)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "affiliate_click", {
        affiliate_url: affiliateUrl,
      });
    }
    // Link will open naturally, no need to preventDefault
  };

  if (variant === "banner") {
    return (
      <div className={`affiliate-ad-banner ${className}`}>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="block"
        >
          <Card className="border-primary/20 hover:border-primary transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-24 h-24 object-cover rounded"
                  loading="lazy"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{description}</p>
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  {ctaText} <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
        {showDisclaimer && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            * Affiliate link - We may earn a commission at no extra cost to you
          </p>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`affiliate-ad-inline ${className}`}>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <ShoppingBag className="h-4 w-4" />
          {ctaText}
          <ExternalLink className="h-3 w-3" />
        </a>
        {showDisclaimer && (
          <span className="text-xs text-muted-foreground ml-2">(affiliate)</span>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`affiliate-ad-card ${className}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="block"
        >
          <CardContent className="p-6">
            {imageUrl && (
              <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <h3 className="font-bold text-xl mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="flex items-center justify-between">
              <span className="text-primary font-medium flex items-center gap-2">
                {ctaText} <ExternalLink className="h-4 w-4" />
              </span>
              {showDisclaimer && (
                <span className="text-xs text-muted-foreground">*Affiliate</span>
              )}
            </div>
          </CardContent>
        </a>
      </Card>
    </div>
  );
}

// Pre-configured ad components for common placements
export function GroceryAffiliateAd() {
  return (
    <AffiliateAd
      title="Shop Quality Ingredients"
      description="Get fresh, organic ingredients delivered to your door. Perfect for your meal plan."
      affiliateUrl="https://amazon.com/s?k=organic+grocery"
      ctaText="Shop Groceries"
      variant="card"
    />
  );
}

export function EquipmentAffiliateAd() {
  return (
    <AffiliateAd
      title="Kitchen Essentials"
      description="Upgrade your kitchen with these essential tools for meal prep and cooking."
      affiliateUrl="https://amazon.com/s?k=kitchen+essentials"
      ctaText="Shop Equipment"
      variant="banner"
    />
  );
}

