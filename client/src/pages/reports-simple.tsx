import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import AnimatedCard from "@/components/ui/animated-card";

export default function Reports() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Automated reporting and analytics for your financial data
          </p>
        </div>
      </div>

      {/* Reports Coming Soon */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatedCard delay={0.1}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Summary</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Comprehensive budget analysis and variance reporting
            </p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Project health and progress tracking reports
            </p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Analysis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Detailed expense breakdown and categorization
            </p>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Under Development Notice */}
      <AnimatedCard delay={0.4}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
            Reports Feature Under Development
          </CardTitle>
          <CardDescription>
            The automated reporting system is currently being enhanced to provide comprehensive financial analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Planned Features:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Automated budget summary reports</li>
              <li>Project status and health analytics</li>
              <li>Expense analysis with categorization</li>
              <li>Variance reporting and trend analysis</li>
              <li>Scheduled report generation and email delivery</li>
              <li>Export to Excel, PDF, and CSV formats</li>
            </ul>
          </div>
        </CardContent>
      </AnimatedCard>
    </div>
  );
}