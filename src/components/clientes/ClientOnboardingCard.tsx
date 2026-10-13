import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, FolderPlus, MessageCircle, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/data";

interface ClientOnboardingCardProps {
  client: Client;
  projectCount: number;
  onSaveWhatsappGroup: (url: string) => Promise<unknown>;
}

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
  ) : (
    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
  );
}

/**
 * Entrada do cliente após o aceite: criar o grupo do WhatsApp e iniciar o projeto.
 */
export function ClientOnboardingCard({ client, projectCount, onSaveWhatsappGroup }: ClientOnboardingCardProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(client.whatsappGroupUrl ?? "");
  const [saving, setSaving] = useState(false);

  const hasGroup = !!client.whatsappGroupUrl;
  const hasProject = projectCount > 0;
  const done = hasGroup && hasProject;

  const save = async () => {
    setSaving(true);
    try {
      await onSaveWhatsappGroup(url.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn(done && "border-emerald-500/30")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Entrada do cliente
          <span className="text-xs font-normal text-muted-foreground">
            {Number(hasGroup) + Number(hasProject)} de 2 etapas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <StepIcon done={hasGroup} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              1. Criar o grupo do WhatsApp
            </p>
            {hasGroup && !editing ? (
              <div className="flex items-center gap-2 mt-1.5">
                <a
                  href={client.whatsappGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1 truncate"
                >
                  Abrir grupo
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setUrl(client.whatsappGroupUrl ?? "");
                    setEditing(true);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Alterar link"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole o link do grupo (https://chat.whatsapp.com/...)"
                  className="h-9"
                />
                <Button size="sm" onClick={save} disabled={!url.trim() || saving}>
                  Salvar
                </Button>
                {editing && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepIcon done={hasProject} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-muted-foreground" />
              2. Iniciar o projeto
            </p>
            {hasProject ? (
              <p className="text-sm text-muted-foreground mt-1">
                {projectCount} {projectCount === 1 ? "projeto criado" : "projetos criados"}
              </p>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="mt-1.5"
                onClick={() => navigate(`/projetos?novo=1&cliente=${client.id}`)}
              >
                Iniciar projeto
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
