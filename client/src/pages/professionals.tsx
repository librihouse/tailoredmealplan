import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, BriefcaseMedical, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Professionals() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <Layout>
      {/* B2B Hero */}
      <section className="bg-black text-white py-24 md:py-32 border-b border-white/10">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="inline-block bg-primary/20 border border-primary/30 px-4 py-1 rounded-full text-sm font-medium mb-6 text-primary">
                For Nutritionists, Dietitians & Coaches
              </div>
              <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase leading-tight mb-6 text-white">
                Scale Your <span className="text-primary">Practice</span> with AI
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Create personalized meal plans for hundreds of clients in minutes, not hours. HIPAA-compliant and white-labeled for your clinic.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-black text-lg px-8 h-14 font-bold uppercase tracking-wide rounded-none">
                Request Clinical Demo
              </Button>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur"
            >
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/20 border border-primary/30 p-2 rounded-lg">
                     <Users className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-white">Manage Patient Panels</h3>
                     <p className="text-gray-400 text-sm">Keep track of progress, preferences, and plans in one secure dashboard.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/20 border border-primary/30 p-2 rounded-lg">
                     <BriefcaseMedical className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-white">Professional Exports</h3>
                     <p className="text-gray-400 text-sm">Generate clinical-grade PDF meal plans with your logo and colors.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/20 border border-primary/30 p-2 rounded-lg">
                     <TrendingUp className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-white">Automated Monitoring</h3>
                     <p className="text-gray-400 text-sm">Let AI handle the adjustments based on patient adherence and check-ins.</p>
                   </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-24 md:py-32 bg-gray-900 text-white">
        <div className="container max-w-screen-lg px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-6 text-white">Why Clinics Choose Us</h2>
              <ul className="space-y-4 mb-12">
                {[
                  "Save 10+ hours per week on meal planning",
                  "Improve patient adherence with personalized plans",
                  "Integrates with major EMR systems",
                  "Focus on patient care, not calculation",
                  "HIPAA & GDPR Compliant data storage"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="p-6 bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur">
                <p className="italic text-gray-300 mb-4">"I used to spend 2 hours per patient on meal plans. Now it takes me 5 minutes. This tool is essential for any modern practice."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center text-primary font-bold">SJ</div>
                  <div>
                    <p className="font-bold text-sm text-white">Dr. Sarah Jenkins</p>
                    <p className="text-xs text-gray-400">Clinical Nutritionist</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg border-2 border-primary bg-gray-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white font-heading text-2xl uppercase">Request a Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">First Name</Label>
                      <Input placeholder="Jane" className="bg-gray-800 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Last Name</Label>
                      <Input placeholder="Doe" className="bg-gray-800 border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Work Email</Label>
                    <Input type="email" placeholder="jane@clinic.com" className="bg-gray-800 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Practice Type</Label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
                      <option>Private Practice</option>
                      <option>Hospital Department</option>
                      <option>Medical Clinic</option>
                      <option>Research Institute</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Patient Volume (Monthly)</Label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
                      <option>1 - 50</option>
                      <option>51 - 200</option>
                      <option>201 - 500</option>
                      <option>500+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Message (Optional)</Label>
                    <Textarea placeholder="Tell us about your needs..." className="bg-gray-800 border-white/10 text-white" />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide rounded-none h-12">Submit Request</Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
