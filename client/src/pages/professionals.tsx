import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, BriefcaseMedical, TrendingUp } from "lucide-react";

export default function Professionals() {
  return (
    <Layout>
      {/* B2B Hero */}
      <section className="bg-white border-b py-20">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-primary/10 px-4 py-1 rounded-full text-sm font-medium mb-6 text-primary">
                For Nutritionists, Dietitians & Coaches
              </div>
              <h1 className="font-sans text-4xl md:text-6xl font-bold leading-tight mb-6 text-slate-900">
                Scale Your Nutrition Practice with AI
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Create personalized meal plans for hundreds of clients in minutes, not hours. HIPAA-compliant and white-labeled for your clinic.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white text-lg px-8 h-12">
                Request Clinical Demo
              </Button>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="bg-white p-2 rounded-lg border shadow-sm">
                     <Users className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-slate-900">Manage Patient Panels</h3>
                     <p className="text-slate-500 text-sm">Keep track of progress, preferences, and plans in one secure dashboard.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-white p-2 rounded-lg border shadow-sm">
                     <BriefcaseMedical className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-slate-900">Professional Exports</h3>
                     <p className="text-slate-500 text-sm">Generate clinical-grade PDF meal plans with your logo and colors.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-white p-2 rounded-lg border shadow-sm">
                     <TrendingUp className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl text-slate-900">Automated Monitoring</h3>
                     <p className="text-slate-500 text-sm">Let AI handle the adjustments based on patient adherence and check-ins.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-screen-lg px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-sans text-3xl font-bold text-slate-900 mb-6">Why Clinics Choose Us</h2>
              <ul className="space-y-4">
                {[
                  "Save 10+ hours per week on meal planning",
                  "Improve patient adherence with personalized plans",
                  "Integrates with major EMR systems",
                  "Focus on patient care, not calculation",
                  "HIPAA & GDPR Compliant data storage"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-12 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p className="italic text-slate-600 mb-4">"I used to spend 2 hours per patient on meal plans. Now it takes me 5 minutes. This tool is essential for any modern practice."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">SJ</div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Dr. Sarah Jenkins</p>
                    <p className="text-xs text-slate-500">Clinical Nutritionist</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Request a Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Work Email</Label>
                  <Input type="email" placeholder="jane@clinic.com" />
                </div>
                <div className="space-y-2">
                  <Label>Practice Type</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Private Practice</option>
                    <option>Hospital Department</option>
                    <option>Medical Clinic</option>
                    <option>Research Institute</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Patient Volume (Monthly)</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>1 - 50</option>
                    <option>51 - 200</option>
                    <option>201 - 500</option>
                    <option>500+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea placeholder="Tell us about your needs..." />
                </div>
                <Button className="w-full bg-primary hover:bg-primary-dark text-white">Submit Request</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
