import { useEffect } from "react";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterHandle?: string;
  structuredData?: object;
}

export function SEO({
  title = "TailoredMealPlan.com - Fuel Your Life",
  description = "Personalized nutrition for modern life. AI-powered meal plans that fit your goals, culture, and vibe.",
  image = "/opengraph.jpg",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  siteName = "TailoredMealPlan.com",
  twitterHandle = "@TailoredMealPlan",
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    
    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:site_name", siteName, true);
    
    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:site", twitterHandle);
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Structured data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function (optional, but good practice)
    return () => {
      // Note: We don't remove meta tags on unmount as they should persist
      // until the next page navigation
    };
  }, [title, description, image, url, type, siteName, twitterHandle, structuredData]);

  return null;
}

