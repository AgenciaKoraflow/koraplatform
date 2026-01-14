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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DatePicker } from "@/components/shared/DatePicker";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { useFinancial } from "@/hooks/useFinancial";
import { useData } from "@/contexts/DataContext";
import { FinancialTransaction, EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from "@/types/financial";
import { 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Landmark,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Financeiro() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useFinancial();
  const { clients, projects } = useData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendente" | "pago" | "atrasado">("all");
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
    paidDate: "",
    status: "pendente" as "pendente" | "pago" | "cancelado" | "atrasado",
    clientId: "",
    projectId: "",
    notes: ""
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
      paidDate: "",
      status: "pendente",
      clientId: "",
      projectId: "",
      notes: ""
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
      paidDate: formData.paidDate || undefined,
      status: formData.status,
      clientId: formData.clientId || undefined,
      projectId: formData.projectId || undefined,
      notes: formData.notes || undefined,
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
      paidDate: transaction.paidDate || "",
      status: transaction.status,
      clientId: transaction.clientId || "",
      projectId: transaction.projectId || "",
      notes: transaction.notes || ""
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
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  const summary = useMemo(() => {
    const receitas = transactions.filter(t => t.type === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + parseFloat(t.value.replace(/[^\d,.-]/g, '').replace(',', '.')), 0);
    const despesas = transactions.filter(t => t.type === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + parseFloat(t.value.replace(/[^\d,.-]/g, '').replace(',', '.')), 0);
    const pendentes = transactions.filter(t => t.status === "pendente")
      .reduce((sum, t) => sum + parseFloat(t.value.replace(/[^\d,.-]/g, '').replace(',', '.')), 0);
    
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Gestão de receitas e despesas</p>
          </div>
          <div className="flex items-center gap-3">
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? "Editar Transação" : "Nova Transação"}
                  </DialogTitle>
                </DialogHeader>
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
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
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
                      <Select value={formData.recurrenceType} onValueChange={(v) => setFormData({ ...formData, recurrenceType: v as any })}>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vencimento</Label>
                      <DatePicker
                        value={formData.dueDate}
                        onChange={(v) => setFormData({ ...formData, dueDate: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
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
                    <Button type="submit" disabled={!formData.category || !formData.description || !formData.value}>
                      {editingTransaction ? "Salvar Alterações" : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.receitas)}</div>
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
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
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
                  <TableHead>Recorrência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
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
                        {transaction.dueDate ? format(new Date(transaction.dueDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
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
                      <TableCell className="text-right">
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
