import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared/DatePicker";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { BUSelect } from "@/components/shared/BUSelect";
import { toast } from "sonner";
import { useTaskMutations } from "@/hooks/mutations/useTaskMutations";
import { Task } from "@/types/data";
import { BU } from "@/types/bu";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useTeamOptions } from "@/hooks/useProfile";

const statusColumns = [
  { id: "todo", label: "A Fazer" },
  { id: "in_progress", label: "Em Andamento" },
  { id: "blocked", label: "Em Impedimento" },
  { id: "review", label: "Em Validação Interna" },
  { id: "client_review", label: "Em Cliente" },
  { id: "done", label: "Concluído" },
] as const;

const priorityConfig = {
  low: { label: "Baixa" },
  medium: { label: "Média" },
  high: { label: "Alta" },
};

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultStatus?: Task["status"];
}

export function CreateTaskDialog({ open, onOpenChange, defaultClientId, defaultProjectId, defaultStatus = "todo" }: CreateTaskDialogProps) {
  const { addTask, isAdding } = useTaskMutations();
  const { data: clients = [] } = useAllClients();
  const { data: allProjects = [] } = useAllProjects();
  const teamOptions = useTeamOptions();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: defaultClientId ?? "",
    projectId: defaultProjectId ?? "",
    assignees: [] as string[],
    status: defaultStatus,
    priority: "medium" as Task["priority"],
    dueDate: "",
    bu: "kora-dev" as BU,
    blockedReason: "",
    estimatedHours: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        clientId: defaultClientId ?? "",
        projectId: defaultProjectId ?? "",
        assignees: [],
        status: defaultStatus,
        priority: "medium",
        dueDate: "",
        bu: "kora-dev",
        blockedReason: "",
        estimatedHours: "",
      });
    }
  }, [open, defaultClientId, defaultProjectId, defaultStatus]);

  const availableProjects = useMemo(
    () => (formData.clientId ? allProjects.filter((p) => p.clientId === formData.clientId) : []),
    [formData.clientId, allProjects],
  );

  const clientLocked = !!defaultClientId;
  const projectLocked = !!defaultProjectId;

  const handleSave = () => {
    if (!formData.title || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    addTask({
      clientId: formData.clientId,
      projectId: formData.projectId || undefined,
      title: formData.title,
      description: formData.description,
      assignees: formData.assignees,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || "A definir",
      bu: formData.bu ? [formData.bu] : undefined,
      blockedReason: formData.status === "blocked" ? formData.blockedReason : undefined,
      clientApproved: false,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Tarefa</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ct-title">Título *</Label>
            <Input
              id="ct-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título da tarefa"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-description">Descrição</Label>
            <Textarea
              id="ct-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da tarefa"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {clientLocked ? (
              <div className="h-10 px-3 flex items-center rounded-md bg-muted border border-border text-sm text-foreground">
                {clients.find((c) => c.id === formData.clientId)?.company ?? formData.clientId}
              </div>
            ) : (
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: "" })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {formData.clientId && (
            <div className="space-y-2">
              <Label>Projeto</Label>
              {projectLocked ? (
                <div className="h-10 px-3 flex items-center rounded-md bg-muted border border-border text-sm text-foreground">
                  {allProjects.find((p) => p.id === formData.projectId)?.name ?? formData.projectId}
                </div>
              ) : (
                <Select value={formData.projectId || "none"} onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder={availableProjects.length > 0 ? "Selecione um projeto" : "Nenhum projeto disponível"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Task["status"] })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {statusColumns.map((col) => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task["priority"] })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prazo</Label>
            <DatePicker
              value={formData.dueDate}
              onChange={(value) => setFormData({ ...formData, dueDate: value })}
              placeholder="Selecione o prazo"
            />
          </div>
          <div className="space-y-2">
            <Label>Horas Estimadas</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                min="0"
                step="0.5"
                placeholder="Ex: 8"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <MultiSelect
              options={teamOptions}
              value={formData.assignees}
              onChange={(value) => setFormData({ ...formData, assignees: value })}
              placeholder="Adicionar responsável"
            />
          </div>
          <div className="space-y-2">
            <Label>BU</Label>
            <BUSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
          </div>
          {formData.status === "blocked" && (
            <div className="space-y-2">
              <Label>Motivo do Impedimento</Label>
              <Textarea
                value={formData.blockedReason}
                onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })}
                placeholder="Descreva o que está impedindo a continuidade desta tarefa"
                className="bg-input border-border"
                rows={3}
              />
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={isAdding} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
