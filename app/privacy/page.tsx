"use client";

import { Layout } from "@/components/Layout";

export default function PrivacyPolicy() {
  const lastUpdated = "December 30, 2024";

  return (
    <Layout>
      <div className="bg-black text-white py-20">
        <div className="container max-w-screen-lg mx-auto px-4 md:px-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-4 text-white">Privacy Policy</h1>
          <p className="text-gray-500 mb-12">Last updated: {lastUpdated}</p>
          
          <div className="prose prose-lg text-gray-400 max-w-none space-y-8">
            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to TailoredMealPlan.com ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
              <p className="mb-4">
                <strong className="text-white">Contact Information:</strong><br />
                Email: privacy@tailoredmealplan.com<br />
                Website: https://tailoredmealplan.com
              </p>
              <p className="mb-4">
                By using our service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">2. Information We Collect</h2>
              
              <h3 className="text-white font-semibold text-xl mb-3">2.1 Personal Information</h3>
              <p className="mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Name and email address</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Account credentials</li>
                <li>Profile information and preferences</li>
              </ul>

              <h3 className="text-white font-semibold text-xl mb-3">2.2 Health and Dietary Information</h3>
              <p className="mb-4">To generate personalized meal plans, we collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Age, weight, height, and body metrics</li>
                <li>Health goals and fitness objectives</li>
                <li>Dietary restrictions and allergies</li>
                <li>Religious and cultural dietary preferences</li>
                <li>Medical conditions (if disclosed)</li>
                <li>Activity level and lifestyle information</li>
              </ul>

              <h3 className="text-white font-semibold text-xl mb-3">2.3 Usage Data</h3>
              <p className="mb-4">We automatically collect information about how you use our service:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Meal plans generated and viewed</li>
                <li>Features accessed and interactions</li>
                <li>Credit usage and subscription activity</li>
                <li>Time spent on the platform</li>
              </ul>

              <h3 className="text-white font-semibold text-xl mb-3">2.4 Technical Data</h3>
              <p className="mb-4">We collect technical information automatically:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>IP address and location data</li>
                <li>Device information (type, operating system, browser)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">3. How We Use Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Service Delivery:</strong> To generate personalized AI-powered meal plans based on your profile and preferences</li>
                <li><strong className="text-white">Payment Processing:</strong> To process subscription payments and manage billing</li>
                <li><strong className="text-white">Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
                <li><strong className="text-white">Service Improvement:</strong> To analyze usage patterns, improve our AI algorithms, and enhance user experience</li>
                <li><strong className="text-white">Communication:</strong> To send service-related notifications, updates, and respond to inquiries</li>
                <li><strong className="text-white">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                <li><strong className="text-white">Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">4. Third-Party Services</h2>
              <p className="mb-4">We use third-party services that may access your information:</p>
              
              <h3 className="text-white font-semibold text-xl mb-3">4.1 OpenAI</h3>
              <p className="mb-4">
                We use OpenAI's AI technology to generate meal plans. When you request a meal plan, your dietary preferences, health information, and goals are sent to OpenAI to generate personalized content. OpenAI processes this data according to their privacy policy. We do not store your information on OpenAI's servers beyond the processing required for meal plan generation.
              </p>
              <p className="mb-4 text-yellow-400">
                <strong>Important:</strong> Meal plans generated by AI may contain inaccuracies. Always verify information and consult healthcare professionals before making dietary changes.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">4.2 Razorpay</h3>
              <p className="mb-4">
                Payment processing is handled by Razorpay. We do not store your full payment card information. Razorpay processes payments according to their privacy policy and PCI-DSS compliance standards.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">4.3 Supabase</h3>
              <p className="mb-4">
                We use Supabase for database hosting and authentication. Your account data and meal plans are stored securely on Supabase's infrastructure.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">4.4 Email Service Providers</h3>
              <p className="mb-4">
                We may use email service providers to send transactional and marketing emails. These providers process email delivery and may track email opens and clicks.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">5. Data Sharing & Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
              
              <h3 className="text-white font-semibold text-xl mb-3">5.1 Service Providers</h3>
              <p className="mb-4">
                We share information with trusted service providers who assist in operating our service (OpenAI, Razorpay, Supabase, email services). These providers are contractually obligated to protect your information and use it only for specified purposes.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">5.2 Legal Requirements</h3>
              <p className="mb-4">
                We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety, or that of our users.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">5.3 Business Transfers</h3>
              <p className="mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.
              </p>

              <h3 className="text-white font-semibold text-xl mb-3">5.4 With Your Consent</h3>
              <p className="mb-4">
                We may share information with your explicit consent or at your direction.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encryption of data in transit (SSL/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
              </ul>
              <p className="mb-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">7. Your Rights (GDPR/CCPA Compliance)</h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              
              <h3 className="text-white font-semibold text-xl mb-3">7.1 Right to Access</h3>
              <p className="mb-4">You can request a copy of the personal information we hold about you.</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.2 Right to Rectification</h3>
              <p className="mb-4">You can request correction of inaccurate or incomplete information.</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.3 Right to Erasure</h3>
              <p className="mb-4">You can request deletion of your personal information, subject to legal and contractual obligations.</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.4 Right to Data Portability</h3>
              <p className="mb-4">You can request your data in a structured, machine-readable format.</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.5 Right to Object</h3>
              <p className="mb-4">You can object to processing of your information for certain purposes.</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.6 Right to Opt-Out (CCPA)</h3>
              <p className="mb-4">California residents can opt-out of the sale of personal information (we do not sell personal information).</p>

              <h3 className="text-white font-semibold text-xl mb-3">7.7 How to Exercise Your Rights</h3>
              <p className="mb-4">
                To exercise any of these rights, please contact us at privacy@tailoredmealplan.com. We will respond within 30 days (or as required by applicable law).
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
                <li><strong className="text-white">Meal Plans:</strong> Retained according to your subscription plan and deleted upon account deletion</li>
                <li><strong className="text-white">Payment Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong className="text-white">Usage Data:</strong> Retained for up to 2 years for analytics and service improvement</li>
              </ul>
              <p className="mb-4">
                You can delete your account at any time through your account settings. Upon deletion, we will delete or anonymize your personal information, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">9. Cookies & Tracking Technologies</h2>
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Maintain your session and authentication</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="mb-4">
                You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Standard contractual clauses approved by relevant authorities</li>
                <li>Compliance with applicable data protection regulations</li>
                <li>Security measures to protect your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">11. Children's Privacy</h2>
              <p className="mb-4">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">12. AI-Generated Content Disclaimer</h2>
              <p className="mb-4 text-yellow-400">
                <strong>Important Notice:</strong> Our meal plans are generated using artificial intelligence (AI) technology. AI-generated content may contain inaccuracies, errors, or inappropriate information. You should:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-yellow-400">
                <li>Verify all nutritional information and ingredient lists</li>
                <li>Check for allergens and dietary restrictions</li>
                <li>Consult with healthcare professionals before making significant dietary changes</li>
                <li>Not rely solely on AI-generated content for medical or nutritional decisions</li>
              </ul>
              <p className="mb-4">
                We are not responsible for any inaccuracies in AI-generated meal plans. Use of our service is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">13. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email notification for significant changes</li>
              </ul>
              <p className="mb-4">
                Your continued use of our service after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase mb-4">14. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="mb-4">
                <strong className="text-white">Email:</strong> privacy@tailoredmealplan.com<br />
                <strong className="text-white">Website:</strong> https://tailoredmealplan.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

