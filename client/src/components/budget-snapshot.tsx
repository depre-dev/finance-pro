import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Zap
} from "lucide-react";
import type { Project, ChargeHistory } from "@shared/schema";
import { format } from "date-fns";

interface BudgetSnapshotProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function BudgetSnapshot({ project, isOpen, onClose }: BudgetSnapshotProps) {
  // Fetch charge history for this project
  const { data: chargeHistory = [] } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/projects", project.id, "charge-history"],
    enabled: isOpen && !!project.id,
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  // Calculate financial metrics
  const totalBudget = parseFloat(project.totalBudget || "0");
  const totalSpend = parseFloat(project.actualCost || "0");
  const remainingBudget = totalBudget - totalSpend;
  const budgetUsagePercentage = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  // Calculate spending velocity (spend per day)
  const projectStartDate = new Date(project.createdAt);
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailySpendRate = totalSpend / daysSinceStart;

  // Calculate recent spending trend (last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentCharges = chargeHistory.filter(charge => new Date(charge.date) >= sevenDaysAgo);
  const previousCharges = chargeHistory.filter(charge => {
    const chargeDate = new Date(charge.date);
    return chargeDate >= fourteenDaysAgo && chargeDate < sevenDaysAgo;
  });

  const recentSpend = recentCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || "0"), 0);
  const previousSpend = previousCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || "0"), 0);
  const spendingTrend = previousSpend > 0 ? ((recentSpend - previousSpend) / previousSpend) * 100 : 0;

  // Project completion estimate
  const estimatedDaysToComplete = dailySpendRate > 0 && remainingBudget > 0 
    ? Math.ceil(remainingBudget / dailySpendRate) 
    : null;

  // Risk assessment
  const getRiskLevel = () => {
    if (isOverBudget) return { level: "HIGH", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    if (budgetUsagePercentage > 90) return { level: "HIGH", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    if (budgetUsagePercentage > 75) return { level: "MEDIUM", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    if (spendingTrend > 50) return { level: "MEDIUM", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    return { level: "LOW", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
  };

  const risk = getRiskLevel();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary" />
                Budget Snapshot - {project.name}
              </DialogTitle>
              <DialogDescription>
                Real-time financial metrics and insights
              </DialogDescription>
            </div>
            <Badge variant={risk.level === "HIGH" ? "destructive" : risk.level === "MEDIUM" ? "secondary" : "default"}>
              {risk.level} RISK
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Budget</span>
                </div>
                <div className="text-xl font-bold text-blue-600 mt-1 break-words">
                  {formatCurrency(totalBudget)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Current Spend</span>
                </div>
                <div className="text-xl font-bold text-orange-600 mt-1 break-words">
                  {formatCurrency(totalSpend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {isOverBudget ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium">
                    {isOverBudget ? "Over Budget" : "Remaining"}
                  </span>
                </div>
                <div className={`text-xl font-bold mt-1 break-words ${
                  isOverBudget ? "text-red-600" : "text-green-600"
                }`}>
                  {formatCurrency(Math.abs(remainingBudget))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Usage</span>
                </div>
                <div className="text-xl font-bold text-purple-600 mt-1">
                  {budgetUsagePercentage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{budgetUsagePercentage.toFixed(1)}% used</span>
                </div>
                <Progress 
                  value={Math.min(budgetUsagePercentage, 100)} 
                  className="h-3"
                />
                {budgetUsagePercentage > 100 && (
                  <div className="text-sm text-red-600 font-medium">
                    ⚠️ Budget exceeded by {formatCurrency(Math.abs(remainingBudget))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spending Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spending Velocity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Spending Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daily Rate</span>
                    <span className="font-medium break-words">{formatCurrency(dailySpendRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days Active</span>
                    <span className="font-medium">{daysSinceStart}</span>
                  </div>
                  {estimatedDaysToComplete && !isOverBudget && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. Days to Budget End</span>
                      <span className="font-medium">{estimatedDaysToComplete}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {spendingTrend >= 0 ? (
                    <TrendingUp className="mr-2 h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
                  )}
                  7-Day Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Recent 7 Days</span>
                    <span className="font-medium break-words">{formatCurrency(recentSpend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Previous 7 Days</span>
                    <span className="font-medium break-words">{formatCurrency(previousSpend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Change</span>
                    <span className={`font-medium ${spendingTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {spendingTrend >= 0 ? '+' : ''}{spendingTrend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card className={`${risk.border} ${risk.bg}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${risk.color}`}>
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isOverBudget && (
                  <div className="text-sm text-red-600 font-medium">
                    🚨 Project is over budget by {formatCurrency(Math.abs(remainingBudget))}
                  </div>
                )}
                {budgetUsagePercentage > 90 && !isOverBudget && (
                  <div className="text-sm text-orange-600 font-medium">
                    ⚠️ Budget usage is critically high ({budgetUsagePercentage.toFixed(1)}%)
                  </div>
                )}
                {spendingTrend > 50 && (
                  <div className="text-sm text-yellow-600 font-medium">
                    📈 Spending rate has increased significantly ({spendingTrend.toFixed(1)}% in last week)
                  </div>
                )}
                {risk.level === "LOW" && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Project financials are healthy and on track
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Preview */}
          {recentCharges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentCharges.slice(0, 5).map((charge) => (
                    <div key={charge.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-sm">{charge.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(charge.date), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium break-words">{formatCurrency(charge.amount)}</div>
                        <Badge variant="outline" className="text-xs">
                          {charge.category || "General"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentCharges.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      +{recentCharges.length - 5} more charges
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}