import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ArrowDownCircle,
  RefreshCw,
  Users,
  FolderOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { parseCurrencyToNumber } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Client, Contract } from "@/types/data";
import type { FinancialTransaction } from "@/types/financial";

interface MarkRecurrencePaidParams {
  contractId: string;
  clientId: string;
  amount: string;
  description: string;
  referenceMonth: string;
}

interface Props {
  clients: Client[];
  contracts: Contract[];
  transactions: FinancialTransaction[];
  onMarkRecurrencePaid?: (params: MarkRecurrencePaidParams) => Promise<void>;
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

interface RecurrenceMonth {
  label: string;
  date: Date;
  yearMonth: string;
  paid: boolean;
  txId?: string;
}

function buildRecurrenceMonths(
  contract: Contract,
  linkedTx: FinancialTransaction[]
): RecurrenceMonth[] {
  if (
    contract.billingType !== "implantacao_recorrencia" ||
    !contract.recurrenceStartDate ||
    !contract.recurrenceValue
  ) {
    return [];
  }

  const months: RecurrenceMonth[] = [];
  const start = new Date(contract.recurrenceStartDate);
  const today = new Date();
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= today) {
    const yearMonth = format(cursor, "yyyy-MM");
    const paidInMonth = linkedTx.find(
      (t) =>
        t.isRecurring &&
        t.status === "pago" &&
        t.paidDate &&
        t.paidDate.slice(0, 7) === yearMonth
    );
    months.push({
      label: format(cursor, "MMM/yyyy", { locale: ptBR }),
      date: new Date(cursor),
      yearMonth,
      paid: !!paidInMonth,
      txId: paidInMonth?.id,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months;
}

interface ContractDetail {
  contract: Contract;
  linkedTx: FinancialTransaction[];
  paidLinked: number;
  implementationValue: number;
  implementationRemaining: number;
  implementationProgress: number;
  recurrenceMonths: RecurrenceMonth[];
  paidRecurrenceMonths: number;
  totalExpectedMonths: number;
}

function buildContractDetails(
  clientContracts: Contract[],
  clientTx: FinancialTransaction[]
): ContractDetail[] {
  return clientContracts.map((contract) => {
    const linkedTx = clientTx.filter((t) => t.contractId === contract.id);
    const paidLinked = linkedTx
      .filter((t) => t.status === "pago" && t.type === "receita")
      .reduce((s, t) => s + parseCurrencyToNumber(t.value), 0);

    const implementationValue = parseCurrencyToNumber(contract.value);
    const implementationRemaining = Math.max(0, implementationValue - paidLinked);
    const implementationProgress =
      implementationValue > 0 ? Math.min(1, paidLinked / implementationValue) : 0;

    const recurrenceMonths = buildRecurrenceMonths(contract, linkedTx);
    const paidRecurrenceMonths = recurrenceMonths.filter((m) => m.paid).length;

    return {
      contract,
      linkedTx,
      paidLinked,
      implementationValue,
      implementationRemaining,
      implementationProgress,
      recurrenceMonths,
      paidRecurrenceMonths,
      totalExpectedMonths: recurrenceMonths.length,
    };
  });
}

function ContractBalanceSection({
  detail,
  clientId,
  onMarkRecurrencePaid,
}: {
  detail: ContractDetail;
  clientId: string;
  onMarkRecurrencePaid?: (params: MarkRecurrencePaidParams) => Promise<void>;
}) {
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);
  const { contract, implementationValue, implementationRemaining, implementationProgress, recurrenceMonths, paidLinked } = detail;
  const isRecurrence = contract.billingType === "implantacao_recorrencia";
  const recurrenceValue = contract.recurrenceValue ? parseCurrencyToNumber(contract.recurrenceValue) : 0;

  const handlePay = async (month: RecurrenceMonth) => {
    if (!onMarkRecurrencePaid) return;
    setLoadingMonth(month.yearMonth);
    try {
      await onMarkRecurrencePaid({
        contractId: contract.id,
        clientId,
        amount: formatBRL(recurrenceValue),
        description: `Recorrência ${month.label} — ${contract.title || "Contrato"}`,
        referenceMonth: month.yearMonth,
      });
    } finally {
      setLoadingMonth(null);
    }
  };

  const hasLinkedPayments = detail.linkedTx.length > 0;

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      {/* Contract header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{contract.title || "Contrato sem título"}</p>
            <p className="text-xs text-muted-foreground">
              {isRecurrence ? "Implantação + Recorrência" : "Projeto"}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            contract.status === "signed"
              ? "text-xs bg-green-500/20 text-green-400 border-green-500/30 shrink-0"
              : "text-xs bg-muted text-muted-foreground shrink-0"
          }
        >
          {contract.status === "signed" ? "Ativo" : contract.status ?? "-"}
        </Badge>
      </div>

      {/* Implementation balance */}
      {implementationValue > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Implantação / Projeto</span>
            <span className="font-medium">{formatBRL(implementationValue)}</span>
          </div>
          <Progress value={implementationProgress * 100} className="h-1.5" />
          <div className="flex justify-between text-xs">
            <span className="text-green-400">Pago: {formatBRL(paidLinked)}</span>
            {implementationRemaining > 0 ? (
              <span className="text-yellow-400 font-medium">Falta: {formatBRL(implementationRemaining)}</span>
            ) : (
              <span className="text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Quitado
              </span>
            )}
          </div>
          {!hasLinkedPayments && (
            <p className="text-xs text-muted-foreground italic">
              Nenhum pagamento vinculado a este contrato ainda
            </p>
          )}
        </div>
      )}

      {/* Recurrence months */}
      {isRecurrence && recurrenceMonths.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Recorrência mensal · {formatBRL(recurrenceValue)}/mês
            </span>
            <span className="text-muted-foreground">
              {detail.paidRecurrenceMonths}/{detail.totalExpectedMonths} pagos
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {recurrenceMonths.map((month) => (
              <div key={month.yearMonth} className="relative group">
                {month.paid ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-500/20 text-green-400 border-green-500/30 gap-1 cursor-default"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {month.label}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30 gap-1"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {month.label}
                    </Badge>
                    {onMarkRecurrencePaid && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        disabled={loadingMonth === month.yearMonth}
                        onClick={() => handlePay(month)}
                        title={`Registrar pagamento de ${month.label}`}
                      >
                        {loadingMonth === month.yearMonth ? "..." : "Pagar"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {recurrenceMonths.some((m) => !m.paid) && (
            <p className="text-xs text-yellow-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {recurrenceMonths.filter((m) => !m.paid).length} mês(es) pendente(s) ·{" "}
              {formatBRL(recurrenceMonths.filter((m) => !m.paid).length * recurrenceValue)}
            </p>
          )}
        </div>
      )}

      {isRecurrence && recurrenceMonths.length === 0 && contract.recurrenceValue && (
        <p className="text-xs text-muted-foreground">
          Recorrência de {formatBRL(recurrenceValue)}/mês · Sem meses gerados ainda
        </p>
      )}
    </div>
  );
}

export function ClientFinancialSummary({ clients, contracts, transactions, onMarkRecurrencePaid }: Props) {
  const rows = useMemo(
    () =>
      clients
        .map((client) => {
          const clientContracts = contracts.filter((c) => c.clientId === client.id);
          const clientTx = transactions.filter((t) => t.clientId === client.id);

          const contractsTotal = clientContracts.reduce((sum, c) => sum + getContractTotal(c), 0);

          const receitas = clientTx.filter((t) => t.type === "receita");
          const despesas = clientTx.filter((t) => t.type === "despesa");

          const receitasRecorrentes = receitas.filter((t) => t.isRecurring);
          const receitasProjeto = receitas.filter((t) => !t.isRecurring);

          const paid = receitas
            .filter((t) => t.status === "pago")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const pendingRecurring = receitasRecorrentes
            .filter((t) => t.status === "pendente" || t.status === "atrasado")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const pendingProject = receitasProjeto
            .filter((t) => t.status === "pendente" || t.status === "atrasado")
            .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const totalDespesas = despesas.reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

          const hasOverdue = clientTx.some((t) => t.status === "atrasado");

          const contractDetails = buildContractDetails(clientContracts, clientTx);

          return {
            clientId: client.id,
            name: client.name,
            company: client.company,
            contractsCount: clientContracts.length,
            contractsTotal,
            paid,
            pendingRecurring,
            pendingProject,
            totalDespesas,
            hasOverdue,
            receitas,
            despesas,
            receitasRecorrentes,
            receitasProjeto,
            contractDetails,
          };
        })
        .filter(
          (r) =>
            r.contractsCount > 0 ||
            r.paid > 0 ||
            r.pendingRecurring > 0 ||
            r.pendingProject > 0 ||
            r.receitas.length > 0 ||
            r.despesas.length > 0
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
        <div className="grid grid-cols-[1fr_110px_110px_100px_100px_80px] gap-2 px-6 py-2 text-xs text-muted-foreground font-medium border-b">
          <span>Cliente</span>
          <span className="text-right">Recorrência</span>
          <span className="text-right">Projeto</span>
          <span className="text-right">Pago</span>
          <span className="text-right">Contratado</span>
          <span className="text-right">Status</span>
        </div>
        <Accordion type="multiple" className="w-full">
          {rows.map((r) => (
            <AccordionItem key={r.clientId} value={r.clientId} className="border-b last:border-0">
              <AccordionTrigger className="px-6 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/30 transition-colors">
                <div className="grid grid-cols-[1fr_110px_110px_100px_100px_80px] gap-2 w-full text-sm items-center">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{r.name}</span>
                    {r.company ? (
                      <span className="text-xs text-muted-foreground">{r.company}</span>
                    ) : null}
                  </div>
                  <span className="text-right text-primary font-medium">
                    {r.pendingRecurring > 0 ? formatBRL(r.pendingRecurring) : <span className="text-muted-foreground">-</span>}
                  </span>
                  <span className="text-right text-yellow-500">
                    {r.pendingProject > 0 ? formatBRL(r.pendingProject) : <span className="text-muted-foreground">-</span>}
                  </span>
                  <span className="text-right text-green-500">{formatBRL(r.paid)}</span>
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
                  {/* Contract balance section */}
                  {r.contractDetails.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Contratos ({r.contractDetails.length})
                      </p>
                      <div className="space-y-2">
                        {r.contractDetails.map((detail) => (
                          <ContractBalanceSection
                            key={detail.contract.id}
                            detail={detail}
                            clientId={r.clientId}
                            onMarkRecurrencePaid={onMarkRecurrencePaid}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Receitas Recorrentes */}
                  {r.receitasRecorrentes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Recorrência ({r.receitasRecorrentes.length})
                      </p>
                      <div className="space-y-1">
                        {r.receitasRecorrentes.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{t.description}</p>
                              <p className="text-muted-foreground">
                                {t.category}
                                {t.recurrenceType ? ` · ${t.recurrenceType}` : ""}
                                {t.dueDay ? ` · Dia ${t.dueDay}` : t.dueDate ? ` · Venc: ${formatDate(t.dueDate)}` : ""}
                                {t.paidDate ? ` · Pago: ${formatDate(t.paidDate)}` : ""}
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
                                    : "bg-primary/20 text-primary border-primary/30"
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

                  {/* Receitas de Projeto */}
                  {r.receitasProjeto.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-yellow-500 mb-2 flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        Projeto ({r.receitasProjeto.length})
                      </p>
                      <div className="space-y-1">
                        {r.receitasProjeto.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{t.description}</p>
                              <p className="text-muted-foreground">
                                {t.category}
                                {t.dueDate ? ` · Venc: ${formatDate(t.dueDate)}` : ""}
                                {t.paidDate ? ` · Pago: ${formatDate(t.paidDate)}` : ""}
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

                  {r.contractDetails.length === 0 && r.receitasRecorrentes.length === 0 && r.receitasProjeto.length === 0 && r.despesas.length === 0 && (
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
