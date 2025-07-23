import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'Jan', budget: 45000, actual: 42000 },
  { month: 'Feb', budget: 52000, actual: 48000 },
  { month: 'Mar', budget: 48000, actual: 51000 },
  { month: 'Apr', budget: 41000, actual: 38000 },
  { month: 'May', budget: 55000, actual: 53000 },
  { month: 'Jun', budget: 49000, actual: 52000 },
];

export default function BudgetOverviewChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `CHF ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value) => [`CHF ${Number(value).toLocaleString()}`, '']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="budget" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Budget"
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            name="Actual"
            dot={{ fill: 'hsl(var(--success))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
