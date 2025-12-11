import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Plus, FileText, Send, CheckCircle, XCircle, Clock, MoreHorizontal, Eye, Download, Copy } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  client: string;
  value: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
  services: string[];
}

const proposals: Proposal[] = [
  { id: "1", title: "Chatbot de Atendimento Premium", client: "TechCorp", value: "R$ 45.000", status: "accepted", createdAt: "10 Dez 2024", expiresAt: "10 Jan 2025", services: ["Chatbot", "Integração", "Treinamento"] },
  { id: "2", title: "Sistema de Recomendação IA", client: "SmartRetail", value: "R$ 120.000", status: "sent", createdAt: "15 Dez 2024", expiresAt: "15 Jan 2025", services: ["ML Model", "API", "Dashboard"] },
  { id: "3", title: "Automação de Processos", client: "InnovateLab", value: "R$ 80.000", status: "viewed", createdAt: "18 Dez 2024", expiresAt: "18 Jan 2025", services: ["RPA", "Integração", "Suporte"] },
  { id: "4", title: "Analytics Dashboard", client: "DataFlow Inc", value: "R$ 35.000", status: "draft", createdAt: "20 Dez 2024", expiresAt: "20 Jan 2025", services: ["Dashboard", "Relatórios"] },
  { id: "5", title: "Modelo Preditivo de Vendas", client: "FinTech Plus", value: "R$ 95.000", status: "rejected", createdAt: "05 Dez 2024", expiresAt: "05 Jan 2025", services: ["ML Model", "API", "Consultoria"] },
];

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500/10 text-blue-500", icon: Send },
  viewed: { label: "Visualizada", color: "bg-amber-500/10 text-amber-500", icon: Eye },
  accepted: { label: "Aceita", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  rejected: { label: "Recusada", color: "bg-red-500/10 text-red-500", icon: XCircle },
};

export default function Propostas() {
  const stats = {
    total: proposals.length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    pending: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    value: proposals.filter(p => p.status === "accepted").reduce((acc, p) => acc + parseInt(p.value.replace(/\D/g, "")), 0),
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas propostas comerciais</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Nova Proposta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total de Propostas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Aceitas</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{stats.accepted}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Valor Fechado</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ {stats.value.toLocaleString()}</p>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((proposal, index) => {
            const StatusIcon = statusConfig[proposal.status].icon;
            
            return (
              <div
                key={proposal.id}
                className="p-6 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        statusConfig[proposal.status].color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[proposal.status].label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-1">{proposal.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{proposal.client}</p>

                    <div className="flex flex-wrap gap-2">
                      {proposal.services.map((service) => (
                        <span
                          key={service}
                          className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{proposal.value}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      <span>Expira: {proposal.expiresAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Criada em {proposal.createdAt}</p>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Visualizar">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Duplicar">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Download">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
