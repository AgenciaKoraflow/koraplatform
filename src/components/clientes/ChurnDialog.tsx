import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/types/data";

export interface ChurnData {
  reason: string;
  mrr: number;
  pauseOpenProjects: boolean;
}

interface ChurnDialogProps {
  client: Client | null;
  /** Receita recorrente mensal estimada do cliente, para pré-preencher. */
  suggestedMrr: number;
  openProjectCount: number;
  onClose: () => void;
  onConfirm: (data: ChurnData) => Promise<unknown>;
}

/** Registra a saída de um cliente ativo, que passa para o quadro de Churn. */
export function ChurnDialog({ client, suggestedMrr, openProjectCount, onClose, onConfirm }: ChurnDialogProps) {
  const [reason, setReason] = useState("");
  const [mrr, setMrr] = useState("");
  const [pauseOpenProjects, setPauseOpenProjects] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setReason("");
      setMrr(suggestedMrr > 0 ? String(suggestedMrr) : "");
      setPauseOpenProjects(true);
    }
  }, [client, suggestedMrr]);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        mrr: Number(mrr.replace(",", ".")) || 0,
        pauseOpenProjects,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Registrar saída de {client?.name}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O cliente sai da lista de ativos e entra no quadro de Churn. O histórico, os contratos e os
              projetos continuam guardados.
            </p>
            <div className="space-y-2">
              <Label htmlFor="churn-reason">Motivo da saída *</Label>
              <Textarea
                id="churn-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: encerrou a operação, trocou de fornecedor, corte de custos..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="churn-mrr">Receita mensal perdida (R$)</Label>
              <Input
                id="churn-mrr"
                inputMode="decimal"
                value={mrr}
                onChange={(e) => setMrr(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0,00"
              />
            </div>
            {openProjectCount > 0 && (
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseOpenProjects}
                  onChange={(e) => setPauseOpenProjects(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm">
                  Pausar {openProjectCount === 1 ? "o projeto em aberto" : `os ${openProjectCount} projetos em aberto`}{" "}
                  deste cliente
                </span>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={!reason.trim() || saving}>
              Registrar saída
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
