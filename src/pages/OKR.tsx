import { useState, useMemo, FormEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DatePicker } from "@/components/shared/DatePicker";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { PageHeader } from "@/components/shared/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Search, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Clock, Flag, BarChart3, Edit, Trash2, History, Calendar, Filter } from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { toast } from "sonner";
import { OKRObjective, OKRUpdate, OKRFormData, OKRStatus, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/types/okr";
import { BU_CONFIG, BU } from "@/types/bu";
import { cn } from "@/lib/utils";
import { typographyClasses } from "@/lib/typography";
import { useOKRData } from "@/hooks/useOKRData";
import { BUMultiSelect } from "@/components/shared/BUMultiSelect";

export default function OKR() {
  const { objectives, updates, loading, addObjective, updateObjective, deleteObjective, addUpdate } = useOKRData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OKRStatus>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | OKRObjective["category"]>("all");
  const [filterBU, setFilterBU] = useState<BU[]>([]);
  const [filterPriority, setFilterPriority] = useState<"all" | OKRObjective["priority"]>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<OKRObjective | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<OKRObjective | null>(null);
  const [viewingObjective, setViewingObjective] = useState<OKRObjective | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OKRFormData>({
    title: "", description: "", target: 100, current: 0, unit: "",
    status: "not_started", startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    priority: "medium", category: "revenue", bu: []
  });
  const [updateFormData, setUpdateFormData] = useState({ value: 0, comment: "" });

  const resetForm = () => {
    setFormData({ title: "", description: "", target: 100, current: 0, unit: "",
      status: "not_started", startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      priority: "medium", category: "revenue", bu: [] });
    setEditingObjective(null);
  };

  const handleViewObjective = (objective: OKRObjective) => {
    setViewingObjective(objective);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const startDate = convertDateToISO(formData.startDate);
      const endDate = convertDateToISO(formData.endDate);

      if (editingObjective) {
        const success = await updateObjective(editingObjective.id, {
          title: formData.title,
          description: formData.description,
          target: formData.target,
          current: formData.current,
          unit: formData.unit,
          status: formData.status,
          startDate,
          endDate,
          priority: formData.priority,
          category: formData.category,
          bu: formData.bu,
        });
        if (success) {
          toast.success('OKR atualizado com sucesso!');
          setIsDialogOpen(false);
          resetForm();
        }
      } else {
        const newObj: Omit<OKRObjective, 'id' | 'createdAt' | 'updatedAt'> = {
          title: formData.title,
          description: formData.description,
          target: formData.target,
          current: formData.current,
          unit: formData.unit,
          status: formData.status,
          startDate,
          endDate,
          priority: formData.priority,
          category: formData.category,
          bu: formData.bu,
          progress: 0,
          lastUpdate: format(new Date(), "yyyy-MM-dd"),
        };
        const result = await addObjective(newObj);
        if (result) {
          setIsDialogOpen(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Erro ao salvar OKR:", error);
      toast.error("Erro ao salvar OKR");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedObjective) return;
    setIsSaving(true);
    try {
      const newUpdateData: Omit<OKRUpdate, 'id' | 'createdAt'> = {
        objectiveId: selectedObjective.id,
        date: format(new Date(), "yyyy-MM-dd"),
        value: updateFormData.value,
        comment: updateFormData.comment,
        updatedBy: "current-user",
      };
      await addUpdate(selectedObjective.id, newUpdateData);

      const progress = Math.min(100, Math.max(0, (updateFormData.value / selectedObjective.target) * 100));
      const newStatus = getStatusFromProgress(progress, selectedObjective.endDate);
      await updateObjective(selectedObjective.id, {
        current: updateFormData.value,
        progress,
        status: newStatus,
        lastUpdate: format(new Date(), "yyyy-MM-dd"),
      });

      setIsUpdateDialogOpen(false);
      setSelectedObjective(null);
      setUpdateFormData({ value: 0, comment: "" });
    } catch (error) {
      console.error("Erro ao adicionar atualizacao:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper para converter datas do DatePicker (dd/MM/yyyy) para ISO (yyyy-MM-dd)
  const convertDateToISO = (date: string): string => {
    if (!date) return "";
    // Se já está em formato ISO (yyyy-MM-dd), retorna como está
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    // Se está em formato brasileiro (dd/MM/yyyy), converte
    if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }
    return date;
  };

  const getStatusFromProgress = (progress: number, endDate: string) => {
    const end = parseISO(convertDateToISO(endDate));
    const start = parseISO(objectives[0]?.startDate || new Date().toISOString());
    if (!isValid(end) || !isValid(start)) return progress >= 100 ? "completed" : "not_started";
    const daysRemaining = differenceInDays(end, new Date());
    const totalDays = differenceInDays(end, start);
    const progressExpected = totalDays > 0 ? Math.max(0, 100 - (daysRemaining / totalDays) * 100) : 0;
    if (progress >= 100) return "completed";
    if (progress >= progressExpected * 0.9) return "on_track";
    if (progress >= progressExpected * 0.7) return "in_progress";
    if (progress >= progressExpected * 0.5) return "at_risk";
    return "not_started";
  };

  const handleEdit = (objective: OKRObjective) => {
    setEditingObjective(objective);
    setFormData({ title: objective.title, description: objective.description || "",
      target: objective.target, current: objective.current, unit: objective.unit,
      status: objective.status, startDate: objective.startDate, endDate: objective.endDate,
      priority: objective.priority, category: objective.category, bu: objective.bu });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteObjective(id);
      setDeleteId(null);
    } catch (error) {
      console.error("Erro ao deletar OKR:", error);
    }
  };

  const filteredObjectives = useMemo(() => {
    return objectives.filter(obj => {
      const matchesSearch = obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           obj.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || obj.status === filterStatus;
      const matchesCategory = filterCategory === "all" || obj.category === filterCategory;
      const matchesBU = filterBU.length === 0 || filterBU.includes(obj.bu);
      const matchesPriority = filterPriority === "all" || obj.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesCategory && matchesBU && matchesPriority;
    });
  }, [objectives, searchTerm, filterStatus, filterCategory, filterBU, filterPriority]);

  const stats = useMemo(() => {
    const total = objectives.length;
    const completed = objectives.filter(o => o.status === "completed").length;
    const inProgress = objectives.filter(o => o.status === "in_progress" || o.status === "on_track").length;
    const atRisk = objectives.filter(o => o.status === "at_risk" || o.status === "not_started").length;
    const avgProgress = objectives.length > 0 ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length) : 0;
    return { total, completed, inProgress, atRisk, avgProgress };
  }, [objectives]);

  const getStatusIcon = (status: OKRStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "on_track": return <TrendingUp className="w-4 h-4 text-primary600" />;
      case "in_progress": return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "at_risk": return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "not_started": return <Clock className="w-4 h-4 text-slate-500" />;
      case "failed": return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const formatDateSafely = (dateStr: string) => {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
  };

  const toggleBUFilter = (bu: BU) => {
    setFilterBU(prev => prev.includes(bu) ? prev.filter(b => b !== bu) : [...prev, bu]);
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <PageHeader icon={Target} title="OKR - Objetivos e Resultados-Chave"
          subtitle="Gerencie e acompanhe as metas estrategicas da empresa"
          actions={<Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo OKR</Button>} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Total de OKRs</CardTitle>
            <Target className="h-4 w-4 text-slate-500" /></CardHeader>
            <CardContent><div className={cn(typographyClasses.statValue, "text-foreground")}>{stats.total}</div></CardContent></Card>
          <Card className="bg-card border-border/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Concluidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /></CardHeader>
            <CardContent><div className={cn(typographyClasses.statValue, "text-emerald-600")}>{stats.completed}</div></CardContent></Card>
          <Card className="bg-card border-border/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Em Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary600" /></CardHeader>
            <CardContent><div className={cn(typographyClasses.statValue, "text-primary600")}>{stats.inProgress}</div></CardContent></Card>
          <Card className="bg-card border-border/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Em Risco</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" /></CardHeader>
            <CardContent><div className={cn(typographyClasses.statValue, "text-amber-600")}>{stats.atRisk}</div></CardContent></Card>
          <Card className="bg-card border-border/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Progresso Medio</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-500" /></CardHeader>
            <CardContent><div className={cn(typographyClasses.statValue, "text-muted-foreground")}>{stats.avgProgress}%</div></CardContent></Card>
        </div>

        <Card className="bg-card border-border/50"><CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1"><Label className={cn(typographyClasses.label, "mb-1")}></Label>
              <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar por titulo ou descricao..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-background border-border text-foreground" /></div></div>
            <Select value={filterStatus} onValueChange={(v: "all" | OKRStatus) => setFilterStatus(v)}>
              <SelectTrigger className="w-[140px] bg-background border-border text-foreground">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />{filterStatus === "all" ? "Status" : STATUS_LABELS[filterStatus]}</SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="all" className="text-foreground">Todos Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (<SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>))}</SelectContent></Select>
            <Select value={filterCategory} onValueChange={(v: "all" | OKRObjective["category"]) => setFilterCategory(v)}>
              <SelectTrigger className="w-[140px] bg-background border-border text-foreground">
                <Flag className="w-4 h-4 mr-2 text-slate-500" />{filterCategory === "all" ? "Categoria" : CATEGORY_LABELS[filterCategory]}</SelectTrigger>
              <SelectContent className="bg-card border-border"><SelectItem value="all" className="text-foreground">Todas Categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>))}</SelectContent></Select>
          </div>
          <div className="mt-4"><Label className={cn(typographyClasses.label, "mb-2 block")}></Label>
            <div className="flex flex-wrap gap-2">
              {(["kora-agents", "kora-dev", "kora-studio", "kora-corp"] as BU[]).map((bu) => {
                const isSelected = filterBU.includes(bu);
                return (<button key={bu} onClick={() => toggleBUFilter(bu)}
                  className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1.5",
                    isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                  <div className={cn("w-2 h-2 rounded-full", BU_CONFIG[bu].dotClass)} />{BU_CONFIG[bu].label}</button>);
              })}
            </div>
          </div>
        </CardContent></Card>

        <Card className="bg-card border-border/50"><CardHeader>
          <CardTitle className={typographyClasses.subsectionTitle}>OKRs Ativos</CardTitle>
          <CardDescription className={typographyClasses.description}>Metas e objetivos em andamento</CardDescription>
        </CardHeader><CardContent>
          <div className="space-y-6">
            {filteredObjectives.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-foreground/70">Nenhum OKR encontrado</p>
                <p className="text-sm text-muted-foreground">Crie seu primeiro OKR para começar</p>
              </div>) : (filteredObjectives.map((objective) => (
                <div key={objective.id} className="border border-border/50 rounded-lg p-6 space-y-4 hover:shadow-lg hover:border-primary/50 transition-all bg-card/50 cursor-pointer" onClick={() => handleViewObjective(objective)}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-foreground">{objective.title}</h3>
                        <Badge variant="outline" className={cn(STATUS_COLORS[objective.status], "border-border/50")}>
                          {getStatusIcon(objective.status)}<span className="ml-1">{STATUS_LABELS[objective.status]}</span></Badge>
                        <Badge variant="secondary" className={cn(PRIORITY_COLORS[objective.priority], "border-border/50")}>
                          <Flag className="w-3 h-3 mr-1" />{PRIORITY_LABELS[objective.priority]}</Badge>
                        <Badge variant="outline" className="border-border/50 bg-muted/50 text-foreground/80">
                          <Flag className="w-3 h-3 mr-1" />{CATEGORY_LABELS[objective.category]}</Badge>
                      </div>
                      {objective.description && <p className={cn(typographyClasses.description, "mb-3")}>{objective.description}</p>}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-500" />{formatDateSafely(objective.startDate)} - {formatDateSafely(objective.endDate)}</span>
                        <span className="flex items-center gap-1"><Target className="w-4 h-4 text-slate-500" />Meta: {objective.current.toLocaleString()} / {objective.target.toLocaleString()} {objective.unit}</span>
                        <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4 text-slate-500" />Progresso: {objective.progress}%</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Flag className="w-4 h-4 text-slate-500" />
                          <span>BUs: {Array.isArray(objective.bu) ? objective.bu.join(", ") : objective.bu}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedObjective(objective); setIsUpdateDialogOpen(true); }}
                        className="border-border/50 text-foreground hover:bg-muted/50"><History className="w-4 h-4 mr-1" />Atualizar</Button>
                      <ActionMenu items={[
                        { label: "Editar", icon: Edit, onClick: () => handleEdit(objective), variant: "default" },
                        { label: "Excluir", icon: Trash2, onClick: () => setDeleteId(objective.id), variant: "destructive" }]} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progresso Geral</span>
                      <span className="font-medium text-foreground">{objective.progress}%</span></div>
                    <Progress value={objective.progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>0%</span><span>100%</span></div>
                  </div>
                  {updates.filter(u => u.objectiveId === objective.id).slice(0, 3).length > 0 && (
                    <div className="border-t border-border/50 pt-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-foreground">
                        <History className="w-4 h-4 text-slate-500" />Ultimas Atualizacoes</h4>
                      <div className="space-y-2">
                        {updates.filter(u => u.objectiveId === objective.id).slice(0, 3).map((update) => (
                          <div key={update.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded border border-border/30">
                            <div className="flex items-center gap-2"><span className="font-medium text-foreground">{update.value.toLocaleString()} {objective.unit}</span>
                              <span className="text-muted-foreground">- {update.comment}</span></div>
                            <span className="text-muted-foreground text-xs">por {update.updatedBy} em {formatDateSafely(update.date)}</span>
                          </div>))}
                      </div>
                    </div>
                  )}
                </div>)))}
          </div>
        </CardContent></Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader><DialogTitle className={typographyClasses.subsectionTitle}>{editingObjective ? "Editar OKR" : "Novo OKR"}</DialogTitle>
              <DialogDescription className={typographyClasses.description}>{editingObjective ? "Atualize as informacoes do seu objetivo" : "Defina um novo objetivo e metas para sua equipe"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2">
                  <Label className={typographyClasses.label}>Titulo</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Aumentar receita recorrente" required className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>))}</SelectContent></Select></div></div>
              <div className="space-y-2"><Label className="text-foreground/90">Descricao</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo com mais detalhes..." rows={3} className="bg-background border-border text-foreground" /></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label className="text-foreground/90">Meta</Label>
                  <Input type="number" value={formData.target} onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                    required className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Unidade</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="R$, %, dias..." className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>))}</SelectContent></Select></div>
                <BUMultiSelect
                  value={formData.bu}
                  onChange={(bus) => setFormData({ ...formData, bu: bus })}
                />
                </div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2">
                  <Label className={typographyClasses.label}>Data de Inicio</Label>
                  <DatePicker value={formData.startDate} onChange={(date) => setFormData({ ...formData, startDate: date })} /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Data de Termino</Label>
                  <DatePicker value={formData.endDate} onChange={(date) => setFormData({ ...formData, endDate: date })} /></div></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}
                  className="border-border/50 text-foreground hover:bg-muted/50">Cancelar</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." :(editingObjective ? "Atualizar" : "Criar")}</Button></div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className={typographyClasses.subsectionTitle}>Atualizar Progresso</DialogTitle>
              <DialogDescription className={typographyClasses.description}>Registre o progresso atual do objetivo</DialogDescription>
            </DialogHeader>
            {selectedObjective && (
              <form onSubmit={handleAddUpdate} className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                  <h4 className={cn(typographyClasses.cardTitle, "mb-2")}>{selectedObjective.title}</h4>
                  <div className={typographyClasses.statLabel}>Meta: {selectedObjective.current.toLocaleString()} / {selectedObjective.target.toLocaleString()} {selectedObjective.unit}</div>
                  <Progress value={selectedObjective.progress} className="h-2 mt-2" /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Valor Atual</Label>
                  <Input type="number" value={updateFormData.value} onChange={(e) => setUpdateFormData({ ...updateFormData, value: Number(e.target.value) })}
                    placeholder={`Digite o valor atual em ${selectedObjective.unit}`} required className="bg-background border-border text-foreground" /></div>
                <div className="space-y-2"><Label className="text-foreground/90">Comentario</Label>
                  <Textarea value={updateFormData.comment} onChange={(e) => setUpdateFormData({ ...updateFormData, comment: e.target.value })}
                    placeholder="Descreva o que foi feito..." rows={3} className="bg-background border-border text-foreground" /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setIsUpdateDialogOpen(false); setSelectedObjective(null); setUpdateFormData({ value: 0, comment: "" }); }}
                    className="border-border/50 text-foreground hover:bg-muted/50">Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." :"Registrar Atualizacao"}</Button></div>
              </form>)}
          </DialogContent>
        </Dialog>

        {/* View OKR Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className={typographyClasses.subsectionTitle}>{viewingObjective?.title}</DialogTitle>
            </DialogHeader>
            {viewingObjective && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn(STATUS_COLORS[viewingObjective.status], "border-border/50")}>
                    {getStatusIcon(viewingObjective.status)}<span className="ml-1">{STATUS_LABELS[viewingObjective.status]}</span>
                  </Badge>
                  <Badge variant="secondary" className={cn(PRIORITY_COLORS[viewingObjective.priority], "border-border/50")}>
                    <Flag className="w-3 h-3 mr-1" />{PRIORITY_LABELS[viewingObjective.priority]}
                  </Badge>
                  <Badge variant="outline" className="border-border/50 bg-muted/50 text-foreground/80">
                    {CATEGORY_LABELS[viewingObjective.category]}
                  </Badge>
                </div>

                {viewingObjective.description && (
                  <div>
                    <Label className="text-foreground/80">Descrição</Label>
                    <p className={cn(typographyClasses.description, "mt-2")}>{viewingObjective.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground/80">Data Início</Label>
                    <p className="text-foreground font-medium mt-1">{formatDateSafely(viewingObjective.startDate)}</p>
                  </div>
                  <div>
                    <Label className="text-foreground/80">Data Término</Label>
                    <p className="text-foreground font-medium mt-1">{formatDateSafely(viewingObjective.endDate)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground/80 mb-2 block">Progresso: {viewingObjective.progress}%</Label>
                  <Progress value={viewingObjective.progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{viewingObjective.current.toLocaleString()} {viewingObjective.unit}</span>
                    <span>{viewingObjective.target.toLocaleString()} {viewingObjective.unit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground/80">BUs</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(viewingObjective.bu) ? viewingObjective.bu.map(bu => (
                        <Badge key={bu} variant="secondary" className="bg-primary/10 text-primary border-primary/20">{bu}</Badge>
                      )) : <Badge variant="secondary">{viewingObjective.bu}</Badge>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-foreground/80">Última Atualização</Label>
                    <p className="text-foreground font-medium mt-1">{formatDateSafely(viewingObjective.lastUpdate)}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-border/50">Fechar</Button>
                  <Button onClick={() => { setIsViewDialogOpen(false); handleEdit(viewingObjective); }}>Editar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
          onConfirm={() => deleteId && handleDelete(deleteId)} title="Confirmar Exclusao"
          description="Tem certeza que deseja excluir este OKR? Esta acao nao pode ser desfeita." confirmLabel="Excluir" cancelLabel="Cancelar" variant="destructive" />
      </div>
    </AppLayout>
  );
}
