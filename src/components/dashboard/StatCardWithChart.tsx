import { useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface MonthlyData {
  month: string;
  value: number;
}

interface StatCardWithChartProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
  monthlyData?: MonthlyData[];
}

export function StatCardWithChart({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  className,
  monthlyData = []
}: StatCardWithChartProps) {
  const [isHovered, setIsHovered] = useState(false);

  const chartColor = changeType === "positive" 
    ? "hsl(142, 76%, 36%)" 
    : changeType === "negative" 
    ? "hsl(0, 84%, 60%)" 
    : "hsl(var(--primary))";

  return (
    <div 
      className={cn(
        "p-6 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-300 relative overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              changeType === "positive" && "text-green-500",
              changeType === "negative" && "text-red-500",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center relative z-10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Chart overlay on hover */}
      {monthlyData.length > 0 && (
        <div className={cn(
          "absolute inset-0 bg-card transition-all duration-300 flex flex-col p-4 rounded-xl border border-border shadow-lg z-20",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <p className="text-xs text-muted-foreground mb-2 font-medium">{title} - Últimos 6 meses</p>
          <div className="flex-1 min-h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), '']}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColor }}
                  activeDot={{ r: 5, fill: chartColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
