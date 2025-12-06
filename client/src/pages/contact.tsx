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
      <div className="bg-bg-cream min-h-screen py-20">
        <div className="container max-w-screen-xl px-4">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl font-bold text-text-dark mb-4">Contact Us</h1>
            <p className="text-muted-foreground">Have questions? We're here to help.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Info Cards */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Email Us</h3>
                    <p className="text-sm text-muted-foreground">support@tailoredmealplan.com</p>
                    <p className="text-sm text-muted-foreground">partners@tailoredmealplan.com</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Support Hours</h3>
                    <p className="text-sm text-muted-foreground">Mon-Fri: 9am - 6pm EST</p>
                    <p className="text-sm text-muted-foreground">Sat: 10am - 2pm EST</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Headquarters</h3>
                    <p className="text-sm text-muted-foreground">123 Nutrition Way</p>
                    <p className="text-sm text-muted-foreground">Austin, TX 78701</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card className="h-full">
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
