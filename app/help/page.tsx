"use client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, FileText, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How does the AI personalize my meal plan?",
      answer: "Our algorithm analyzes over 50 data points including your age, weight, activity level, dietary restrictions, and fitness goals. It then matches your macronutrient needs with recipes from our database that fit your cultural and taste preferences."
    },
    {
      question: "Can I swap out meals I don't like?",
      answer: "Absolutely. Every meal in your weekly plan has a 'Swap' button. You can choose from recommended alternatives that match the same nutritional profile, ensuring you stay on track without eating food you hate."
    },
    {
      question: "Is there a grocery list included?",
      answer: "Yes! Your weekly plan automatically generates a consolidated grocery list. You can check items off as you shop or export it to Instacart/Amazon Fresh for delivery."
    },
    {
      question: "Do you support intermittent fasting?",
      answer: "We do. You can configure your eating window in the settings. The AI will structure your calories and macros to ensure you're fueled during your feeding window."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can manage your subscription in the 'Account Settings' tab. Cancellations are effective at the end of your current billing cycle."
    }
  ];

  return (
    <Layout>
      <div className="bg-black text-white min-h-screen py-20">
        <div className="container max-w-screen-lg px-4 md:px-8">
          
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Support Center</span>
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 leading-none">
              How can we <span className="text-primary">Help?</span>
            </h1>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search for answers (e.g., 'Billing', 'Macros')..." 
                className="pl-12 bg-gray-900 border-white/20 h-14 text-lg text-white focus:border-primary rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              { icon: MessageSquare, title: "Live Chat", desc: "Chat with our support team 24/7.", action: "Start Chat" },
              { icon: Mail, title: "Email Support", desc: "Get a response within 24 hours.", action: "Send Email" },
              { icon: FileText, title: "Documentation", desc: "Browse detailed guides & tutorials.", action: "View Docs" }
            ].map((item, i) => (
              <Card key={i} className="bg-gray-900 border-white/10 hover:border-primary/50 transition-colors group">
                <CardHeader className="text-center pb-2">
                  <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-black transition-colors">
                    <item.icon className="h-6 w-6 text-primary group-hover:text-black" />
                  </div>
                  <CardTitle className="font-heading text-xl uppercase tracking-wide text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <p className="text-gray-400 text-sm mb-6">{item.desc}</p>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-primary hover:text-black font-bold uppercase tracking-wide w-full">
                    {item.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mb-20">
            <h2 className="font-heading text-3xl font-bold uppercase mb-8 border-l-4 border-primary pl-4">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 bg-gray-900/50 rounded-lg px-4">
                  <AccordionTrigger className="text-lg font-bold hover:text-primary text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed text-base pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="font-heading text-3xl font-bold uppercase mb-4">Still need help?</h2>
                <p className="text-gray-400 mb-8">
                  Fill out the form and our specialized nutrition support team will get back to you. We handle everything from technical issues to specific dietary questions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-gray-300">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>support@tailoredmealplan.com</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>+1 (888) 555-0199</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase text-gray-500">First Name</label>
                    <Input placeholder="John" className="bg-black border-white/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase text-gray-500">Last Name</label>
                    <Input placeholder="Doe" className="bg-black border-white/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-gray-500">Email</label>
                  <Input placeholder="john@example.com" className="bg-black border-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-gray-500">Message</label>
                  <Textarea placeholder="Describe your issue..." className="bg-black border-white/20 min-h-[120px]" />
                </div>
                <Button className="w-full bg-primary text-black font-bold uppercase tracking-widest hover:bg-primary/90 h-12">
                  Send Message <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
