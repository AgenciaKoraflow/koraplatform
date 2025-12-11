import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Plus, Search, MessageSquare, AlertCircle, CheckCircle, Clock, MoreHorizontal, User } from "lucide-react";
import { useState } from "react";

interface Ticket {
  id: string;
  title: string;
  client: string;
  project: string;
  status: "open" | "in_progress" | "waiting" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  lastUpdate: string;
  assignee: string;
}

const tickets: Ticket[] = [
  { id: "TK-001", title: "Erro no processamento de dados", client: "TechCorp", project: "Chatbot", status: "in_progress", priority: "high", createdAt: "Hoje, 09:30", lastUpdate: "Há 2h", assignee: "CS" },
  { id: "TK-002", title: "Lentidão no dashboard", client: "SmartRetail", project: "Recomendação", status: "open", priority: "medium", createdAt: "Hoje, 11:00", lastUpdate: "Há 30min", assignee: "AM" },
  { id: "TK-003", title: "Integração API falhando", client: "InnovateLab", project: "Automação", status: "waiting", priority: "critical", createdAt: "Ontem, 16:45", lastUpdate: "Há 5h", assignee: "PC" },
  { id: "TK-004", title: "Atualização de modelo ML", client: "DataFlow Inc", project: "Analytics", status: "resolved", priority: "low", createdAt: "Há 2 dias", lastUpdate: "Há 1 dia", assignee: "MO" },
  { id: "TK-005", title: "Bug na autenticação", client: "FinTech Plus", project: "Modelo Preditivo", status: "in_progress", priority: "high", createdAt: "Hoje, 08:15", lastUpdate: "Há 3h", assignee: "LM" },
  { id: "TK-006", title: "Requisição de nova feature", client: "TechCorp", project: "Chatbot", status: "open", priority: "low", createdAt: "Há 3 dias", lastUpdate: "Há 2 dias", assignee: "JF" },
];

const statusConfig = {
  open: { label: "Aberto", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: MessageSquare },
  in_progress: { label: "Em Andamento", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  waiting: { label: "Aguardando", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: AlertCircle },
  resolved: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-blue-500" },
  high: { label: "Alta", color: "bg-amber-500" },
  critical: { label: "Crítica", color: "bg-red-500" },
};

export default function Sustentacao() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sustentação</h1>
            <p className="text-muted-foreground mt-1">Suporte e acompanhamento pós-venda</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.waiting}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStatus(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                !selectedStatus
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
              )}
            >
              Todos
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedStatus === key
                    ? config.color
                    : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente / Projeto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Última Atualização</th>
                <th className="text-right px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((ticket, index) => {
                const StatusIcon = statusConfig[ticket.status].icon;
                
                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-secondary/20 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono text-xs text-primary mb-1">{ticket.id}</p>
                        <p className="font-medium text-foreground">{ticket.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{ticket.client}</p>
                      <p className="text-sm text-muted-foreground">{ticket.project}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit border",
                        statusConfig[ticket.status].color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[ticket.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", priorityConfig[ticket.priority].color)} />
                        <span className="text-sm text-foreground">{priorityConfig[ticket.priority].label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{ticket.assignee}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{ticket.lastUpdate}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
