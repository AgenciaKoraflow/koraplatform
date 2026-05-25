import { useState } from 'react';
import { UserPlus, Mail, User as UserIcon, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAllProfiles, useUpdateUserRole, type Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';

// ── Role display helpers ──────────────────────────────────────────────────────

const ROLES: Profile['role'][] = ['admin', 'operador', 'observador'];

const roleMeta: Record<Profile['role'], { label: string; badge: string }> = {
  admin: {
    label: 'Admin',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  operador: {
    label: 'Operador',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  observador: {
    label: 'Observador',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

function RoleBadge({ role }: { role: Profile['role'] }) {
  const m = roleMeta[role];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>
  );
}

// ── Invite dialog ─────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
}

function InviteDialog({ open, onClose }: InviteDialogProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Profile['role']>('operador');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sessão inválida');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, full_name: fullName, role }),
      });

      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Não foi possível criar o usuário.');
      } else {
        toast.success(`Convite enviado para ${email}!`);
        qc.invalidateQueries({ queryKey: ['profiles', 'all'] });
        setEmail('');
        setFullName('');
        setRole('operador');
        onClose();
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
        </DialogHeader>

        <DialogBody>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          <div>
            <label htmlFor="invite-name" className="block text-sm font-medium text-foreground mb-1.5">Nome completo</label>
            <input
              id="invite-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome do usuário"
              required
              className="w-full h-10 px-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
              className="w-full h-10 px-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-foreground mb-1.5">Papel</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Profile['role'])}
              className="w-full h-10 px-3 border border-input rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleMeta[r].label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-input rounded-xl text-sm text-foreground hover:bg-muted transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!email || !fullName || submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Enviar convite
            </button>
          </div>
        </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GerenciarUsuarios() {
  const { user: currentUser } = useAuth();
  const { data: profiles = [], isLoading } = useAllProfiles();
  const { mutateAsync: updateRole } = useUpdateUserRole();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      false
    );
  });

  const handleRoleChange = async (userId: string, newRole: Profile['role']) => {
    if (userId === currentUser?.id) {
      toast.error('Não é possível alterar seu próprio papel.');
      return;
    }
    try {
      await updateRole({ userId, role: newRole });
      toast.success('Papel atualizado!');
    } catch {
      toast.error('Não foi possível atualizar o papel.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Gerenciar Usuários</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Convide novos membros e gerencie os papéis da equipe.
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Convidar usuário
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full h-10 pl-9 pr-4 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <UserIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_180px_160px] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Usuário</span>
                <span className="hidden sm:block">Papel</span>
                <span className="hidden sm:block">Membro desde</span>
              </div>

              {filtered.map((profile) => {
                const isMe = profile.id === currentUser?.id;
                return (
                  <div
                    key={profile.id}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_180px_160px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {profile.full_name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {profile.full_name ?? '—'}
                          </p>
                          {isMe && (
                            <span className="text-xs text-muted-foreground">(você)</span>
                          )}
                        </div>
                        {profile.cargo && (
                          <p className="text-xs text-muted-foreground truncate">{profile.cargo}</p>
                        )}
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="hidden sm:block">
                      {isMe ? (
                        <RoleBadge role={profile.role} />
                      ) : (
                        <select
                          value={profile.role}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value as Profile['role'])}
                          className="h-8 px-2.5 border border-input rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{roleMeta[r].label}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Created at */}
                    <div className="hidden sm:block">
                      <span className="text-xs text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Mobile: badge */}
                    <div className="sm:hidden">
                      <RoleBadge role={profile.role} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span><strong>Admin</strong> — acesso total à plataforma</span>
          </div>
          <span>·</span>
          <span><strong>Operador</strong> — cria tarefas e clientes, sem configurações</span>
          <span>·</span>
          <span><strong>Observador</strong> — somente leitura em páginas operacionais</span>
        </div>
      </div>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </AppLayout>
  );
}
