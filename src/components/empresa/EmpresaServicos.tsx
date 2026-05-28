import { useState } from "react";
import { Tag, Plus, Search, Package, DollarSign, RefreshCw, CreditCard, Eye } from "lucide-react";
import { Edit, Trash2 } from "@/components/shared/ActionMenu";
import { BUBadge } from "@/components/shared/BUBadge";
import { BUSelect } from "@/components/shared/BUSelect";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/useDebounce";
import { useServices } from "@/hooks/useServices";
import { useServiceMutations } from "@/hooks/mutations/useServiceMutations";
import type { Service } from "@/types/data";
import type { BU } from "@/types/bu";
import { BU_LIST } from "@/types/bu";

const PAGE_SIZE = 50;

const BILLING_TYPE_LABELS: Record<Service["billingType"], string> = {
  projeto_unico: "Projeto Único",
  recorrencia: "Recorrência",
  hora: "Por Hora",
  combo: "Combo",
};

const STATUS_LABELS: Record<Service["status"], string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

type FormData = {
  name: string;
  description: string;
  category: string;
  bu: BU;
  billingType: Service["billingType"];
  priceInitial: string;
  priceBargain: string;
  recurrencePriceInitial: string;
  recurrencePriceBargain: string;
  installmentsMax: string;
  status: Service["status"];
};

const emptyForm = (): FormData => ({
  name: "",
  description: "",
  category: "",
  bu: "kora-corp",
  billingType: "projeto_unico",
  priceInitial: "",
  priceBargain: "",
  recurrencePriceInitial: "",
  recurrencePriceBargain: "",
  installmentsMax: "",
  status: "ativo",
});

function hasRecurrence(billingType: Service["billingType"]) {
  return billingType === "recorrencia" || billingType === "combo";
}

