import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DatePicker } from "@/components/shared/DatePicker";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ClientFinancialSummary } from "@/components/financeiro/ClientFinancialSummary";
import { FinancialTrendChart } from "@/components/financeiro/FinancialTrendChart";
import { CategoryBreakdownChart } from "@/components/financeiro/CategoryBreakdownChart";
import { UpcomingDueDates } from "@/components/financeiro/UpcomingDueDates";
import { parseCurrencyToNumber } from "@/lib/currency";
import { useFinancial } from "@/hooks/useFinancial";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllContracts } from "@/hooks/useContracts";
import { FinancialTransaction, EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from "@/types/financial";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Landmark,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Download,
} from "lucide-react";
import { format } from "date-fns";

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();
const ITEMS_PER_PAGE = 25;

export function EmpresaFinanceiro() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useFinancial();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const { data: contracts = [] } = useAllContracts();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendente" | "pago" | "atrasado">("all");
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    type: "despesa" as "receita" | "despesa",
    category: "",
    description: "",
    value: "",
    isRecurring: false,
    recurrenceType: "" as "" | "mensal" | "trimestral" | "semestral" | "anual",
    dueDate: "",
    dueDay: null as number | null,
    paidDate: "",
    status: "pendente" as "pendente" | "pago" | "cancelado" | "atrasado",
    clientId: "",
    projectId: "",
    notes: "",
    otherCategoryNote: "",
    installmentCount: null as number | null,
    firstPaymentDate: "",
    isIndefinite: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, filterMonth, filterYear]);

  const resetForm = () => {
    setFormData({
      type: "despesa",
      category: "",
      description: "",
      value: "",
      isRecurring: false,
      recurrenceType: "",
      dueDate: "",
      dueDay: null,
      paidDate: "",
      status: "pendente",
      clientId: "",
      projectId: "",
      notes: "",
      otherCategoryNote: "",
      installmentCount: null,
      firstPaymentDate: "",
      isIndefinite: false,
    });
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transactionData = {
      type: formData.type,
      category: formData.category,
      description: formData.description,
      value: formData.value,
      isRecurring: formData.isRecurring,
      recurrenceType: formData.isRecurring ? formData.recurrenceType as "mensal" | "trimestral" | "semestral" | "anual" : undefined,
      dueDate: formData.dueDate || undefined,
      dueDay: formData.dueDay || undefined,
      paidDate: formData.paidDate || undefined,
      status: formData.status,
      clientId: formData.clientId || undefined,
      projectId: formData.projectId || undefined,
      notes: formData.notes || undefined,
      otherCategoryNote: formData.otherCategoryNote || undefined,
      installmentCount: formData.installmentCount,
      firstPaymentDate: formData.firstPaymentDate || undefined,
      isIndefinite: formData.isIndefinite,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, transactionData);
    } else {
      await addTransaction(transactionData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      value: transaction.value,
      isRecurring: transaction.isRecurring,
      recurrenceType: transaction.recurrenceType || "",
      dueDate: transaction.dueDate || "",
      dueDay: transaction.dueDay ?? null,
      paidDate: transaction.paidDate || "",
      status: transaction.status,
      clientId: transaction.clientId || "",
      projectId: transaction.projectId || "",
      notes: transaction.notes || "",
      otherCategoryNote: transaction.otherCategoryNote || "",
      installmentCount: transaction.installmentCount ?? null,
      firstPaymentDate: transaction.firstPaymentDate || "",
      isIndefinite: transaction.isIndefinite || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    await updateTransaction(id, { status: "pago", paidDate: today });
  };

  const clearFilters = () => {
    setFilterMonth(null);
    setFilterYear(null);
    setFilterType("all");
    setFilterStatus("all");
    setSearchTerm("");
  };

  const hasActiveFilter =
    filterMonth !== null ||
    filterYear !== null ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    searchTerm !== "";

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;

      let matchesMonth = true;
      let matchesYear = true;

      if (filterMonth !== null || filterYear !== null) {
        if (!t.dueDate) {
          matchesMonth = false;
          matchesYear = false;
        } else {
          const date = new Date(t.dueDate);
          if (filterMonth !== null) matchesMonth = date.getMonth() + 1 === filterMonth;
          if (filterYear !== null) matchesYear = date.getFullYear() === filterYear;
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesYear;
    });
  }, [transactions, searchTerm, filterType, filterStatus, filterMonth, filterYear]);

  // KPIs reflect the filtered period
  const summary = useMemo(() => {
    const receitas = filteredTransactions
      .filter((t) => t.type === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const despesas = filteredTransactions
      .filter((t) => t.type === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const aReceber = filteredTransactions
      .filter((t) => t.type === "receita" && (t.status === "pendente" || t.status === "atrasado"))
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const aPagar = filteredTransactions
      .filter((t) => t.type === "despesa" && (t.status === "pendente" || t.status === "atrasado"))
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    return { receitas, despesas, saldo: receitas - despesas, aReceber, aPagar };
  }, [filteredTransactions]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const exportCSV = () => {
    const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

    const escape = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const formatDateForCSV = (dateStr: string | undefined) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const headers = ["Tipo", "Descrição", "Categoria", "Cliente", "Valor", "Vencimento", "Status", "Recorrência", "Pago em"];

    const rows = filteredTransactions.map((t) => {
      const client = clients.find((c) => c.id === t.clientId);
      const vencimento = t.isRecurring && t.dueDay ? `Dia ${t.dueDay}` : formatDateForCSV(t.dueDate);
      return [
        escape(t.type === "receita" ? "Receita" : "Despesa"),
        escape(t.description),
        escape(t.category),
        escape(client?.name ?? ""),
        parseCurrencyToNumber(t.value).toString(),
        escape(vencimento),
        escape(t.status),
        escape(t.isRecurring ? (t.recurrenceType ?? "") : ""),
        escape(formatDateForCSV(t.paidDate)),
      ].join(",");
    });

    const csvContent = "﻿" + [headers.join(","), ...rows].join("\n");

    let filename = "financeiro-completo.csv";
    if (filterMonth && filterYear) {
      filename = `financeiro-${MONTHS_PT[filterMonth - 1]}-${filterYear}.csv`;
    } else if (filterYear) {
      filename = `financeiro-${filterYear}.csv`;
    } else if (filterMonth) {
      filename = `financeiro-${MONTHS_PT[filterMonth - 1]}.csv`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pendente": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "atrasado": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "cancelado": return "bg-muted text-muted-foreground border-muted";
      default: return "";
    }
  };

  const periodLabel = useMemo(() => {
    if (filterMonth && filterYear) {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return `${months[filterMonth - 1]}/${filterYear}`;
    }
    if (filterYear) return String(filterYear);
    if (filterMonth) {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return months[filterMonth - 1];
    }
    return null;
  }, [filterMonth, filterYear]);

  const categories = formData.type === "receita" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Actions header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Financeiro</h2>
            <p className="text-sm text-muted-foreground">Gestão de receitas e despesas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <Landmark className="w-4 h-4" />
              Conectar Banco Inter
            </Button>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? "Editar Transação" : "Nova Transação"}
                  </DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <form id="financeiro-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.type === "receita" ? "default" : "outline"}
                        className={`flex-1 gap-2 ${formData.type === "receita" ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={() => setFormData({ ...formData, type: "receita", category: "" })}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Receita
                      </Button>
                      <Button
                        type="button"
                        variant={formData.type === "despesa" ? "default" : "outline"}
                        className={`flex-1 gap-2 ${formData.type === "despesa" ? "bg-red-600 hover:bg-red-700" : ""}`}
                        onClick={() => setFormData({ ...formData, type: "despesa", category: "" })}
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                        Despesa
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(v) => setFormData({ ...formData, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.category === "Outro" && (
                        <div className="space-y-2">
                          <Label>Especifique a categoria *</Label>
                          <Input
                            value={formData.otherCategoryNote}
                            onChange={(e) => setFormData({ ...formData, otherCategoryNote: e.target.value })}
                            placeholder="Ex: Despesa com assessoria jurídica"
                            required
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="value">Valor *</Label>
                        <CurrencyInput
                          value={formData.value}
                          onChange={(v) => setFormData({ ...formData, value: v })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição *</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ex: Assinatura mensal do ChatGPT"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-input">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Transação Recorrente</p>
                          <p className="text-sm text-muted-foreground">Cobrada automaticamente no período</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isRecurring}
                        onCheckedChange={(v) => setFormData({ ...formData, isRecurring: v })}
                      />
                    </div>

                    {formData.isRecurring && (
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={formData.recurrenceType}
                          onValueChange={(v) =>
                            setFormData({ ...formData, recurrenceType: v as "" | "mensal" | "trimestral" | "semestral" | "anual" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.isRecurring && (
                      <>
                        <div className="space-y-2">
                          <Label>Data do Primeiro Pagamento</Label>
                          <DatePicker
                            value={formData.firstPaymentDate}
                            onChange={(v) => setFormData({ ...formData, firstPaymentDate: v })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Primeira data de pagamento (pode ser no passado)
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-input">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Sem prazo definido (indefinido)</p>
                              <p className="text-sm text-muted-foreground">Pagamento continuará indefinidamente</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.isIndefinite}
                            onCheckedChange={(v) => setFormData({ ...formData, isIndefinite: v })}
                          />
                        </div>

                        {!formData.isIndefinite && (
                          <div className="space-y-2">
                            <Label>Quantidade de Parcelas</Label>
                            <NumberInput
                              min="1"
                              value={formData.installmentCount || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  installmentCount: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                              placeholder="Ex: 12"
                            />
                            <p className="text-xs text-muted-foreground">
                              Deixe vazio para ilimitado ou marque "Sem prazo definido"
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{formData.isRecurring ? "Dia do Vencimento" : "Vencimento"}</Label>
                        {formData.isRecurring ? (
                          <NumberInput
                            min="1"
                            max="31"
                            value={formData.dueDay || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dueDay: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            placeholder="Ex: 5"
                          />
                        ) : (
                          <DatePicker
                            value={formData.dueDate}
                            onChange={(v) => setFormData({ ...formData, dueDate: v })}
                          />
                        )}
                        {formData.isRecurring && (
                          <p className="text-xs text-muted-foreground">Dia do mês de vencimento (1-31)</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(v) =>
                            setFormData({ ...formData, status: v as "pendente" | "pago" | "cancelado" | "atrasado" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="atrasado">Atrasado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.status === "pago" && (
                      <div className="space-y-2">
                        <Label>Data do Pagamento</Label>
                        <DatePicker
                          value={formData.paidDate}
                          onChange={(v) => setFormData({ ...formData, paidDate: v })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cliente (opcional)</Label>
                        <Select
                          value={formData.clientId || "none"}
                          onValueChange={(v) => setFormData({ ...formData, clientId: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Projeto (opcional)</Label>
                        <Select
                          value={formData.projectId || "none"}
                          onValueChange={(v) => setFormData({ ...formData, projectId: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas adicionais..."
                        rows={3}
                      />
                    </div>
                  </form>
                </DialogBody>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    form="financeiro-form"
                    type="submit"
                    disabled={
                      !formData.category ||
                      !formData.description ||
                      !formData.value ||
                      (formData.category === "Outro" && !formData.otherCategoryNote)
                    }
                  >
                    {editingTransaction ? "Salvar Alterações" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards — 5 cards responsive to filtered period */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receitas
                {periodLabel && (
                  <Badge variant="outline" className="ml-2 text-xs font-normal">{periodLabel}</Badge>
                )}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-500">{formatCurrency(summary.receitas)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total recebido</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Despesas
                {periodLabel && (
                  <Badge variant="outline" className="ml-2 text-xs font-normal">{periodLabel}</Badge>
                )}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-500">{formatCurrency(summary.despesas)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total pago</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${summary.saldo >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(summary.saldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Receitas − Despesas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-400">{formatCurrency(summary.aReceber)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pendente/Atrasado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Pagar</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-yellow-500">{formatCurrency(summary.aPagar)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pendente/Atrasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FinancialTrendChart transactions={transactions} />
          </div>
          <div className="lg:col-span-2">
            <CategoryBreakdownChart transactions={filteredTransactions} />
          </div>
        </div>

        {/* Upcoming due dates */}
        <UpcomingDueDates
          transactions={transactions}
          clients={clients}
          onMarkAsPaid={handleMarkAsPaid}
        />

        {/* Client summary */}
        <ClientFinancialSummary clients={clients} contracts={contracts} transactions={transactions} />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterMonth?.toString() || ""}
                onValueChange={(v) => setFilterMonth(v === "all" || v === "" ? null : parseInt(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterYear?.toString() || ""}
                onValueChange={(v) => setFilterYear(v === "all" || v === "" ? null : parseInt(v))}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(() => {
                    const years = [];
                    for (let y = currentYear - 5; y <= currentYear + 2; y++) years.push(y);
                    return years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
              {hasActiveFilter && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="w-3 h-3" />
                  Limpar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={filteredTransactions.length === 0}
                className="gap-2 ml-auto"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorrência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => {
                    const client = clients.find((c) => c.id === transaction.clientId);
                    const isPending = transaction.status === "pendente" || transaction.status === "atrasado";
                    return (
                      <TableRow
                        key={transaction.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleEdit(transaction)}
                      >
                        <TableCell>
                          {transaction.type === "receita" ? (
                            <div className="flex items-center gap-2 text-green-500">
                              <ArrowUpCircle className="w-4 h-4" />
                              <span className="text-sm">Receita</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-500">
                              <ArrowDownCircle className="w-4 h-4" />
                              <span className="text-sm">Despesa</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          {client ? (
                            <span className="text-sm">{client.name}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={transaction.type === "receita" ? "text-green-500 font-medium" : "text-red-500 font-medium"}
                        >
                          {transaction.value.startsWith("R$") ? transaction.value : `R$ ${transaction.value}`}
                        </TableCell>
                        <TableCell>
                          {transaction.isRecurring && transaction.dueDay ? (
                            <span className="text-sm">Dia {transaction.dueDay}</span>
                          ) : transaction.dueDate ? (
                            format(new Date(transaction.dueDate), "dd/MM/yyyy")
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.isRecurring ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit bg-primary/10 text-primary border-primary/30">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                {transaction.recurrenceType}
                              </Badge>
                              {transaction.installmentCount && (
                                <span className="text-xs text-muted-foreground">
                                  {transaction.installmentCount}x
                                </span>
                              )}
                              {transaction.isIndefinite && (
                                <span className="text-xs text-muted-foreground italic">Sem prazo</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {isPending && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                onClick={() => handleMarkAsPaid(transaction.id)}
                                title="Marcar como pago"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <ActionMenu
                              items={[
                                { label: "Editar", icon: Edit, onClick: () => handleEdit(transaction) },
                                {
                                  label: "Excluir",
                                  icon: Trash2,
                                  onClick: () => setDeleteId(transaction.id),
                                  variant: "destructive",
                                },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} de {filteredTransactions.length} transações
                </span>
                {filteredTransactions.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                    >
                      Próximo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
