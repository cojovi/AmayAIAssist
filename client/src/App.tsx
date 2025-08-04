import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { EmailTriagePage } from "@/pages/email-triage";
import { LoginPage } from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  console.log('Router rendering, current URL:', window.location.pathname);
  return (
    <Switch>
      <Route path="/login">
        <LoginPage />
      </Route>
      <Route path="/dashboard">
        <Dashboard />
      </Route>
      <Route path="/email-triage">
        <EmailTriagePage />
      </Route>
      <Route path="/">
        <Dashboard />
      </Route>
      <Route path="*">
        <LoginPage />
      </Route>
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
