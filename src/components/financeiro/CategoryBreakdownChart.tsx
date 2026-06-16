import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { FinancialTransaction } from "@/types/financial";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

interface Props {
  transactions: FinancialTransaction[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CategoryBreakdownChart({ transactions }: Props) {
  const [activeType, setActiveType] = useState<"despesa" | "receita">("despesa");

  const data = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions
      .filter((t) => t.type === activeType)
      .forEach((t) => {
        const cat = t.category || "Outro";
        grouped[cat] = (grouped[cat] || 0) + parseCurrencyToNumber(t.value);
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, activeType]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as "despesa" | "receita")}>
          <TabsList className="h-7">
            <TabsTrigger value="despesa" className="text-xs px-3">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="receita" className="text-xs px-3">
              Receitas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="40%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs">
                      {value}
                      {total > 0 && (
                        <span className="text-muted-foreground ml-1">
                          {((data.find((d) => d.name === value)?.value ?? 0) / total * 100).toFixed(0)}%
                        </span>
                      )}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
