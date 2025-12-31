import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Pricing from "@/pages/pricing";
import HowItWorks from "@/pages/how-it-works";
import Features from "@/pages/features";
import Professionals from "@/pages/professionals";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Help from "@/pages/help";
import Legal from "@/pages/legal";
import Dashboard from "@/pages/dashboard";
import MealPlans from "@/pages/meal-plans";
import MealPlanView from "@/pages/meal-plan-view";
import Settings from "@/pages/settings";
import ProfessionalOnboarding from "@/pages/professional-onboarding";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import CustomerTypeSelection from "@/pages/customer-type-selection";
import GenerateMealPlan from "@/pages/generate-meal-plan";

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, setLocation]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  return <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/features" component={Features} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/signup" component={Auth} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/customer-type-selection">
        <ProtectedRoute>
          <CustomerTypeSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/professional-onboarding">
        <ProtectedRoute>
          <ProfessionalOnboarding />
        </ProtectedRoute>
      </Route>
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={Help} />
      <Route path="/privacy" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/cookies" component={Legal} />
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/meal-plans">
        <ProtectedRoute>
          <MealPlans />
        </ProtectedRoute>
      </Route>
      <Route path="/meal-plans/:id">
        <ProtectedRoute>
          <MealPlanView />
        </ProtectedRoute>
      </Route>
      <Route path="/generate-meal-plan">
        <ProtectedRoute>
          <GenerateMealPlan />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
