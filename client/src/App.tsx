import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard-new";
import Projects from "@/pages/projects";
import BudgetPlanning from "@/pages/budget-planning";
import FinancialRecords from "@/pages/financial-records";
import Reports from "@/pages/reports";
import ImportExport from "@/pages/import-export";
import UploadedData from "@/pages/uploaded-data";

import CATSBooking from "@/pages/cats-booking";
import ApiIntegrations from "@/pages/api-integrations";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Sidebar from "@/components/layout/sidebar";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { Loader2 } from "lucide-react";
import { registerSW } from "@/utils/serviceWorker";

function AuthenticatedApp() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/budget-planning" component={BudgetPlanning} />
          <Route path="/financial-records" component={FinancialRecords} />
          <Route path="/reports" component={Reports} />
          <Route path="/import-export" component={ImportExport} />
          <Route path="/uploaded-data" component={UploadedData} />
          <Route path="/cats-booking" component={CATSBooking} />
          <Route path="/api-integrations" component={ApiIntegrations} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function RedirectToLogin() {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    setLocation("/login");
  }, [setLocation]);

  return null;
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={RedirectToLogin} />
      <Route component={RedirectToLogin} />
    </Switch>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Loading FinancePro...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  // Register service worker for PWA functionality
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerSW({
        onSuccess: () => console.log('PWA installed successfully'),
        onUpdate: () => console.log('PWA update available')
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="financepro-ui-theme">
        <TooltipProvider>
          <Toaster />
          <OfflineIndicator />
          <InstallPrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
