import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { User, Building2, Bell, Shield, Palette, Mail, CreditCard, Settings, Camera } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUserAvatar } from "@/hooks/useUserAvatar";

const tabs = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "email", label: "Email", icon: Mail },
  { id: "billing", label: "Faturamento", icon: CreditCard },
];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("profile");
  const { avatarUrl, userEmail, uploadAvatar, isUploading } = useUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5 MB.");
      e.target.value = "";
      return;
    }
    try {
      await uploadAvatar(file);
      toast.success("Foto de perfil atualizada!");
    } catch {
      toast.error("Não foi possível atualizar a foto. Tente novamente.");
    }
    e.target.value = "";
  };

  const emailPrefix = userEmail?.split("@")[0] ?? "";

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={Settings}
          title="Configurações"
          subtitle="Gerencie as configurações da sua agência"
        />

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
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div className="flex items-center gap-6 mb-6">
                      {/* Avatar preview with hover overlay */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 group
                          bg-gradient-to-br from-violet-500 to-purple-600
                          flex items-center justify-center text-white font-semibold text-xl
                          ring-2 ring-transparent hover:ring-primary transition-all"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{emailPrefix.charAt(0).toUpperCase() || "K"}</span>
                        )}
                        <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          {isUploading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-5 h-5 text-white" />
                          )}
                        </span>
                      </button>

                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? "Enviando…" : "Alterar foto"}
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP ou GIF. Máximo 5 MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                        <input
                          type="text"
                          defaultValue={emailPrefix.split(/[._-]/)[0]}
                          className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Sobrenome</label>
                        <input
                          type="text"
                          defaultValue=""
                          className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={userEmail ?? ""}
                          readOnly
                          className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none opacity-60 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Cargo</label>
                        <input
                          type="text"
                          defaultValue=""
                          className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                        defaultValue="Kora Platform"
                        className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                      <input
                        type="text"
                        defaultValue="00.000.000/0001-00"
                        className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                      <input
                        type="text"
                        defaultValue="(11) 99999-0000"
                        className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                      <input
                        type="text"
                        defaultValue="Av. Paulista, 1000 - São Paulo, SP"
                        className="w-full h-10 px-4 rounded-xl bg-background border-2 border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

              {activeTab !== "profile" && activeTab !== "company" && (
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
