import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface ProjectHealthData {
  id: number;
  name: string;
  budget: number;
  spent: number;
  status: string;
  healthScore: number;
}

interface ProjectHealthWidgetProps {
  projects: ProjectHealthData[];
}

const getHealthIcon = (score: number) => {
  if (score >= 90) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (score >= 70) return <TrendingUp className="w-4 h-4 text-blue-500" />;
  if (score >= 50) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <TrendingDown className="w-4 h-4 text-red-500" />;
};

const getHealthColor = (score: number) => {
  if (score >= 90) return "text-emerald-600 bg-emerald-50";
  if (score >= 70) return "text-blue-600 bg-blue-50";
  if (score >= 50) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
};

const getProgressColor = (usage: number) => {
  if (usage > 90) return "bg-red-500";
  if (usage > 75) return "bg-amber-500";
  return "bg-emerald-500";
};

export default function ProjectHealthWidget({ projects }: ProjectHealthWidgetProps) {
  const sortedProjects = projects
    .map(project => ({
      ...project,
      usage: project.budget > 0 ? (project.spent / project.budget) * 100 : 0,
      remaining: project.budget - project.spent
    }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Project Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {project.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {project.status}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {getHealthIcon(project.healthScore)}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getHealthColor(project.healthScore)}`}
                >
                  {project.healthScore}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget Usage</span>
                <span className={`font-medium ${
                  project.usage > 90 ? 'text-red-600' : 
                  project.usage > 75 ? 'text-amber-600' : 
                  'text-emerald-600'
                }`}>
                  {project.usage.toFixed(1)}%
                </span>
              </div>
              
              <Progress 
                value={Math.min(project.usage, 100)} 
                className="h-2"
                style={{
                  background: `hsl(var(--muted))`,
                }}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>CHF {project.spent.toLocaleString()} spent</span>
                <span>CHF {project.remaining.toLocaleString()} remaining</span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {sortedProjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No projects to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}