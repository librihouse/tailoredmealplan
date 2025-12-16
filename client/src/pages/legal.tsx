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
      <div className="bg-black text-white py-20">
        <div className="container max-w-screen-md mx-auto px-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-8 text-white">{getTitle()}</h1>
          
          <div className="prose prose-lg text-gray-400 max-w-none">
            <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-white font-heading text-2xl uppercase mb-4">1. Introduction</h3>
            <p className="mb-6">
              Welcome to TailoredMealPlan.com. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions.
            </p>
            
            <h3 className="text-white font-heading text-2xl uppercase mb-4">2. Use of Service</h3>
            <p className="mb-6">
              Our service provides AI-generated meal plans for informational purposes only. We are not medical professionals. Always consult with a qualified healthcare provider before making significant changes to your diet.
            </p>
            
            <h3 className="text-white font-heading text-2xl uppercase mb-4">3. Data Privacy</h3>
            <p className="mb-6">
              We take your privacy seriously. We collect data necessary to generate your personalized plan, including age, weight, and dietary preferences. We do not sell this data to third parties.
            </p>
            
            <h3 className="text-white font-heading text-2xl uppercase mb-4">4. Subscriptions</h3>
            <p className="mb-6">
              Subscriptions are billed in advance on a recurring basis. You may cancel your subscription at any time to prevent future charges.
            </p>
            
            <h3 className="text-white font-heading text-2xl uppercase mb-4">5. Liability</h3>
            <p className="mb-6">
              TailoredMealPlan.com shall not be held liable for any adverse health effects resulting from the use of our meal plans. Users are responsible for verifying ingredients and allergens.
            </p>
            
            <p className="italic mt-8 text-gray-500">
              This is a placeholder for the {getTitle()}. In a production environment, this would contain the full legal text prepared by counsel.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
