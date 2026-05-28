import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Camera, Save, ShieldCheck, User, Sun, Moon,
  LayoutGrid, List, Kanban, Bell, Lock, Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfile';
import type { UserPreferences } from '@/hooks/useProfile';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import type { NotificationType } from '@/types/notifications';

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'preferencias', label: 'Preferências', icon: Settings },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'seguranca', label: 'Segurança', icon: Lock },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Notification labels ───────────────────────────────────────────────────────

const NOTIF_LABELS: Record<NotificationType, string> = {
  task_due: 'Tarefa vencendo hoje',
  task_overdue: 'Tarefa atrasada',
  new_ticket: 'Novo ticket recebido',
  contract_pending: 'Contrato pendente de assinatura',
  contract_expiring: 'Contrato próximo do vencimento',
  client_anniversary: 'Aniversário de cliente',
  proposal_viewed: 'Proposta visualizada',
  payment_received: 'Pagamento recebido',
  password_expiry: 'Senha prestes a expirar',
  client_incomplete: 'Cliente com cadastro incompleto',
};

const NOTIF_TYPES = Object.keys(NOTIF_LABELS) as NotificationType[];

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthMeta = [
  { label: 'Muito fraca', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Fraca', color: 'bg-orange-500', text: 'text-orange-500' },
  { label: 'Média', color: 'bg-yellow-500', text: 'text-yellow-600' },
  { label: 'Forte', color: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Muito forte', color: 'bg-green-500', text: 'text-green-600' },
];

const passwordRules = [
  { regex: /[A-Z]/, label: 'Uma letra maiúscula' },
  { regex: /[a-z]/, label: 'Uma letra minúscula' },
  { regex: /[0-9]/, label: 'Um número' },
  { regex: /[^A-Za-z0-9]/, label: 'Um caractere especial' },
];

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label, id, value, onChange, placeholder, disabled = false, type = 'text',
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full h-10 px-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PerfilPessoal() {
  const { user, profile, refreshProfile } = useAuth();
  const { mutateAsync: updateProfile, isPending: savingProfile } = useUpdateProfile(user?.id);
  const { avatarUrl, uploadAvatar, isUploading } = useUserAvatar();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const param = searchParams.get('tab');
    return (TABS.some(t => t.id === param) ? param : 'perfil') as TabId;
  });

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Personal info fields
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [description, setDescription] = useState(profile?.description ?? '');
  const [cargo, setCargo] = useState(profile?.cargo ?? '');
  const [vertente, setVertente] = useState(profile?.vertente ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const strengthScore = getStrength(newPassword);
  const isStrongEnough = strengthScore === 4;
  const passwordsMatch = newPassword === confirmPassword;

  const prefs: UserPreferences = profile?.preferences ?? {};

  const savePrefs = async (partial: Partial<UserPreferences>) => {
    try {
      await updateProfile({ preferences: { ...prefs, ...partial } });
      refreshProfile();
    } catch {
      toast.error('Não foi possível salvar a preferência.');
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ full_name: fullName, description, cargo, vertente, phone });
      toast.success('Perfil atualizado!');
      refreshProfile();
    } catch {
      toast.error('Não foi possível salvar o perfil. Tente novamente.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ avatar_url: url });
      refreshProfile();
      toast.success('Foto de perfil atualizada!');
    } catch {
      toast.error('Não foi possível atualizar a foto.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongEnough || !passwordsMatch) return;
    setChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sessão inválida');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Não foi possível alterar a senha.');
      } else {
        toast.success('Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
        refreshProfile();
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleNotification = (type: NotificationType, enabled: boolean) => {
    const current = prefs.notifications ?? {};
    savePrefs({ notifications: { ...current, [type]: enabled } });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (theme !== newTheme) toggleTheme();
    savePrefs({ theme: newTheme });
  };

  const handleTaskViewChange = (view: 'kanban' | 'list' | 'grid') => {
    savePrefs({ task_view: view });
  };

  // ── Role badge ────────────────────────────────────────────────────────────

  const roleBadge = {
    admin: { label: 'Admin', class: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    operador: { label: 'Operador', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    observador: { label: 'Observador', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };
  const badge = profile?.role ? roleBadge[profile.role] : roleBadge.observador;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={User}
          title="Meu Perfil"
          subtitle="Gerencie seu perfil, preferências e configurações da conta"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="flex-wrap h-auto gap-1">
            {TABS.map(({ id, label }) => (
              <TabsTrigger key={id} value={id}>{label}</TabsTrigger>
            ))}
          </TabsList>

          <div className="bg-card border border-border rounded-xl p-6 mt-2 min-h-[520px]">

            {/* ── Perfil ── */}
            <TabsContent value="perfil" className="mt-0 space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-5 pb-6 border-b border-border">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-transparent hover:ring-primary transition-all"
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <User className="w-8 h-8 text-white" />}
                  <span className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    {isUploading
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Camera className="w-5 h-5 text-white" />}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div>
                  <p className="font-medium text-foreground">{profile?.full_name ?? user?.email?.split('@')[0]}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badge.class}`}>
                    {badge.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG ou WebP · Máx. 5 MB</p>
                </div>
              </div>

              {/* Fields + vertente/description side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: main fields */}
                <div className="space-y-4">
                  <Field id="full-name" label="Nome completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />
                  <Field id="email" label="E-mail" type="email" value={user?.email ?? ''} onChange={() => {}} disabled />
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="phone" label="Telefone" value={phone} onChange={setPhone} placeholder="+55 11 99999-9999" />
                    <Field id="cargo" label="Cargo" value={cargo} onChange={setCargo} placeholder="Ex: Product Manager" />
                  </div>
                </div>

                {/* Right: vertente + description */}
                <div className="flex flex-col gap-4">
                  <Field id="vertente" label="Vertente" value={vertente} onChange={setVertente} placeholder="Ex: Kora Dev" />
                  <div className="flex flex-col flex-1">
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                    <textarea
                      id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Uma breve descrição sobre você..."
                      className="flex-1 w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none transition-all min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile} disabled={savingProfile}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {savingProfile
                    ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  Salvar alterações
                </button>
              </div>
            </TabsContent>

            {/* ── Preferências ── */}
            <TabsContent value="preferencias" className="mt-0 space-y-8">
              {/* Visualização de tarefas */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Visualização de Tarefas</p>
                <p className="text-sm text-muted-foreground mb-4">Escolha como as tarefas são exibidas por padrão.</p>
                <div className="flex gap-3">
                  {([
                    { value: 'kanban', label: 'Kanban', icon: Kanban },
                    { value: 'list', label: 'Lista', icon: List },
                    { value: 'grid', label: 'Grid', icon: LayoutGrid },
                  ] as const).map(({ value, label, icon: Icon }) => {
                    const active = (prefs.task_view ?? 'kanban') === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleTaskViewChange(value)}
                        className={cn(
                          'flex flex-col items-center gap-2 px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all',
                          active
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Aparência */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Aparência</p>
                <p className="text-sm text-muted-foreground mb-4">Escolha o tema da interface. A preferência é salva na sua conta.</p>
                <div className="flex gap-3">
                  {([
                    { value: 'light', label: 'Claro', icon: Sun },
                    { value: 'dark', label: 'Escuro', icon: Moon },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleThemeChange(value)}
                      className={cn(
                        'flex flex-col items-center gap-2 px-8 py-4 rounded-xl border-2 text-sm font-medium transition-all',
                        theme === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Notificações ── */}
            <TabsContent value="notificacoes" className="mt-0">
              <p className="text-sm font-semibold text-foreground mb-1">Preferências de Notificação</p>
              <p className="text-sm text-muted-foreground mb-5">Controle quais alertas aparecem no sino.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                {[NOTIF_TYPES.slice(0, 5), NOTIF_TYPES.slice(5)].map((col, ci) => (
                  <div key={ci} className="divide-y divide-border">
                    {col.map((type) => {
                      const enabled = prefs.notifications?.[type] !== false;
                      return (
                        <div key={type} className="flex items-center justify-between py-3">
                          <span className="text-sm text-foreground">{NOTIF_LABELS[type]}</span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => handleToggleNotification(type, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Segurança ── */}
            <TabsContent value="seguranca" className="mt-0">
              <p className="text-sm font-semibold text-foreground mb-1">Alterar Senha</p>
              <p className="text-sm text-muted-foreground mb-5">
                A senha deve ter no mínimo 8 caracteres com maiúsculas, minúsculas, números e um caractere especial.
              </p>
              <form onSubmit={handlePasswordChange} noValidate className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="new-pwd" className="block text-sm font-medium text-foreground mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input
                      id="new-pwd" type={showNew ? 'text' : 'password'} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Crie uma senha forte" autoComplete="new-password"
                      className="w-full h-10 px-3 pr-11 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strengthScore ? strengthMeta[strengthScore].color : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strengthMeta[strengthScore].text}`}>{strengthMeta[strengthScore].label}</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {passwordRules.map(({ regex, label }) => (
                          <li key={label} className={`flex items-center gap-1.5 ${regex.test(newPassword) ? 'text-green-600' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${regex.test(newPassword) ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirm-pwd" className="block text-sm font-medium text-foreground mb-1.5">Confirmar nova senha</label>
                  <div className="relative">
                    <input
                      id="confirm-pwd" type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha" autoComplete="new-password"
                      className="w-full h-10 px-3 pr-11 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!isStrongEnough || !passwordsMatch || !newPassword || changingPassword}
                    className="h-9 px-4 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {changingPassword
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <ShieldCheck className="w-4 h-4" />}
                    Alterar senha
                  </button>
                </div>
              </form>
            </TabsContent>


          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
