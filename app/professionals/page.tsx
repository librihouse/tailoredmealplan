"use client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, BriefcaseMedical, TrendingUp, Dumbbell, Heart, Building2, GraduationCap, Clock, FileText, BarChart3, Shield, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Stock Images
const imgDiverse = "/attached_assets/stock_images/diverse_group_of_fit_366fe9ff.jpg";
const imgHealthy = "/attached_assets/stock_images/healthy_grilled_chic_db20ea65.jpg";
const imgSalmon = "/attached_assets/stock_images/salmon_fillet_with_r_b5ed646f.jpg";

export default function Professionals() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const professionalTypes = [
    {
      icon: BriefcaseMedical,
      title: "Clinical Nutritionists",
      description: "For registered dietitians and medical nutritionists",
      benefits: [
        "HIPAA-compliant patient data management",
        "Clinical-grade meal plans with medical modifications",
        "Integration with EMR systems",
        "Detailed nutritional analysis for medical records"
      ],
      stats: "Save 10+ hours/week",
      image: imgHealthy
    },
    {
      icon: Dumbbell,
      title: "Fitness Coaches & Trainers",
      description: "For personal trainers and strength coaches",
      benefits: [
        "Performance-focused meal plans for athletes",
        "Bulk meal plan generation for entire teams",
        "Macro tracking aligned with training cycles",
        "Pre/post workout nutrition optimization"
      ],
      stats: "200+ plans/month",
      image: imgDiverse
    },
    {
      icon: Building2,
      title: "Gyms & Fitness Studios",
      description: "For CrossFit boxes, yoga studios, and wellness centers",
      benefits: [
        "White-label meal plans with your branding",
        "Member portal integration",
        "Bulk client management (up to 2,000 members)",
        "Revenue share opportunities"
      ],
      stats: "Scale to 500+ clients",
      image: imgDiverse
    },
    {
      icon: Heart,
      title: "Medical Clinics",
      description: "For hospitals, private practices, and health centers",
      benefits: [
        "Multi-provider team access",
        "Specialized protocols (diabetes, cardiac, renal)",
        "Patient progress tracking and reporting",
        "Insurance-compliant documentation"
      ],
      stats: "Enterprise support",
      image: imgSalmon
    },
    {
      icon: GraduationCap,
      title: "Wellness Coaches",
      description: "For health coaches, life coaches, and nutrition consultants",
      benefits: [
        "Client onboarding automation",
        "Progress tracking dashboards",
        "Customizable meal plan templates",
        "Client communication tools"
      ],
      stats: "100+ clients",
      image: imgHealthy
    },
    {
      icon: Users,
      title: "Corporate Wellness Programs",
      description: "For HR departments and employee wellness initiatives",
      benefits: [
        "Company-wide nutrition programs",
        "Bulk employee meal planning",
        "Wellness challenge integration",
        "ROI reporting and analytics"
      ],
      stats: "Unlimited employees",
      image: imgDiverse
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Generation",
      description: "Create personalized meal plans in under 30 seconds. What used to take 2 hours now takes 2 minutes.",
      stat: "10x faster"
    },
    {
      icon: FileText,
      title: "Professional PDF Exports",
      description: "White-labeled meal plans with your logo, colors, and branding. Clinical-grade documentation ready for patient files.",
      stat: "100% branded"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track client adherence, progress metrics, and nutritional compliance across your entire practice.",
      stat: "Real-time insights"
    },
    {
      icon: Shield,
      title: "HIPAA & GDPR Compliant",
      description: "Enterprise-grade security with encrypted data storage. SOC 2 compliant infrastructure.",
      stat: "100% secure"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Generate meal plans in 20+ languages. Serve diverse client populations with culturally appropriate nutrition.",
      stat: "20+ languages"
    },
    {
      icon: Clock,
      title: "Automated Workflows",
      description: "Set up recurring meal plans, automated check-ins, and progress tracking. Focus on care, not admin.",
      stat: "80% time saved"
    }
  ];

  const useCases = [
    {
      scenario: "Private Practice Nutritionist",
      problem: "Spending 2+ hours per client creating meal plans manually",
      solution: "Generate comprehensive meal plans in 5 minutes with full customization",
      result: "See 3x more clients per week"
    },
    {
      scenario: "CrossFit Gym Owner",
      problem: "Members asking for nutrition guidance but no time to create plans",
      solution: "Bulk generate meal plans for entire membership with gym branding",
      result: "Added $5k/month in nutrition services"
    },
    {
      scenario: "Sports Team Coach",
      problem: "Need meal plans for 50+ athletes with different dietary needs",
      solution: "Generate team-wide plans with individual customization in minutes",
      result: "Improved team performance metrics by 15%"
    }
  ];

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
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black text-lg px-8 h-14 font-bold uppercase tracking-wide rounded-none">
                  Request Clinical Demo
                </Button>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 font-bold uppercase tracking-wide rounded-none">
                    View Pricing
                  </Button>
                </Link>
              </div>
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

      {/* Professional Types Section */}
      <section className="bg-gray-900 py-24 md:py-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase mb-6 text-white">
              Built for <span className="text-primary">Every Practice</span>
            </h2>
            <p className="text-xl text-gray-400">
              Whether you're a solo practitioner or managing hundreds of clients, our platform scales with your needs.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {professionalTypes.map((type, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group"
              >
                <Card className="bg-black border-white/10 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-video overflow-hidden bg-gray-800">
                    <img 
                      src={type.image} 
                      alt={type.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg group-hover:bg-primary group-hover:border-primary transition-colors">
                        <type.icon className="h-6 w-6 text-primary group-hover:text-black" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="font-heading text-2xl uppercase tracking-wide text-white mb-2">{type.title}</CardTitle>
                        <p className="text-gray-400 text-sm">{type.description}</p>
                      </div>
                    </div>
                    <div className="inline-block bg-primary/20 border border-primary/30 px-3 py-1 rounded-full text-xs font-bold text-primary uppercase tracking-wider">
                      {type.stats}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {type.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-black py-24 md:py-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase mb-6 text-white">
              Platform <span className="text-primary">Capabilities</span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to run a modern nutrition practice at scale.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
              >
                <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/20 px-2 py-1 rounded border border-primary/30">
                        {feature.stat}
                      </span>
                    </div>
                    <CardTitle className="font-heading text-xl uppercase tracking-wide text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases / Success Stories */}
      <section className="bg-gray-900 py-24 md:py-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase mb-6 text-white">
              Real <span className="text-primary">Results</span>
            </h2>
            <p className="text-xl text-gray-400">
              See how professionals are transforming their practices with AI-powered nutrition.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {useCases.map((useCase, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
              >
                <Card className="bg-black border-white/10 hover:border-primary/50 transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">{i + 1}</span>
                      </div>
                      <CardTitle className="font-heading text-xl uppercase tracking-wide text-white">{useCase.scenario}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem</p>
                      <p className="text-gray-400">{useCase.problem}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Solution</p>
                      <p className="text-gray-300">{useCase.solution}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Result</p>
                      <p className="text-white font-bold text-lg">{useCase.result}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-black py-24 md:py-32 border-y border-white/10">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "10+", label: "Hours Saved Per Week", icon: Clock },
              { number: "200+", label: "Meal Plans Per Month", icon: FileText },
              { number: "500+", label: "Clients Supported", icon: Users },
              { number: "20+", label: "Languages Available", icon: Globe }
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="bg-primary/20 border border-primary/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us + Demo Form */}
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
                  "HIPAA & GDPR Compliant data storage",
                  "White-label branding for your practice",
                  "Bulk generation for teams and groups",
                  "Multi-language support for diverse populations"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
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

              <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-xl">
                <h3 className="font-heading text-2xl font-bold uppercase mb-4 text-white">Ready to Scale?</h3>
                <p className="text-gray-300 mb-4">Start your 14-day free trial. No credit card required.</p>
                <Link href="/pricing">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide rounded-none h-12">
                    View Professional Pricing
                  </Button>
                </Link>
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
                  <p className="text-gray-400 text-sm mt-2">See how our platform can transform your practice</p>
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
                      <option>Gym / Fitness Studio</option>
                      <option>Wellness Center</option>
                      <option>Corporate Wellness</option>
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
                    <Textarea placeholder="Tell us about your needs..." className="bg-gray-800 border-white/10 text-white min-h-[100px]" />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wide rounded-none h-12">Submit Request</Button>
                  <p className="text-xs text-gray-500 text-center">We'll respond within 24 hours</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
