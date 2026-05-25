import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DatePicker } from "@/components/shared/DatePicker";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ClientFinancialSummary } from "@/components/financeiro/ClientFinancialSummary";
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
  Trash2
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { format } from "date-fns";

export default function Financeiro() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useFinancial();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const { data: contracts = [] } = useAllContracts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendente" | "pago" | "atrasado">("all");
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
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
    // New installment fields
    installmentCount: null as number | null,
    firstPaymentDate: "",
    isIndefinite: false
  });

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
      isIndefinite: false
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
      // New installment fields
      installmentCount: formData.installmentCount,
      firstPaymentDate: formData.firstPaymentDate || undefined,
      isIndefinite: formData.isIndefinite,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      isIndefinite: transaction.isIndefinite || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      
      // Filter by month/year based on dueDate
      let matchesMonth = true;
      let matchesYear = true;
      
      if (filterMonth !== null || filterYear !== null) {
        if (!t.dueDate) {
          // If no dueDate and filter active, exclude
          matchesMonth = false;
          matchesYear = false;
        } else {
          const date = new Date(t.dueDate);
          if (filterMonth !== null) {
            matchesMonth = date.getMonth() + 1 === filterMonth; // getMonth() is 0-indexed
          }
          if (filterYear !== null) {
            matchesYear = date.getFullYear() === filterYear;
          }
        }
      }
      
      return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesYear;
    });
  }, [transactions, searchTerm, filterType, filterStatus, filterMonth, filterYear]);

  const summary = useMemo(() => {
    const receitas = transactions
      .filter(t => t.type === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const despesas = transactions
      .filter(t => t.type === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const pendentes = transactions
      .filter(t => t.status === "pendente" || t.status === "atrasado")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      pendentes
    };
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pendente": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "atrasado": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "cancelado": return "bg-muted text-muted-foreground border-muted";
      default: return "";
    }
  };

  const categories = formData.type === "receita" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={Wallet}
          title="Financeiro"
          subtitle="Gestão de receitas e despesas"
          actions={
            <>
              <Button variant="outline" className="gap-2" disabled>
                <Landmark className="w-4 h-4" />
                Conectar Banco Inter
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tipo */}
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
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
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

                  {/* Recorrência */}
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
                      <Select value={formData.recurrenceType} onValueChange={(v) => setFormData({ ...formData, recurrenceType: v as "" | "mensal" | "trimestral" | "semestral" | "anual" })}>
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
                          <Input
                            type="number"
                            min="1"
                            value={formData.installmentCount || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              installmentCount: e.target.value ? parseInt(e.target.value) : null
                            })}
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
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.dueDay || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            dueDay: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder="Ex: 5"
                        />
                      ) : (
                        <DatePicker
                          value={formData.dueDate}
                          onChange={(v) => setFormData({ ...formData, dueDate: v })}
                        />
                      )}
                      {formData.isRecurring && (
                        <p className="text-xs text-muted-foreground">
                          Dia do mês de vencimento (1-31)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "pendente" | "pago" | "cancelado" | "atrasado" })}>
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
                      <Select value={formData.clientId || "none"} onValueChange={(v) => setFormData({ ...formData, clientId: v === "none" ? "" : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Projeto (opcional)</Label>
                      <Select value={formData.projectId || "none"} onValueChange={(v) => setFormData({ ...formData, projectId: v === "none" ? "" : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {projects.map(project => (
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

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                      Cancelar
                    </Button>
                    <Button
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
                  </div>
                </form>
                </DialogBody>
              </DialogContent>
            </Dialog>
            </>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-500">{formatCurrency(summary.receitas)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total recebido</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.despesas)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total pago</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.saldo >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(summary.saldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(summary.pendentes)}</div>
              <p className="text-xs text-muted-foreground mt-1">A pagar/receber</p>
            </CardContent>
          </Card>
        </div>

        <ClientFinancialSummary clients={clients} contracts={contracts} transactions={transactions} />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMonth?.toString() || ""} onValueChange={(v) => setFilterMonth(v === "all" || v === "" ? null : parseInt(v))}>
                <SelectTrigger className="w-[150px]">
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
              <Select value={filterYear?.toString() || ""} onValueChange={(v) => setFilterYear(v === "all" || v === "" ? null : parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
                      years.push(y);
                    }
                    return years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parcelas</TableHead>
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
                  filteredTransactions.map((transaction) => (
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
                      <TableCell className={transaction.type === "receita" ? "text-green-500" : "text-red-500"}>
                        {transaction.value.startsWith("R$") ? transaction.value : `R$ ${transaction.value}`}
                      </TableCell>
                      <TableCell>
                        {transaction.isRecurring && transaction.dueDay ? (
                          <span className="text-sm">Dia {transaction.dueDay}</span>
                        ) : transaction.dueDate ? (
                          format(new Date(transaction.dueDate), "dd/MM/yyyy")
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                          {transaction.status === "pago" && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">✓ Pago</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.isRecurring ? (
                          <div className="flex flex-col gap-1">
                            {transaction.dueDay && (
                              <span className="text-xs text-muted-foreground">
                                Venc: dia {transaction.dueDay}
                              </span>
                            )}
                            {transaction.installmentCount && (
                              <span className="text-xs text-muted-foreground">
                                {transaction.installmentCount} parcelas
                              </span>
                            )}
                            {transaction.firstPaymentDate && (
                              <span className="text-xs text-muted-foreground">
                                Início: {format(new Date(transaction.firstPaymentDate), "dd/MM/yyyy")}
                              </span>
                            )}
                            {transaction.isIndefinite && (
                              <span className="text-xs text-muted-foreground italic">
                                Sem prazo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.isRecurring ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {transaction.recurrenceType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          items={[
                            { label: "Editar", icon: Edit, onClick: () => handleEdit(transaction) },
                            { label: "Excluir", icon: Trash2, onClick: () => setDeleteId(transaction.id), variant: "destructive" }
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
    </AppLayout>
  );
}
