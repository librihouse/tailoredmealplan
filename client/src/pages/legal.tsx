import { Layout } from "@/components/Layout";
import { useLocation } from "wouter";

export default function Legal() {
  const [location] = useLocation();
  
  const getTitle = () => {
    if (location.includes("privacy")) return "Privacy Policy";
    if (location.includes("terms")) return "Terms of Service";
    if (location.includes("cookies")) return "Cookie Policy";
    return "Legal";
  };

  return (
    <Layout>
      <div className="bg-white py-20">
        <div className="container max-w-screen-md px-4">
          <h1 className="font-serif text-4xl font-bold text-text-dark mb-8">{getTitle()}</h1>
          
          <div className="prose prose-lg text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h3>1. Introduction</h3>
            <p>
              Welcome to TailoredMealPlan.com. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions.
            </p>
            
            <h3>2. Use of Service</h3>
            <p>
              Our service provides AI-generated meal plans for informational purposes only. We are not medical professionals. Always consult with a qualified healthcare provider before making significant changes to your diet.
            </p>
            
            <h3>3. Data Privacy</h3>
            <p>
              We take your privacy seriously. We collect data necessary to generate your personalized plan, including age, weight, and dietary preferences. We do not sell this data to third parties.
            </p>
            
            <h3>4. Subscriptions</h3>
            <p>
              Subscriptions are billed in advance on a recurring basis. You may cancel your subscription at any time to prevent future charges.
            </p>
            
            <h3>5. Liability</h3>
            <p>
              TailoredMealPlan.com shall not be held liable for any adverse health effects resulting from the use of our meal plans. Users are responsible for verifying ingredients and allergens.
            </p>
            
            <p className="italic mt-8">
              This is a placeholder for the {getTitle()}. In a production environment, this would contain the full legal text prepared by counsel.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
