import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserMinus, TrendingDown, RotateCcw, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllClients } from "@/hooks/useClients";
import { useClientMutations } from "@/hooks/mutations/useClientMutations";
import { formatValue } from "@/lib/mappers";
import { cn } from "@/lib/utils";
import type { ChurnStage, Client } from "@/types/data";

const churnStages: { id: ChurnStage; label: string; dot: string }[] = [
  { id: "novo", label: "Saiu", dot: "bg-red-500" },
  { id: "em_recuperacao", label: "Em recuperação", dot: "bg-amber-500" },
  { id: "recuperado", label: "Recuperado", dot: "bg-emerald-500" },
  { id: "perdido", label: "Perdido", dot: "bg-slate-400" },
];

function formatDay(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

/** Funil de Churn: clientes ativos que saíram, da saída até a recuperação ou perda definitiva. */
export default function Churn() {
  const navigate = useNavigate();
  const { data: clients = [] } = useAllClients();
  const { updateClient } = useClientMutations();

  // Recovered clients are active again, but stay here as history of the recovery
  const churned = useMemo(
    () => clients.filter((c) => c.stage === "churn" || c.churnStage === "recuperado"),
    [clients],
  );
  const byStage = (stage: ChurnStage) =>
    churned.filter((c) => (c.stage === "churn" ? (c.churnStage ?? "novo") : "recuperado") === stage);

  const activeCount = clients.filter((c) => c.stage === "cliente").length;
  const lost = churned.filter((c) => c.stage === "churn");
  const lostMrr = lost.reduce((sum, c) => sum + (c.churnMrr ?? 0), 0);
  const recovered = byStage("recuperado").length;
  const base = activeCount + lost.length;
  const churnRate = base > 0 ? Math.round((lost.length / base) * 100) : 0;

  const moveTo = async (client: Client, stage: ChurnStage) => {
    if (stage === "recuperado") {
      await updateClient(client.id, { stage: "cliente", churnStage: "recuperado" });
    } else {
      await updateClient(client.id, { stage: "churn", churnStage: stage });
    }
  };

  const kpis = [
    { label: "Clientes que saíram", value: lost.length, icon: UserMinus },
    { label: "Receita mensal perdida", value: formatValue(lostMrr), icon: TrendingDown },
    { label: "Recuperados", value: recovered, icon: RotateCcw },
    { label: "Taxa de churn", value: `${churnRate}%`, icon: Users },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          icon={UserMinus}
          title="Churn"
          subtitle="Clientes ativos que saíram — acompanhe a recuperação"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {churned.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <UserMinus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Nenhum cliente saiu</p>
              <p className="text-sm text-muted-foreground mt-1">
                Para registrar uma saída, abra o cliente em Clientes e use "Registrar saída".
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/clientes")}>
                Ir para Clientes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {churnStages.map((stage) => {
              const items = byStage(stage.id);
              return (
                <div key={stage.id} className="rounded-xl bg-muted/40 border border-border p-3">
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full", stage.dot)} />
                      <span className="text-sm font-semibold">{stage.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((client) => (
                      <Card key={client.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <ClientAvatar client={client} size="md" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{client.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                            </div>
                          </div>
                          {client.churnReason && (
                            <p className="text-xs text-muted-foreground line-clamp-3">{client.churnReason}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Saída: {formatDay(client.churnedAt)}</span>
                            {!!client.churnMrr && (
                              <span className="font-medium text-foreground">
                                {formatValue(client.churnMrr)}/mês
                              </span>
                            )}
                          </div>
                          <Select
                            value={stage.id}
                            onValueChange={(value) => moveTo(client, value as ChurnStage)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {churnStages.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.id === "recuperado" ? "Recuperado (volta a ser cliente)" : s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhum cliente</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
