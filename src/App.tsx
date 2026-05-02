import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Profile } from "@/pages/Profile";
import { DietPlans } from "@/pages/DietPlans";
import { DietPlanDetail } from "@/pages/DietPlanDetail";
import { Interactions } from "@/pages/Interactions";
import { FoodSafety } from "@/pages/FoodSafety";
import { Nutrition } from "@/pages/Nutrition";
import { CalorieCalculator } from "@/pages/CalorieCalculator";
import { DailyTracker } from "@/pages/DailyTracker";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { getPluginRoutes } from "@/plugins/registry";
import "@/plugins/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  return (
    <Suspense fallback={<Spinner />}>
      <Component />
    </Suspense>
  );
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const isPublic = location === "/login" || location === "/register";

  if (isLoading) return <Spinner />;

  if (isPublic || !user) {
    return (
      <Switch>
        <Route path="/login" component={() => <PublicOnlyRoute component={Login} />} />
        <Route path="/register" component={() => <PublicOnlyRoute component={Register} />} />
        <Route component={() => <Redirect to="/login" />} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route path="/diet-plans/:id" component={() => <ProtectedRoute component={DietPlanDetail} />} />
        <Route path="/diet-plans" component={() => <ProtectedRoute component={DietPlans} />} />
        <Route path="/tracker" component={() => <ProtectedRoute component={DailyTracker} />} />
        <Route path="/interactions" component={() => <ProtectedRoute component={Interactions} />} />
        <Route path="/food-safety" component={() => <ProtectedRoute component={FoodSafety} />} />
        <Route path="/nutrition" component={() => <ProtectedRoute component={Nutrition} />} />
        <Route path="/calorie-calculator" component={() => <ProtectedRoute component={CalorieCalculator} />} />
        {getPluginRoutes().map(({ path, component }) => (
          <Route key={path} path={path} component={() => <ProtectedRoute component={component} />} />
        ))}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <TooltipProvider>
              <WouterRouter>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
