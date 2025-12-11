import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Plus, FileSignature, CheckCircle, Clock, AlertCircle, MoreHorizontal, Send, Download, Eye } from "lucide-react";

interface Contract {
  id: string;
  title: string;
  client: string;
  value: string;
  status: "draft" | "pending_signature" | "signed" | "expired";
  type: "projeto" | "sustentacao" | "consultoria";
  createdAt: string;
  signedAt?: string;
  expiresAt: string;
}

const contracts: Contract[] = [
  { id: "1", title: "Contrato de Desenvolvimento - Chatbot", client: "TechCorp", value: "R$ 45.000", status: "signed", type: "projeto", createdAt: "01 Dez 2024", signedAt: "05 Dez 2024", expiresAt: "01 Dez 2025" },
  { id: "2", title: "Contrato de Sustentação Mensal", client: "SmartRetail", value: "R$ 8.000/mês", status: "signed", type: "sustentacao", createdAt: "15 Nov 2024", signedAt: "18 Nov 2024", expiresAt: "15 Nov 2025" },
  { id: "3", title: "Contrato de Automação", client: "InnovateLab", value: "R$ 80.000", status: "pending_signature", type: "projeto", createdAt: "18 Dez 2024", expiresAt: "18 Dez 2025" },
  { id: "4", title: "Contrato de Consultoria IA", client: "DataFlow Inc", value: "R$ 15.000", status: "draft", type: "consultoria", createdAt: "20 Dez 2024", expiresAt: "20 Dez 2025" },
  { id: "5", title: "Contrato de Desenvolvimento ML", client: "FinTech Plus", value: "R$ 95.000", status: "expired", type: "projeto", createdAt: "01 Jun 2024", signedAt: "05 Jun 2024", expiresAt: "01 Dez 2024" },
];

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: FileSignature },
  pending_signature: { label: "Aguardando Assinatura", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  signed: { label: "Assinado", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  expired: { label: "Expirado", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircle },
};

const typeConfig = {
  projeto: { label: "Projeto", color: "bg-primary/10 text-primary" },
  sustentacao: { label: "Sustentação", color: "bg-blue-500/10 text-blue-500" },
  consultoria: { label: "Consultoria", color: "bg-purple-500/10 text-purple-500" },
};

export default function Contratos() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground mt-1">Gerencie contratos e assinaturas digitais</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Contrato
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = contracts.filter(c => c.status === key).length;
            const Icon = config.icon;
            return (
              <div key={key} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color.split(" ")[0])}>
                    <Icon className={cn("w-5 h-5", config.color.split(" ")[1])} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contracts List */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contrato</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validade</th>
                <th className="text-right px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map((contract, index) => {
                const StatusIcon = statusConfig[contract.status].icon;
                
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-secondary/20 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileSignature className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{contract.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{contract.client}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        typeConfig[contract.type].color
                      )}>
                        {typeConfig[contract.type].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit border",
                        statusConfig[contract.status].color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[contract.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{contract.value}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{contract.expiresAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {contract.status === "pending_signature" && (
                          <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Enviar para assinatura">
                            <Send className="w-4 h-4 text-primary" />
                          </button>
                        )}
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Visualizar">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Download">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
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
