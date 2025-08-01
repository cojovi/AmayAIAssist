import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { EmailTriagePage } from "@/pages/email-triage";
import { LoginPage } from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  
  const { data: authStatus, isLoading, error } = useQuery({
    queryKey: ["/api/auth/status"],
    retry: false,
    refetchInterval: false,
  });

  useEffect(() => {
    // If we get a 401 error or explicit false, redirect to login
    if (!isLoading && (error || authStatus === false || (authStatus && !(authStatus as any).authenticated))) {
      navigate('/login');
    }
  }, [authStatus, isLoading, error, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  // If not authenticated, show nothing while redirecting
  if (error || authStatus === false || !authStatus || !(authStatus as any).authenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/email-triage">
        <AuthGuard>
          <EmailTriagePage />
        </AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground cyber-grid">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
