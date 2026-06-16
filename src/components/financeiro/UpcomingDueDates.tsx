import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { FinancialTransaction } from "@/types/financial";

interface Client {
  id: string;
  name: string;
}

interface Props {
  transactions: FinancialTransaction[];
  clients: Client[];
  onMarkAsPaid: (id: string) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function DaysLabel({ diff }: { diff: number }) {
  if (diff < 0) {
    return (
      <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30 shrink-0">
        Atrasado {Math.abs(diff)}d
      </Badge>
    );
  }
  if (diff === 0) {
    return (
      <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
        Vence hoje
      </Badge>
    );
  }
  if (diff <= 7) {
    return (
      <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
        Em {diff}d
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs shrink-0">
      Em {diff}d
    </Badge>
  );
}

export function UpcomingDueDates({ transactions, clients, onMarkAsPaid }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcoming = useMemo(() => {
    const limit = addDays(today, 30);
    return transactions
      .filter((t) => {
        if (t.status !== "pendente" && t.status !== "atrasado") return false;
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d <= limit;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10);
  }, [transactions, today]);

  if (upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-yellow-500" />
          Próximos Vencimentos
          <Badge variant="outline" className="ml-auto text-xs">
            {upcoming.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-0 pb-2">
        {upcoming.map((t) => {
          const dueDate = new Date(t.dueDate!);
          const diff = differenceInDays(dueDate, today);
          const client = clients.find((c) => c.id === t.clientId);

          return (
            <div
              key={t.id}
              className="flex items-center gap-2 px-6 py-2 border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              {t.type === "receita" ? (
                <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(dueDate, "dd/MM/yyyy")}
                  {client ? ` · ${client.name}` : ""}
                  {" · "}
                  {t.category}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DaysLabel diff={diff} />
                <span
                  className={`text-sm font-semibold min-w-[80px] text-right ${
                    t.type === "receita" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(parseCurrencyToNumber(t.value))}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2 shrink-0"
                  onClick={() => onMarkAsPaid(t.id)}
                >
                  Pagar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
