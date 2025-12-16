import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Clock } from "lucide-react";

export default function Contact() {
  return (
    <Layout>
      <div className="bg-black text-white min-h-screen py-20">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase mb-4 text-white">Contact Us</h1>
            <p className="text-gray-400">Have questions? We're here to help.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Info Cards */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1 text-white">Email Us</h3>
                    <p className="text-sm text-gray-400">support@tailoredmealplan.com</p>
                    <p className="text-sm text-gray-400">partners@tailoredmealplan.com</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1 text-white">Support Hours</h3>
                    <p className="text-sm text-gray-400">Mon-Fri: 9am - 6pm EST</p>
                    <p className="text-sm text-gray-400">Sat: 10am - 2pm EST</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1 text-white">Headquarters</h3>
                    <p className="text-sm text-gray-400">123 Nutrition Way</p>
                    <p className="text-sm text-gray-400">Austin, TX 78701</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card className="h-full bg-gray-900/50 border-white/10">
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="How can we help?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea placeholder="Tell us more..." className="min-h-[150px]" />
                  </div>
                  <Button className="bg-primary hover:bg-primary-light text-white w-full md:w-auto px-8">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