export function EmpresaServicos() {
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [selectedBU, setSelectedBU] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());

  const { data, isLoading } = useServices({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery || undefined,
    bu: selectedBU || undefined,
    status: selectedStatus || undefined,
  });

  const { addService, updateService, deleteService, isAdding, isUpdating, isDeleting } =
    useServiceMutations();

  const services = data?.services ?? [];
  const total = data?.total ?? 0;

  function openView(service: Service) {
    setViewingService(service);
    setIsViewOpen(true);
  }

  function openCreate() {
    setEditingService(null);
    setFormData(emptyForm());
    setIsDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description ?? "",
      category: service.category ?? "",
      bu: service.bu,
      billingType: service.billingType,
      priceInitial: service.priceInitial ?? "",
      priceBargain: service.priceBargain ?? "",
      recurrencePriceInitial: service.recurrencePriceInitial ?? "",
      recurrencePriceBargain: service.recurrencePriceBargain ?? "",
      installmentsMax: service.installmentsMax != null ? String(service.installmentsMax) : "",
      status: service.status,
    });
    setIsDialogOpen(true);
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setIsDeleteOpen(true);
  }

  async function handleSubmit() {
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category.trim() || undefined,
      bu: formData.bu,
      billingType: formData.billingType,
      priceInitial: formData.priceInitial || undefined,
      priceBargain: formData.priceBargain || undefined,
      recurrencePriceInitial: hasRecurrence(formData.billingType)
        ? formData.recurrencePriceInitial || undefined
        : undefined,
      recurrencePriceBargain: hasRecurrence(formData.billingType)
        ? formData.recurrencePriceBargain || undefined
        : undefined,
      installmentsMax: formData.installmentsMax ? parseInt(formData.installmentsMax) : undefined,
      status: formData.status,
    };

    if (editingService) {
      updateService(editingService.id, payload);
      setIsDialogOpen(false);
    } else {
      const result = await addService(payload);
      if (result) setIsDialogOpen(false);
    }
  }

  function handleDelete() {
    if (deletingId) {
      deleteService(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  }

  const isSaving = isAdding || isUpdating;

  return (
    <>
      <div className="space-y-5 animate-fade-in">
        {/* Actions header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Serviços & Preços</h2>
            <p className="text-sm text-muted-foreground">
              Catálogo interno de serviços e tabela de preços por vertente
              {total > 0 && (
                <span className="ml-2 font-medium text-foreground">{total} serviços</span>
              )}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <Select value={selectedBU || "all"} onValueChange={(v) => setSelectedBU(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44 bg-card border-border">
              <SelectValue placeholder="Vertente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as vertentes</SelectItem>
              {BU_LIST.map((cfg) => (
                <SelectItem key={cfg.id} value={cfg.id}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus || "all"} onValueChange={(v) => setSelectedStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-36 bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vertente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Preço Inicial</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Recorrência</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhum serviço encontrado.</p>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => openView(service)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{service.name}</span>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {service.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <BUBadge bu={service.bu} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {BILLING_TYPE_LABELS[service.billingType]}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground hidden sm:table-cell">
                      {service.priceInitial ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden lg:table-cell">
                      {service.recurrencePriceInitial ? `${service.recurrencePriceInitial}/mês` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          service.status === "ativo"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                        }
                      >
                        {STATUS_LABELS[service.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          { label: "Editar", icon: Edit, onClick: () => openEdit(service) },
                          {
                            label: "Excluir",
                            icon: Trash2,
                            onClick: () => confirmDelete(service.id),
                            variant: "destructive",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-foreground leading-tight">
                  {viewingService?.name}
                </DialogTitle>
                {viewingService?.category && (
                  <DialogDescription className="mt-0.5">
                    {viewingService.category}
                  </DialogDescription>
                )}
              </div>
              {viewingService && (
                <Badge
                  variant="outline"
                  className={
                    viewingService.status === "ativo"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shrink-0"
                      : "border-muted-foreground/30 bg-muted/30 text-muted-foreground shrink-0"
                  }
                >
                  {STATUS_LABELS[viewingService.status]}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {viewingService && (
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Vertente</p>
                  <BUBadge bu={viewingService.bu} />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Tipo de Cobrança</p>
                  <p className="text-sm font-medium text-foreground">{BILLING_TYPE_LABELS[viewingService.billingType]}</p>
                </div>
              </div>

              {viewingService.description && (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground leading-relaxed">{viewingService.description}</p>
                </div>
              )}

              {(viewingService.priceInitial || viewingService.priceBargain) && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {viewingService.billingType === "combo" ? "Setup / Valor Total" : "Precificação"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingService.priceInitial && (
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Preço Inicial</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{viewingService.priceInitial}</p>
                      </div>
                    )}
                    {viewingService.priceBargain && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                        <p className="text-[10px] text-amber-500/80 mb-0.5">Preço Barganha <span className="opacity-70">[Interno]</span></p>
                        <p className="text-sm font-mono font-semibold text-amber-500">{viewingService.priceBargain}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(viewingService.recurrencePriceInitial || viewingService.recurrencePriceBargain) && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recorrência Mensal</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingService.recurrencePriceInitial && (
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Recorrência Inicial</p>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {viewingService.recurrencePriceInitial}
                          <span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </p>
                      </div>
                    )}
                    {viewingService.recurrencePriceBargain && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                        <p className="text-[10px] text-amber-500/80 mb-0.5">Recorrência Barganha <span className="opacity-70">[Interno]</span></p>
                        <p className="text-sm font-mono font-semibold text-amber-500">
                          {viewingService.recurrencePriceBargain}
                          <span className="text-xs font-normal text-amber-500/60">/mês</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingService.installmentsMax && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Parcelamento máximo</p>
                    <p className="text-sm font-medium text-foreground">em até {viewingService.installmentsMax}x</p>
                  </div>
                </div>
              )}
            </DialogBody>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsViewOpen(false);
                if (viewingService) openEdit(viewingService);
              }}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Editar Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingService ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Automações Corporativas (Flow)"
                className="bg-input border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vertente *</Label>
                <BUSelect
                  value={formData.bu}
                  onChange={(bu) => setFormData((p) => ({ ...p, bu }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-type">Tipo de Cobrança</Label>
                <Select
                  value={formData.billingType}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, billingType: v as Service["billingType"] }))
                  }
                >
                  <SelectTrigger id="billing-type" className="w-full bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projeto_unico">Projeto Único</SelectItem>
                    <SelectItem value="recorrencia">Recorrência</SelectItem>
                    <SelectItem value="hora">Por Hora</SelectItem>
                    <SelectItem value="combo">Combo (Setup + Recorrência)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Ex: Automações, Dev Retainer..."
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, status: v as Service["status"] }))
                  }
                >
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Breve descrição do serviço..."
                rows={2}
                className="bg-input border-border resize-none"
              />
            </div>

            <Separator className="bg-border" />

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Preços de Setup / Valor Total
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price-initial">Preço Inicial (Ancoragem)</Label>
                  <CurrencyInput
                    id="price-initial"
                    value={formData.priceInitial}
                    onChange={(v) => setFormData((p) => ({ ...p, priceInitial: v }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price-bargain">
                    Preço Barganha{" "}
                    <span className="text-[10px] text-amber-500 font-normal">[Interno]</span>
                  </Label>
                  <CurrencyInput
                    id="price-bargain"
                    value={formData.priceBargain}
                    onChange={(v) => setFormData((p) => ({ ...p, priceBargain: v }))}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </div>

            {hasRecurrence(formData.billingType) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Recorrência Mensal
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rec-initial">Recorrência Inicial</Label>
                    <CurrencyInput
                      id="rec-initial"
                      value={formData.recurrencePriceInitial}
                      onChange={(v) => setFormData((p) => ({ ...p, recurrencePriceInitial: v }))}
                      placeholder="R$ 0,00/mês"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rec-bargain">
                      Recorrência Barganha{" "}
                      <span className="text-[10px] text-amber-500 font-normal">[Interno]</span>
                    </Label>
                    <CurrencyInput
                      id="rec-bargain"
                      value={formData.recurrencePriceBargain}
                      onChange={(v) => setFormData((p) => ({ ...p, recurrencePriceBargain: v }))}
                      placeholder="R$ 0,00/mês"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-w-[200px]">
              <Label htmlFor="installments">Parcelamento máximo (x vezes)</Label>
              <NumberInput
                id="installments"
                min={1}
                max={24}
                value={formData.installmentsMax}
                onChange={(e) => setFormData((p) => ({ ...p, installmentsMax: e.target.value }))}
                placeholder="Ex: 5"
              />
            </div>
          </DialogBody>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? "Salvando..." : editingService ? "Salvar Alterações" : "Criar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir serviço"
        description="Esta ação é irreversível. O serviço será removido permanentemente do catálogo."
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir"}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
