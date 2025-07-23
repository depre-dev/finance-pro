import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard-new";
import Projects from "@/pages/projects";
import BudgetPlanning from "@/pages/budget-planning";
import FinancialRecords from "@/pages/financial-records";
import Reports from "@/pages/reports";
import ImportExport from "@/pages/import-export";
import UploadedData from "@/pages/uploaded-data";
import ChargeHistory from "@/pages/charge-history";
import Sidebar from "@/components/layout/sidebar";

function Router() {
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
          <Route path="/charge-history" component={ChargeHistory} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
