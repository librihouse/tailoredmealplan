import { Layout } from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function Blog() {
  const posts = [
    {
      title: "The Ultimate Guide to Meal Prepping for Beginners",
      category: "Guides",
      image: "https://images.unsplash.com/photo-1543353071-087f9a74827e?q=80&w=2070&auto=format&fit=crop",
      excerpt: "Save time and money by preparing your meals ahead of time. Here is our step-by-step strategy.",
      date: "Oct 12, 2023"
    },
    {
      title: "Understanding Macros: Protein, Carbs, and Fats",
      category: "Nutrition Science",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop",
      excerpt: "What exactly are macronutrients and how much of each do you really need?",
      date: "Oct 08, 2023"
    },
    {
      title: "5 Delicious Keto-Friendly Dinner Recipes",
      category: "Recipes",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070&auto=format&fit=crop",
      excerpt: "Low carb doesn't mean low flavor. Try these chef-curated keto dishes tonight.",
      date: "Sep 28, 2023"
    },
    {
      title: "How Nutrition Affects Mental Health",
      category: "Wellness",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
      excerpt: "The gut-brain connection is real. Learn which foods can boost your mood and focus.",
      date: "Sep 15, 2023"
    },
    {
      title: "Navigating Social Events While on a Diet",
      category: "Lifestyle",
      image: "https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=1000&auto=format&fit=crop",
      excerpt: "Tips and tricks for enjoying parties and dinners out without derailing your progress.",
      date: "Aug 30, 2023"
    },
    {
      title: "Plant-Based Protein Sources You Should Know",
      category: "Vegan",
      image: "https://images.unsplash.com/photo-1511690656952-34342d2c7135?q=80&w=1000&auto=format&fit=crop",
      excerpt: "Moving towards a plant-based diet? Here is how to get enough protein without meat.",
      date: "Aug 21, 2023"
    }
  ];

  return (
    <Layout>
      <div className="bg-white py-20">
        <div className="container max-w-screen-xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
             <div>
               <h1 className="font-serif text-4xl font-bold text-text-dark mb-4">Nutrition Resources</h1>
               <p className="text-muted-foreground max-w-xl">Expert advice, healthy recipes, and wellness tips to help you reach your goals.</p>
             </div>
             <div className="relative w-full md:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search articles..." className="pl-10" />
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-6 mb-6">
             {["All", "Recipes", "Nutrition Science", "Wellness", "Guides", "Success Stories"].map((cat, i) => (
               <Button key={i} variant={i === 0 ? "default" : "outline"} size="sm" className="rounded-full whitespace-nowrap">
                 {cat}
               </Button>
             ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-none shadow-sm bg-gray-50">
                <div className="aspect-[16/10] overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardHeader className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="px-0 text-primary font-bold">Read Article &rarr;</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
