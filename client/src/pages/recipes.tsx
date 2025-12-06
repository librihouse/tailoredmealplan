import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Clock, Flame, ChefHat, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

// Stock Images
import imgChicken from "@assets/stock_images/healthy_grilled_chic_db20ea65.jpg";
import imgOats from "@assets/stock_images/overnight_oats_with__82ca113a.jpg";
import imgSalmon from "@assets/stock_images/salmon_fillet_with_r_b5ed646f.jpg";
import imgSmoothie from "@assets/stock_images/protein_smoothie_bow_0e599ce4.jpg";
import imgCurry from "@assets/stock_images/vegetarian_chickpea__835d86f4.jpg";
import imgStirFry from "@assets/stock_images/keto_beef_stir_fry_w_debd7731.jpg";

const recipes = [
  {
    id: 1,
    title: "Grilled Chicken & Quinoa Power Bowl",
    image: imgChicken,
    time: "25 min",
    calories: "450 kcal",
    protein: "42g",
    tags: ["High Protein", "Gluten Free", "Lunch"],
    category: "Lunch"
  },
  {
    id: 2,
    title: "Overnight Berry Protein Oats",
    image: imgOats,
    time: "5 min",
    calories: "320 kcal",
    protein: "24g",
    tags: ["Breakfast", "Vegetarian", "Meal Prep"],
    category: "Breakfast"
  },
  {
    id: 3,
    title: "Roasted Salmon & Asparagus",
    image: imgSalmon,
    time: "30 min",
    calories: "520 kcal",
    protein: "38g",
    tags: ["Keto", "Dinner", "Heart Healthy"],
    category: "Dinner"
  },
  {
    id: 4,
    title: "Tropical Green Smoothie Bowl",
    image: imgSmoothie,
    time: "10 min",
    calories: "280 kcal",
    protein: "18g",
    tags: ["Vegan", "Breakfast", "Snack"],
    category: "Breakfast"
  },
  {
    id: 5,
    title: "Chickpea & Spinach Coconut Curry",
    image: imgCurry,
    time: "40 min",
    calories: "380 kcal",
    protein: "14g",
    tags: ["Vegan", "Dinner", "Comfort Food"],
    category: "Dinner"
  },
  {
    id: 6,
    title: "Keto Beef & Broccoli Stir-Fry",
    image: imgStirFry,
    time: "20 min",
    calories: "480 kcal",
    protein: "45g",
    tags: ["Keto", "High Protein", "Dinner"],
    category: "Dinner"
  }
];

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="bg-black text-white min-h-screen py-20">
        <div className="container max-w-screen-xl px-4 md:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Fuel Your Body</span>
            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase mb-6 leading-none">
              Recipe <span className="text-primary">Database</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium">
              Chef-designed, nutritionist-approved meals tailored for your goals.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between bg-gray-900 p-6 border border-white/10 rounded-xl">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search recipes (e.g., 'Chicken', 'Keto')..." 
                className="pl-10 bg-black border-white/20 h-12 text-white focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {["All", "Breakfast", "Lunch", "Dinner", "Snack"].map((cat) => (
                <Button 
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-6 font-bold uppercase tracking-wide whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-black hover:bg-primary/90" 
                      : "border-white/20 text-white hover:bg-white/10 hover:text-primary"
                  )}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-gray-900 border-white/10 overflow-hidden hover:border-primary/50 transition-all group h-full flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={recipe.image} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black/80 text-primary font-bold hover:bg-black uppercase tracking-wider">
                        {recipe.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl uppercase tracking-wide text-white line-clamp-2 h-16">
                      {recipe.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-1">
                    <div className="flex justify-between text-sm text-gray-400 font-medium border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {recipe.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-primary" />
                        {recipe.calories}
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary" />
                        {recipe.protein}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map(tag => (
                        <span key={tag} className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button className="w-full bg-white/5 hover:bg-primary hover:text-black text-white border border-white/10 font-bold uppercase tracking-widest group-hover:border-primary transition-all">
                      View Recipe <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500 font-heading uppercase">No recipes found matching your criteria.</p>
              <Button 
                variant="link" 
                className="text-primary mt-4"
                onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
}

// Utility for class merging (if not already imported globally)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
