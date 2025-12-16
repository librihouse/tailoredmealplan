import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="container max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold uppercase mb-6 text-white">Our Mission</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            To make personalized nutrition accessible to everyone, regardless of their culture, religion, or health condition.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-gray-900 py-20">
        <div className="container max-w-screen-lg mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div>
               <div className="w-full aspect-square bg-gray-200 rounded-2xl overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop" alt="Cooking healthy food" className="object-cover w-full h-full" />
               </div>
             </div>
             <div className="space-y-6">
               <h2 className="font-serif text-3xl font-bold text-white">Why We Started</h2>
               <p className="text-muted-foreground leading-relaxed">
                 TailoredMealPlan was born from a frustration with generic diet apps. Most platforms ignore cultural foods, religious restrictions, and the reality of family cooking.
               </p>
               <p className="text-muted-foreground leading-relaxed">
                 We realized that for a diet to be sustainable, it has to fit your lifestyle—not the other way around. By combining clinical nutrition standards with modern AI, we've created a system that adapts to you.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-black">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-bold text-white">Our Core Values</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: "Inclusivity", desc: "Food is culture. We respect every tradition and dietary need." },
              { title: "Science-Backed", desc: "Our AI is trained on verified nutritional guidelines, not fads." },
              { title: "Privacy First", desc: "Your health data is yours. We never sell it to advertisers." },
              { title: "Sustainability", desc: "We prioritize ingredients that are good for you and the planet." }
            ].map((value, i) => (
              <Card key={i} className="border-none shadow-none bg-transparent text-center">
                <CardContent>
                  <h3 className="font-serif text-xl font-bold mb-2 text-primary">{value.title}</h3>
                  <p className="text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
