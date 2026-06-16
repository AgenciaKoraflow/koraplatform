import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Users } from "lucide-react";
import { parseCurrencyToNumber } from "@/lib/currency";
import { format } from "date-fns";
import type { Client, Contract } from "@/types/data";
import type { FinancialTransaction } from "@/types/financial";

interface Props {
  clients: Client[];
  contracts: Contract[];
  transactions: FinancialTransaction[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getContractTotal(contract: Contract): number {
  const main = parseCurrencyToNumber(contract.value);
  if (contract.billingType === "implantacao_recorrencia" && contract.recurrenceValue) {
    return main + parseCurrencyToNumber(contract.recurrenceValue) * 12;
  }
  return main;
}

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

export function ClientFinancialSummary({ clients, contracts, transactions }: Props) {
  const rows = useMemo(
    () =>
      clients
        .map((client) => {
          const clientContracts = contracts.filter((c) => c.clientId === client.id);
          const clientTx = transactions.filter((t) => t.clientId === client.id);

          const contractsTotal = clientContracts.reduce((sum, c) => sum + getContractTotal(c), 0);

          const receitas = clientTx.filter((t) => t.type === "receita");
          const despesas = clientTx.filter((t) => t.type === "despesa");

          const paid = receitas
            .filter((t) => t.status === "pago")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const pending = receitas
            .filter((t) => t.status === "pendente" || t.status === "atrasado")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const totalDespesas = despesas.reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          // MRR: receitas recorrentes mensais vinculadas ao cliente
          const mrr = receitas
            .filter((t) => t.isRecurring && t.recurrenceType === "mensal")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const hasOverdue = clientTx.some((t) => t.status === "atrasado");

          return {
            clientId: client.id,
            name: client.name,
            company: client.company,
            contractsCount: clientContracts.length,
            contractsTotal,
            paid,
            pending,
            totalDespesas,
            mrr,
            hasOverdue,
            receitas,
            despesas,
          };
        })
        .filter(
          (r) => r.contractsCount > 0 || r.paid > 0 || r.pending > 0 || r.receitas.length > 0 || r.despesas.length > 0
        )
        .sort((a, b) => b.contractsTotal - a.contractsTotal),
    [clients, contracts, transactions]
  );

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Financeiro por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_100px_100px_100px_80px] gap-2 px-6 py-2 text-xs text-muted-foreground font-medium border-b">
          <span>Cliente</span>
          <span className="text-right">MRR</span>
          <span className="text-right">Pago</span>
          <span className="text-right">Pendente</span>
          <span className="text-right">Contratado</span>
          <span className="text-right">Status</span>
        </div>
        <Accordion type="multiple" className="w-full">
          {rows.map((r) => (
            <AccordionItem key={r.clientId} value={r.clientId} className="border-b last:border-0">
              <AccordionTrigger className="px-6 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/30 transition-colors">
                <div className="grid grid-cols-[1fr_80px_100px_100px_100px_80px] gap-2 w-full text-sm items-center">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{r.name}</span>
                    {r.company ? (
                      <span className="text-xs text-muted-foreground">{r.company}</span>
                    ) : null}
                  </div>
                  <span className="text-right text-primary font-medium">
                    {r.mrr > 0 ? formatBRL(r.mrr) : <span className="text-muted-foreground">-</span>}
                  </span>
                  <span className="text-right text-green-500">{formatBRL(r.paid)}</span>
                  <span className="text-right text-yellow-500">{r.pending > 0 ? formatBRL(r.pending) : "-"}</span>
                  <span className="text-right">{formatBRL(r.contractsTotal)}</span>
                  <div className="flex justify-end">
                    {r.hasOverdue ? (
                      <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                        Inadimplente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        Adimplente
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 space-y-4">
                  {/* Receitas */}
                  {r.receitas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-500 mb-2 flex items-center gap-1">
                        <ArrowUpCircle className="w-3 h-3" />
                        Receitas ({r.receitas.length})
                      </p>
                      <div className="space-y-1">
                        {r.receitas.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {t.isRecurring && (
                                <RefreshCw className="w-3 h-3 text-primary shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{t.description}</p>
                                <p className="text-muted-foreground">
                                  {t.category}
                                  {t.isRecurring && t.recurrenceType
                                    ? ` · Recorrente ${t.recurrenceType}`
                                    : ""}
                                  {t.dueDate ? ` · Venc: ${formatDate(t.dueDate)}` : ""}
                                  {t.paidDate ? ` · Pago: ${formatDate(t.paidDate)}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Badge
                                variant="outline"
                                className={
                                  t.status === "pago"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : t.status === "atrasado"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                }
                              >
                                {t.status}
                              </Badge>
                              <span className="font-semibold text-green-500 min-w-[72px] text-right">
                                {formatBRL(parseCurrencyToNumber(t.value))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Despesas */}
                  {r.despesas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                        <ArrowDownCircle className="w-3 h-3" />
                        Despesas ({r.despesas.length}) · Total: {formatBRL(r.totalDespesas)}
                      </p>
                      <div className="space-y-1">
                        {r.despesas.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{t.description}</p>
                              <p className="text-muted-foreground">
                                {t.category}
                                {t.dueDate ? ` · Venc: ${formatDate(t.dueDate)}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Badge
                                variant="outline"
                                className={
                                  t.status === "pago"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : t.status === "atrasado"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                }
                              >
                                {t.status}
                              </Badge>
                              <span className="font-semibold text-red-500 min-w-[72px] text-right">
                                {formatBRL(parseCurrencyToNumber(t.value))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.receitas.length === 0 && r.despesas.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      Nenhuma transação registrada para este cliente.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
