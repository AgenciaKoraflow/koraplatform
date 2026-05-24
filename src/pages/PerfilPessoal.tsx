import { useState, useRef } from 'react';
import { Eye, EyeOff, Camera, Save, ShieldCheck, User, Phone, Briefcase, FileText, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';

// ── Password strength ────────────────────────────────────────────────────────

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

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

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
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal info fields (controlled)
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [description, setDescription] = useState(profile?.description ?? '');
  const [cargo, setCargo] = useState(profile?.cargo ?? '');
  const [vertente, setVertente] = useState(profile?.vertente ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  // Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const strengthScore = getStrength(newPassword);
  const isStrongEnough = strengthScore === 4;
  const passwordsMatch = newPassword === confirmPassword;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ full_name: fullName, description, cargo, vertente, phone });
      toast.success('Perfil atualizado com sucesso!');
      refreshProfile();
    } catch {
      toast.error('Não foi possível salvar o perfil. Tente novamente.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5 MB.');
      e.target.value = '';
      return;
    }
    try {
      await uploadAvatar(file);
      toast.success('Foto de perfil atualizada!');
    } catch {
      toast.error('Não foi possível atualizar a foto.');
    }
    e.target.value = '';
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

  // ── Role badge ───────────────────────────────────────────────────────────────

  const roleBadge = {
    admin: { label: 'Admin', class: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    operador: { label: 'Operador', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    observador: { label: 'Observador', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };
  const badge = profile?.role ? roleBadge[profile.role] : roleBadge.observador;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações pessoais e segurança da conta.</p>
        </div>

        {/* Avatar section */}
        <Section title="Foto de Perfil">
          <div className="flex items-center gap-5">
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
        </Section>

        {/* Personal info */}
        <Section title="Informações Pessoais">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field
                  id="full-name" label="Nome completo"
                  value={fullName} onChange={setFullName} placeholder="Seu nome"
                />
              </div>
              <Field
                id="email" label="E-mail" type="email"
                value={user?.email ?? ''} onChange={() => {}} disabled
              />
              <Field
                id="phone" label="Telefone"
                value={phone} onChange={setPhone} placeholder="+55 11 99999-9999"
              />
              <Field
                id="cargo" label="Cargo"
                value={cargo} onChange={setCargo} placeholder="Ex: Product Manager"
              />
              <Field
                id="vertente" label="Vertente"
                value={vertente} onChange={setVertente} placeholder="Ex: Kora Dev"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição sobre você..."
                rows={3}
                className="w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none transition-all"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {savingProfile
                  ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />}
                Salvar alterações
              </button>
            </div>
          </div>
        </Section>

        {/* Security section */}
        <Section title="Segurança">
          <div id="seguranca">
            <p className="text-sm text-muted-foreground mb-5">
              Defina uma nova senha. Ela deve ter no mínimo 8 caracteres com maiúsculas, minúsculas, números e um caractere especial.
            </p>

            <form onSubmit={handlePasswordChange} noValidate className="space-y-4">
              {/* New password */}
              <div>
                <label htmlFor="new-pwd" className="block text-sm font-medium text-foreground mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="new-pwd"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    autoComplete="new-password"
                    className="w-full h-10 px-3 pr-11 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strengthScore ? strengthMeta[strengthScore].color : 'bg-muted'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthMeta[strengthScore].text}`}>
                      {strengthMeta[strengthScore].label}
                    </p>
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

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-pwd" className="block text-sm font-medium text-foreground mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    id="confirm-pwd"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
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

              <div className="flex justify-end">
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
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
