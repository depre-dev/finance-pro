import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

interface BudgetChartData {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
}

interface EnhancedBudgetChartProps {
  data: BudgetChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const spentPercentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
    
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-600 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Budget:
            </span>
            <span className="font-medium">CHF {data.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-amber-600 flex items-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              Spent:
            </span>
            <span className="font-medium">CHF {data.spent.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-600 flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              Remaining:
            </span>
            <span className="font-medium">CHF {data.remaining.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Usage:</span>
              <span className={`font-medium ${spentPercentage > 90 ? 'text-red-600' : spentPercentage > 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {spentPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function EnhancedBudgetChart({ data }: EnhancedBudgetChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="budget" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Budget"
          />
          <Bar 
            dataKey="spent" 
            fill="hsl(var(--destructive))"
            radius={[4, 4, 0, 0]}
            name="Spent"
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}