import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, MoreHorizontal, Building2, Mail, Phone, Calendar } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "cliente";
  value: string;
  lastContact: string;
  avatar?: string;
}

const clients: Client[] = [
  { id: "1", name: "Carlos Silva", company: "TechCorp", email: "carlos@techcorp.com", phone: "(11) 99999-0001", stage: "cliente", value: "R$ 45.000", lastContact: "Há 2 dias" },
  { id: "2", name: "Ana Santos", company: "InnovateLab", email: "ana@innovatelab.com", phone: "(11) 99999-0002", stage: "proposta", value: "R$ 80.000", lastContact: "Há 1 dia" },
  { id: "3", name: "Pedro Costa", company: "DataFlow Inc", email: "pedro@dataflow.com", phone: "(11) 99999-0003", stage: "qualificacao", value: "R$ 35.000", lastContact: "Hoje" },
  { id: "4", name: "Maria Oliveira", company: "SmartRetail", email: "maria@smartretail.com", phone: "(11) 99999-0004", stage: "negociacao", value: "R$ 120.000", lastContact: "Há 3 dias" },
  { id: "5", name: "Lucas Mendes", company: "AIStartup", email: "lucas@aistartup.com", phone: "(11) 99999-0005", stage: "prospeccao", value: "R$ 25.000", lastContact: "Há 1 semana" },
  { id: "6", name: "Juliana Ferreira", company: "FinTech Plus", email: "juliana@fintechplus.com", phone: "(11) 99999-0006", stage: "cliente", value: "R$ 95.000", lastContact: "Há 4 dias" },
];

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  qualificacao: { label: "Qualificação", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  proposta: { label: "Proposta", color: "bg-primary/10 text-primary border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cliente: { label: "Cliente", color: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !selectedStage || client.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e prospects</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStage(selectedStage === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  selectedStage === key
                    ? config.color
                    : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Último Contato</th>
                <th className="text-right px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client, index) => (
                <tr
                  key={client.id}
                  className="hover:bg-secondary/20 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          {client.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      stageConfig[client.stage].color
                    )}>
                      {stageConfig[client.stage].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-foreground">{client.value}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {client.lastContact}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
