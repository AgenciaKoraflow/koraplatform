import { Users, Heart, FileSignature, HeadphonesIcon, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllClients } from "@/hooks/useClients";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllTickets } from "@/hooks/useTickets";

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "primary" | "emerald" | "amber" | "blue";
}) {
  const accentClass = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  }[accent];

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function EmpresaGeral() {
  const { data: allClients = [] } = useAllClients();
  const { data: allContracts = [] } = useAllContracts();
  const { data: allTickets = [] } = useAllTickets();

  const { data: userCount = 0 } = useQuery({
    queryKey: ["profiles", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeClients = allClients.filter((c) => c.stage === "cliente").length;
  const activeContracts = allContracts.filter((c) => c.status === "signed").length;
  const openTickets = allTickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Usuários ativos" value={userCount} icon={Users} accent="primary" />
        <StatCard label="Clientes ativos" value={activeClients} icon={Heart} accent="emerald" />
        <StatCard label="Contratos ativos" value={activeContracts} icon={FileSignature} accent="blue" />
        <StatCard label="Tickets abertos" value={openTickets} icon={HeadphonesIcon} accent="amber" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 opacity-60">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="text-sm text-muted-foreground">Receita (em breve)</p>
        </div>
      </div>
    </div>
  );
}
