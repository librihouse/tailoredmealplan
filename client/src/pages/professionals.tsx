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
      <section className="bg-primary-dark text-white py-20">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-white/10 px-4 py-1 rounded-full text-sm font-medium mb-6 border border-white/20">
                For Nutritionists, Dietitians & Coaches
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6">
                Scale Your Nutrition Practice with AI
              </h1>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Create personalized meal plans for hundreds of clients in minutes, not hours. White-labeled with your branding.
              </p>
              <Button size="lg" className="bg-white text-primary-dark hover:bg-white/90 text-lg px-8 h-12">
                Request Demo
              </Button>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="bg-white/10 p-2 rounded-lg">
                     <Users className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl">Manage Unlimited Clients</h3>
                     <p className="text-white/70 text-sm">Keep track of progress, preferences, and plans in one dashboard.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-white/10 p-2 rounded-lg">
                     <BriefcaseMedical className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl">Professional Exports</h3>
                     <p className="text-white/70 text-sm">Generate beautiful PDF meal plans with your logo and colors.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-white/10 p-2 rounded-lg">
                     <TrendingUp className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h3 className="font-bold text-xl">Automated Progress</h3>
                     <p className="text-white/70 text-sm">Let AI handle the adjustments based on client check-ins.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-20 bg-white">
        <div className="container max-w-screen-lg px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary-dark mb-6">Why Professionals Choose Us</h2>
              <ul className="space-y-4">
                {[
                  "Save 10+ hours per week on meal planning",
                  "Increase client retention with better plans",
                  "Charge a premium for personalized nutrition",
                  "Focus on coaching, not calculation",
                  "HIPAA Compliant data storage"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="italic text-gray-600 mb-4">"I used to spend 2 hours per client on meal plans. Now it takes me 5 minutes. My business has doubled since switching."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-bold text-sm">Dr. Sarah Jenkins</p>
                    <p className="text-xs text-gray-500">Clinical Nutritionist</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-t-4 border-t-primary shadow-lg">
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
                  <Label>Business Type</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Private Practice</option>
                    <option>Gym / Fitness Center</option>
                    <option>Medical Clinic</option>
                    <option>Corporate Wellness</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Clients</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>1 - 10</option>
                    <option>11 - 50</option>
                    <option>51 - 200</option>
                    <option>200+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea placeholder="Tell us about your needs..." />
                </div>
                <Button className="w-full bg-primary hover:bg-primary-light text-white">Submit Request</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
