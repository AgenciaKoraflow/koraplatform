import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { FinancialTransaction } from "@/types/financial";

interface Props {
  transactions: FinancialTransaction[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function tickFormatter(v: number) {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

const LEGEND_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  saldo: "Saldo",
};

export function FinancialTrendChart({ transactions }: Props) {
  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(today, 11 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const month = format(date, "MMM/yy", { locale: ptBR });

      const receita = transactions
        .filter((t) => {
          if (t.type !== "receita") return false;
          const ref = t.paidDate || t.dueDate;
          if (!ref) return false;
          const d = new Date(ref);
          return d >= start && d <= end;
        })
        .reduce((s, t) => s + parseCurrencyToNumber(t.value), 0);

      const despesa = transactions
        .filter((t) => {
          if (t.type !== "despesa") return false;
          const ref = t.paidDate || t.dueDate;
          if (!ref) return false;
          const d = new Date(ref);
          return d >= start && d <= end;
        })
        .reduce((s, t) => s + parseCurrencyToNumber(t.value), 0);

      return { month, receita, despesa, saldo: receita - despesa };
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Receita vs Despesa — Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={60}
                tickFormatter={tickFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [formatCurrency(value), LEGEND_LABELS[name] ?? name]}
              />
              <Legend formatter={(v) => LEGEND_LABELS[v] ?? v} iconSize={10} />
              <Bar dataKey="receita" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="despesa" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
