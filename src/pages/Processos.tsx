import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/DatePicker";
import {
  Workflow,
  Building2,
  FileText,
  Calendar,
  Users,
  Plus,
  Edit,
  Trash2,
  Paperclip,
  X,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Tag,
} from "lucide-react";
import { BU_LIST } from "@/types/bu";
import type { Process, ProcessCategory } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Categories now use BU values
const CATEGORIES = BU_LIST.map(bu => ({
  id: bu.id,
  label: bu.label,
  icon: bu.icon,
  color: bu.hex,
}));

const STATUS_CONFIG = {
  pendente: { label: "Pendente", color: "bg-slate-500", bgColor: "bg-slate-500/10", textColor: "text-slate-500", borderColor: "border-slate-500/20" },
  em_andamento: { label: "Em Andamento", color: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-500", borderColor: "border-amber-500/20" },
  concluido: { label: "Concluído", color: "bg-green-500", bgColor: "bg-green-500/10", textColor: "text-green-500", borderColor: "border-green-500/20" },
};

export default function Processos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [deletingProcessId, setDeletingProcessId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    subcategory: string;
    status: string;
    assigned_to: string;
    due_date: string;
    documents: string[];
    newDocument: string;
  }>({
    name: "",
    description: "",
    category: "kora-agents",
    subcategory: "",
    status: "pendente",
    assigned_to: "",
    due_date: "",
    documents: [],
    newDocument: "",
  });

  // Fetch processes from Supabase
  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("processes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      logger.error("Error fetching processes:", error instanceof Error ? error : undefined);
      toast.error("Erro ao carregar processos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Filter processes by search query (case sensitive)
  const filteredProcesses = useMemo(() => {
    if (!searchQuery.trim()) return processes;
    return processes.filter(p => 
      p.name.includes(searchQuery) || 
      (p.description && p.description.includes(searchQuery)) ||
      p.category.includes(searchQuery) ||
      (p.subcategory && p.subcategory.includes(searchQuery)) ||
      (p.assigned_to && p.assigned_to.includes(searchQuery))
    );
  }, [processes, searchQuery]);

  // Count processes by BU
  const processCountByBU = useMemo(() => {
    const counts: Record<string, number> = {};
    processes.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [processes]);

  const openNewDialog = () => {
    setEditingProcess(null);
    setFormData({
      name: "",
      description: "",
      category: "kora-agents",
      subcategory: "",
      status: "pendente",
      assigned_to: "",
      due_date: "",
      documents: [],
      newDocument: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (process: Process) => {
    setEditingProcess(process);
    setFormData({
      name: process.name,
      description: process.description || "",
      category: process.category,
      subcategory: process.subcategory || "",
      status: process.status,
      assigned_to: process.assigned_to || "",
      due_date: process.due_date || "",
      documents: process.documents || [],
      newDocument: "",
    });
    setIsDialogOpen(true);
  };

  const convertDateToISO = (date: string): string | null => {
    if (!date) return null;
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }
    return date;
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      // Build update/insert data
      const processData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
        due_date: convertDateToISO(formData.due_date),
      };

      // Add subcategory only if it has a value and is not empty
      if (formData.subcategory && formData.subcategory.trim()) {
        processData.subcategory = formData.subcategory;
      }

      // Add documents if there are any
      if (formData.documents && formData.documents.length > 0) {
        processData.documents = formData.documents;
      }

      if (editingProcess) {
        const { error } = await supabase
          .from("processes")
          .update(processData)
          .eq("id", editingProcess.id);

        if (error) {
          logger.error("Update error:", error instanceof Error ? error : undefined);
          throw error;
        }
        toast.success("Processo atualizado!");
      } else {
        const { error } = await supabase
          .from("processes")
          .insert(processData);

        if (error) throw error;
        toast.success("Processo criado!");
      }

      setIsDialogOpen(false);
      fetchProcesses();
    } catch (error) {
      logger.error("Error saving process:", error instanceof Error ? error : undefined);
      toast.error("Erro ao salvar processo");
    }
  };

  const handleDelete = async () => {
    if (deletingProcessId) {
      try {
        const { error } = await supabase
          .from("processes")
          .delete()
          .eq("id", deletingProcessId);

        if (error) throw error;
        toast.success("Processo removido!");
        setIsDeleteDialogOpen(false);
        setDeletingProcessId(null);
        fetchProcesses();
      } catch (error) {
        logger.error("Error deleting process:", error instanceof Error ? error : undefined);
        toast.error("Erro ao remover processo");
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <PageHeader
          icon={Workflow}
          title="Processos"
          subtitle="Hub corporativo da Koraflow — SOPs, cadências, comercial, financeiro/legal e KPIs"
          kpi={{ label: "Processos ativos", value: processes.length, icon: Users, accent: "amber" }}
          actions={
            <button
              onClick={openNewDialog}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow"
            >
              <Plus className="w-4 h-4" />
              Novo Processo
            </button>
          }
        />

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar processos... (case sensitive)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#854F0B]" /> Estrutura de sócios por BU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              {BU_LIST.map((bu) => {
                const Icon = bu.icon;
                const count = processCountByBU[bu.id] || 0;
                return (
                  <div
                    key={bu.id}
                    className="p-4 rounded-xl border border-border bg-card"
                    style={{ borderLeftWidth: 3, borderLeftColor: bu.hex }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: bu.hex }} />
                        <p className="font-semibold text-foreground">{bu.label}</p>
                      </div>
                      <span className="text-lg font-bold text-foreground">{count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Sócio responsável</p>
                    <p className="text-sm font-medium text-foreground">{bu.owner}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Processos */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProcesses.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum processo encontrado
              </div>
            ) : (
              filteredProcesses.map((process) => {
                const bu = BU_CONFIG[process.category as keyof typeof BU_CONFIG];
                const StatusIcon = process.status === 'concluido' ? CheckCircle : process.status === 'em_andamento' ? Clock : AlertCircle;
                const statusColor = process.status === 'concluido' ? 'text-green-500' : process.status === 'em_andamento' ? 'text-amber-500' : 'text-slate-500';
                
                return (
                  <Card 
                    key={process.id} 
                    className="hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openEditDialog(process)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <StatusIcon className={`w-4 h-4 ${statusColor} flex-shrink-0`} />
                            <p className="font-semibold text-foreground truncate">{process.name}</p>
                          </div>
                          
                          {process.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {process.description}
                            </p>
                          )}
                          
                          {/* Tags */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Tag BU */}
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ 
                                backgroundColor: bu?.hex + '20', 
                                color: bu?.hex,
                                border: `1px solid ${bu?.hex}40`
                              }}
                            >
                              {bu?.label || process.category}
                            </span>
                            
                            {/* Tag Subcategoria */}
                            {process.subcategory && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground-foreground">
                                <Tag className="w-3 h-3 inline mr-1" />
                                {process.subcategory}
                              </span>
                            )}
                            
                            {/* Tag Responsável */}
                            {process.assigned_to && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                <Users className="w-3 h-3 inline mr-1" />
                                {process.assigned_to}
                              </span>
                            )}
                            
                            {/* Tag Data */}
                            {process.due_date && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(process.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            
                            {/* Tag Documentos */}
                            {process.documents && process.documents.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                <FileText className="w-3 h-3 inline mr-1" />
                                {process.documents.length}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditDialog(process); }}
                            className="p-1.5 hover:bg-muted rounded"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingProcessId(process.id); setIsDeleteDialogOpen(true); }}
                            className="p-1.5 hover:bg-muted rounded"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editingProcess ? "Editar Processo" : "Novo Processo"}
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do processo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do processo"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">BU *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as ProcessCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria (opcional)</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="Ex: Qualificação, Revisão, Comitê"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Responsável</Label>
                <Input
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <DatePicker
                  value={formData.due_date}
                  onChange={(val) => setFormData({ ...formData, due_date: val })}
                />
              </div>
              {/* Documentos */}
              <div className="space-y-2">
                <Label>Documentos</Label>
                
                {/* Upload de arquivo do dispositivo */}
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    id="document-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          toast.message("Enviando arquivo...");
                          
                          // Upload to Supabase Storage
                          // Sanitize filename - remove special characters
                          const sanitizedName = file.name
                            .replace(/[\u00C0-\u024F]/g, (c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
                            .replace(/[^a-zA-Z0-9.-]/g, '_');
                          const fileName = `${Date.now()}-${sanitizedName}`;
                          const { error } = await supabase.storage
                            .from('process-documents')
                            .upload(fileName, file);
                          
                          if (error) throw error;
                          
                          // Get public URL
                          const { data: urlData } = supabase.storage
                            .from('process-documents')
                            .getPublicUrl(fileName);
                          
                          const publicUrl = urlData.publicUrl;
                          
                          setFormData({
                            ...formData,
                            documents: [...(formData.documents || []), publicUrl],
                          });
                          
                          toast.success("Arquivo enviado!");
                        } catch (error) {
                          logger.error("Upload error:", error instanceof Error ? error : undefined);
                          toast.error("Erro ao enviar arquivo");
                        }
                      }
                      // Reset input
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Paperclip className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar um arquivo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, Word, Excel, PowerPoint, Imagens
                    </span>
                  </label>
                </div>
                
                {/* Ou inserir URL manualmente */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ou</span>
                  <Input
                    value={formData.newDocument}
                    onChange={(e) => setFormData({ ...formData, newDocument: e.target.value })}
                    placeholder="Cole uma URL externa"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (formData.newDocument && formData.newDocument.trim()) {
                        setFormData({
                          ...formData,
                          documents: [...(formData.documents || []), formData.newDocument.trim()],
                          newDocument: "",
                        });
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Lista de documentos */}
                {formData.documents && formData.documents.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formData.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <a 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline truncate flex-1"
                        >
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {doc.split('/').pop() || doc}
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              documents: formData.documents!.filter((_, i) => i !== idx),
                            });
                          }}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingProcess ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
