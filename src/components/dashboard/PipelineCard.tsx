import { cn } from "@/lib/utils";

interface PipelineStage {
  name: string;
  count: number;
  value: string;
  color: string;
}

const stages: PipelineStage[] = [
  { name: "Prospecção", count: 12, value: "R$ 180k", color: "bg-blue-500" },
  { name: "Qualificação", count: 8, value: "R$ 240k", color: "bg-cyan-500" },
  { name: "Proposta", count: 5, value: "R$ 150k", color: "bg-primary" },
  { name: "Negociação", count: 3, value: "R$ 90k", color: "bg-amber-500" },
  { name: "Fechamento", count: 2, value: "R$ 60k", color: "bg-green-500" },
];

export function PipelineCard() {
  const totalCount = stages.reduce((acc, stage) => acc + stage.count, 0);

  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Pipeline de Vendas</h3>
        <span className="text-sm text-muted-foreground">{totalCount} oportunidades</span>
      </div>

      {/* Pipeline Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn(stage.color, "transition-all duration-500")}
            style={{ width: `${(stage.count / totalCount) * 100}%` }}
          />
        ))}
      </div>

      {/* Stages List */}
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", stage.color)} />
              <span className="text-sm font-medium text-foreground">{stage.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{stage.count} leads</span>
              <span className="text-sm font-semibold text-foreground w-20 text-right">{stage.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
