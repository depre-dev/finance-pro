import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  CreditCard, 
  Folder, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  Clock
} from "lucide-react";
import type { ChargeHistory, Project } from "@shared/schema";
import { format } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'charge' | 'project' | 'budget';
  title: string;
  description: string;
  amount?: number;
  timestamp: Date;
  icon: React.ComponentType<any>;
  variant: 'default' | 'success' | 'warning' | 'destructive';
}

export default function RecentActivityFeed() {
  const { data: chargeHistory } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/charge-history"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  // Generate activity items from charge history and projects
  const activityItems: ActivityItem[] = [
    // Recent charges
    ...(chargeHistory || [])
      .slice(0, 5)
      .map(charge => {
        const project = projects?.find(p => p.id === charge.projectId);
        return {
          id: `charge-${charge.id}`,
          type: 'charge' as const,
          title: `Expense added: ${charge.description}`,
          description: `Project: ${project?.name || 'Unknown'}`,
          amount: Number(charge.amount),
          timestamp: new Date(charge.date),
          icon: CreditCard,
          variant: Number(charge.amount) > 1000 ? ('warning' as const) : ('default' as const)
        };
      }),
    
    // Budget alerts for over-budget projects
    ...(projects || [])
      .filter(project => Number(project.actualCost || 0) > Number(project.totalBudget))
      .slice(0, 3)
      .map(project => ({
        id: `budget-alert-${project.id}`,
        type: 'budget' as const,
        title: `Budget exceeded: ${project.name}`,
        description: `Over by ${formatCurrency(Number(project.actualCost || 0) - Number(project.totalBudget))}`,
        timestamp: new Date(),
        icon: AlertTriangle,
        variant: 'destructive' as const
      })),
    
    // Recent projects
    ...(projects || [])
      .slice(0, 2)
      .map(project => ({
        id: `project-${project.id}`,
        type: 'project' as const,
        title: `Project active: ${project.name}`,
        description: `Budget: ${formatCurrency(project.totalBudget)}`,
        timestamp: new Date(project.createdAt || Date.now()),
        icon: Folder,
        variant: 'success' as const
      }))
  ]
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .slice(0, 8);

  if (activityItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates and changes in your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">No recent activity</h3>
            <p className="text-sm text-muted-foreground">
              Start by creating a project or adding expenses to see activity here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest updates and changes in your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {activityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-full ${
                    item.variant === 'destructive' ? 'bg-red-100 text-red-600' :
                    item.variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    item.variant === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {format(item.timestamp, 'MMM d')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                    {item.amount && (
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(item.amount)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}