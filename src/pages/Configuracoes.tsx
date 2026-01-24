import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { User, Building2, Bell, Shield, Palette, Database, Mail, CreditCard } from "lucide-react";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { useState } from "react";

const tabs = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "integrations", label: "Integrações", icon: Database },
  { id: "email", label: "Email", icon: Mail },
  { id: "billing", label: "Faturamento", icon: CreditCard },
];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie as configurações da sua agência</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Informações do Perfil</h2>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                          Alterar foto
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou GIF. Máximo 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                        <input
                          type="text"
                          defaultValue="Admin"
                          className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Sobrenome</label>
                        <input
                          type="text"
                          defaultValue="Usuario"
                          className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue="admin@agencia.ia"
                          className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Cargo</label>
                        <input
                          type="text"
                          defaultValue="CEO"
                          className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Cancelar
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Salvar alterações
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "company" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">Informações da Empresa</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        defaultValue="AgênciaIA"
                        className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                      <input
                        type="text"
                        defaultValue="00.000.000/0001-00"
                        className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                      <input
                        type="text"
                        defaultValue="(11) 99999-0000"
                        className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                      <input
                        type="text"
                        defaultValue="Av. Paulista, 1000 - São Paulo, SP"
                        className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Cancelar
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Salvar alterações
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <IntegrationsTab />
              )}

              {activeTab !== "profile" && activeTab !== "company" && activeTab !== "integrations" && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Configurações de {tabs.find(t => t.id === activeTab)?.label} em breve.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
