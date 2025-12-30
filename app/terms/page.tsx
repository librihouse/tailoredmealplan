"use client";

import { Layout } from "@/components/Layout";

export default function TermsOfService() {
  const lastUpdated = "December 30, 2024";

  return (
    <Layout>
      <div className="bg-black text-white py-20">
        <div className="container max-w-screen-lg mx-auto px-4 md:px-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-4 text-white">Terms of Service</h1>
          <p className="text-gray-500 mb-12">Last updated: {lastUpdated}</p>
          
          <div className="prose prose-lg text-gray-400 max-w-none space-y-8">
            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using TailoredMealPlan.com ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access or use the Service.
              </p>
              <p className="mb-4">
                <strong className="text-white">Age Requirement:</strong> You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
              </p>
              <p className="mb-4">
                <strong className="text-white">Modifications:</strong> We reserve the right to modify these Terms at any time. Material changes will be notified via email or prominent notice on our website. Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">2. Service Description</h2>
              <p className="mb-4">
                TailoredMealPlan.com provides AI-powered personalized meal planning services. Our Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI-generated meal plans (daily, weekly, and monthly)</li>
                <li>Personalized recipes and nutritional information</li>
                <li>Grocery lists and shopping recommendations</li>
                <li>Dietary customization based on your preferences</li>
                <li>PDF export functionality</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Informational Purposes Only:</strong> Our Service is provided for informational and planning purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or health condition.
              </p>
            </section>

            <section className="bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded">
              <h2 className="text-yellow-400 font-heading text-2xl uppercase mb-4">3. AI-Generated Content Disclaimer (CRITICAL)</h2>
              <p className="mb-4 text-yellow-300">
                <strong className="text-yellow-400">IMPORTANT:</strong> All meal plans, recipes, and nutritional information provided by our Service are generated using artificial intelligence (AI) technology.
              </p>
              <p className="mb-4 text-yellow-300">
                <strong className="text-yellow-400">AI Limitations:</strong> You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-yellow-300">
                <li>AI technology may produce inaccurate, incomplete, or inappropriate content</li>
                <li>AI-generated meal plans may contain errors in nutritional calculations, ingredient lists, or cooking instructions</li>
                <li>AI may not account for all individual health conditions, allergies, or dietary restrictions</li>
                <li>AI-generated content is not verified by human nutritionists or medical professionals</li>
                <li>The accuracy, completeness, or suitability of AI-generated content is not guaranteed</li>
              </ul>
              <p className="mb-4 text-yellow-300">
                <strong className="text-yellow-400">Your Responsibilities:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-yellow-300">
                <li>You are solely responsible for verifying all information in AI-generated meal plans</li>
                <li>You must check ingredient lists for allergens and dietary restrictions</li>
                <li>You must verify nutritional information and portion sizes</li>
                <li>You must consult healthcare professionals before making significant dietary changes</li>
                <li>You assume all risks associated with using AI-generated content</li>
              </ul>
              <p className="mb-4 text-yellow-300">
                <strong className="text-yellow-400">No Liability:</strong> We are not responsible for any inaccuracies, errors, or adverse outcomes resulting from AI-generated content. Use of AI-generated meal plans is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">4. Medical Disclaimer (CRITICAL)</h2>
              <p className="mb-4 text-red-300">
                <strong className="text-red-400">NOT MEDICAL ADVICE:</strong> Our Service is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes.
              </p>
              <p className="mb-4">
                <strong className="text-white">Important:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>We are not healthcare providers, nutritionists, or dietitians</li>
                <li>No doctor-patient relationship is created by using our Service</li>
                <li>Our Service is not intended for use in medical emergencies</li>
                <li>If you have a medical condition, you must consult your doctor before using our Service</li>
                <li>If you are pregnant, nursing, or have a chronic health condition, consult your healthcare provider</li>
                <li>Do not disregard professional medical advice or delay seeking it because of information from our Service</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Allergic Reactions:</strong> Always check ingredient lists for allergens. We are not responsible for allergic reactions or adverse health effects resulting from following our meal plans.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">5. User Account & Responsibilities</h2>
              <p className="mb-4">
                <strong className="text-white">Account Creation:</strong> You are responsible for maintaining the confidentiality of your account credentials. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Prohibited Activities:</strong> You agree not to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Share your account credentials with others</li>
                <li>Resell or redistribute meal plans without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">6. Subscription Terms</h2>
              <p className="mb-4">
                <strong className="text-white">Billing:</strong> Subscriptions are billed monthly in advance. By subscribing, you authorize us to charge your payment method on a recurring monthly basis.
              </p>
              <p className="mb-4">
                <strong className="text-white">Automatic Renewal:</strong> Your subscription will automatically renew each month unless cancelled before the renewal date. You will be charged the then-current subscription fee.
              </p>
              <p className="mb-4">
                <strong className="text-white">Cancellation:</strong> You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. You will continue to have access to the Service until the end of your paid period.
              </p>
              <p className="mb-4">
                <strong className="text-white">Refund Policy:</strong> All subscription fees are non-refundable. We do not provide refunds or credits for partial billing periods, unused credits, or cancelled subscriptions, except as required by law.
              </p>
              <p className="mb-4">
                <strong className="text-white">Price Changes:</strong> We reserve the right to modify subscription prices. We will provide at least 30 days' notice of price increases. Continued use of the Service after a price change constitutes acceptance of the new price.
              </p>
              <p className="mb-4">
                <strong className="text-white">Payment Failure:</strong> If payment fails, we may suspend or terminate your subscription. You remain responsible for all charges incurred.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">7. Credit System</h2>
              <p className="mb-4">
                Our Service uses a credit system for meal plan generation:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Daily Plans:</strong> 1 credit per plan</li>
                <li><strong className="text-white">Weekly Plans:</strong> 2 credits per plan</li>
                <li><strong className="text-white">Monthly Plans:</strong> 4 credits per plan (available for Individual and Family plans only)</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Credit Terms:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Credits are non-refundable and cannot be exchanged for cash</li>
                <li>Credits cannot be transferred between accounts</li>
                <li>For paid plans: Credits reset monthly on your billing date</li>
                <li>For free tier: Credits are lifetime (one-time allocation)</li>
                <li>Unused credits do not roll over to the next billing period (for paid plans)</li>
                <li>We reserve the right to modify the credit system with 30 days' notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">8. Intellectual Property</h2>
              <p className="mb-4">
                <strong className="text-white">Our Content:</strong> All content on the Service, including meal plans, recipes, text, graphics, logos, and software, is the property of TailoredMealPlan.com or its licensors and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mb-4">
                <strong className="text-white">License to Use:</strong> We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes. You may not:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our content for commercial purposes</li>
                <li>Remove copyright or proprietary notices</li>
                <li>Create derivative works based on our content</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">User Content:</strong> If you submit content to us, you grant us a worldwide, royalty-free license to use, modify, and display such content for the purpose of providing and improving our Service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">9. Limitation of Liability (CRITICAL)</h2>
              <p className="mb-4">
                <strong className="text-white">Service Provided "As Is":</strong> The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p className="mb-4">
                <strong className="text-white">No Guarantees:</strong> We do not guarantee that:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results from following meal plans will meet your expectations</li>
                <li>AI-generated content will be accurate or complete</li>
                <li>Defects will be corrected</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Limitation of Liability:</strong> To the maximum extent permitted by law, TailoredMealPlan.com, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Health issues, injuries, or adverse reactions from following meal plans</li>
                <li>Allergic reactions or food-related illnesses</li>
                <li>Nutritional deficiencies or excesses</li>
                <li>Weight loss, weight gain, or other health outcomes</li>
                <li>Medical conditions or complications</li>
                <li>Inaccuracies in AI-generated content</li>
                <li>Service interruptions or unavailability</li>
                <li>Data loss or corruption</li>
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Third-party actions or content</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Maximum Liability:</strong> Our total liability to you for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
              <p className="mb-4 text-gray-500">
                <strong>Note:</strong> Some jurisdictions do not allow the exclusion of implied warranties or limitation of liability for incidental or consequential damages. In such jurisdictions, our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">10. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless TailoredMealPlan.com, its officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Any content you submit or transmit through the Service</li>
                <li>Your failure to verify AI-generated content or consult healthcare professionals</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">11. Termination</h2>
              <p className="mb-4">
                <strong className="text-white">Termination by You:</strong> You may terminate your account at any time by cancelling your subscription and deleting your account through account settings.
              </p>
              <p className="mb-4">
                <strong className="text-white">Termination by Us:</strong> We may suspend or terminate your account immediately, without prior notice, if you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Fail to pay subscription fees</li>
                <li>Misuse the Service or interfere with other users</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Effect of Termination:</strong> Upon termination:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your right to use the Service immediately ceases</li>
                <li>We may delete your account and data (subject to our Privacy Policy)</li>
                <li>You remain liable for all charges incurred before termination</li>
                <li>Provisions that by their nature should survive termination will remain in effect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">12. Dispute Resolution</h2>
              <p className="mb-4">
                <strong className="text-white">Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
              <p className="mb-4">
                <strong className="text-white">Dispute Resolution:</strong> Any disputes arising from or relating to these Terms or the Service shall be resolved through:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Good faith negotiations between the parties</li>
                <li>If negotiations fail, binding arbitration in accordance with [Arbitration Rules]</li>
                <li>Arbitration shall be conducted in [Location]</li>
                <li>You waive any right to participate in class action lawsuits or class-wide arbitration</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">Exceptions:</strong> Either party may seek injunctive relief in court to prevent irreparable harm or to enforce intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">13. Miscellaneous</h2>
              <p className="mb-4">
                <strong className="text-white">Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and TailoredMealPlan.com regarding the Service.
              </p>
              <p className="mb-4">
                <strong className="text-white">Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
              </p>
              <p className="mb-4">
                <strong className="text-white">Assignment:</strong> You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
              </p>
              <p className="mb-4">
                <strong className="text-white">Force Majeure:</strong> We are not liable for any failure to perform due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, or internet failures.
              </p>
              <p className="mb-4">
                <strong className="text-white">Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <p className="mb-4">
                <strong className="text-white">Email:</strong> legal@tailoredmealplan.com<br />
                <strong className="text-white">Website:</strong> https://tailoredmealplan.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

