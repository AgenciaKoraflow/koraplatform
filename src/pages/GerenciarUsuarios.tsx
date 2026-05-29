import { useState, useEffect } from 'react';
import { UserPlus, User as UserIcon, Shield, Search, CheckCircle2, Copy, Check, Mail, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAllProfiles, useAdminUpdateUser, type Profile, type AdminUserUpdate } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';

// ── Invite dialog ─────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
}

function InviteDialog({ open, onClose }: InviteDialogProps) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setCreated(null);
    setCopied(false);
    onClose();
  };

  const handleCopy = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        body: JSON.stringify({ email, full_name: fullName }),
      });

      const body = await res.json();
      if (!res.ok) {
        console.error('admin-create-user response:', res.status, body);
        toast.error(body.error ?? 'Não foi possível criar o usuário.');
      } else {
        qc.invalidateQueries({ queryKey: ['profiles', 'all'] });
        setCreated({ name: fullName, email, password: body.temp_password });
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? 'Usuário cadastrado' : 'Cadastrar usuário'}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {created ? (
            <div className="space-y-5 pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="text-sm text-foreground font-medium">{created.name}</p>
                <p className="text-xs text-muted-foreground">{created.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Senha temporária</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 h-10 px-3 flex items-center border border-input rounded-xl text-sm font-mono bg-muted text-foreground tracking-wider select-all">
                    {created.password}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="h-10 w-10 flex items-center justify-center border border-input rounded-xl hover:bg-muted transition-all flex-shrink-0"
                    title="Copiar senha"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Entregue esta senha ao usuário. Ele será obrigado a alterá-la no primeiro acesso.
                </p>
              </div>
            </div>
          ) : (
            <form id="invite-form" onSubmit={handleSubmit} noValidate className="space-y-5 pt-1">
              {/* Nome */}
              <div className="space-y-1.5">
                <label htmlFor="invite-name" className="block text-sm font-medium text-foreground">
                  Nome completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="invite-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                    className="w-full h-10 pl-9 pr-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    required
                    className="w-full h-10 pl-9 pr-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>
              </div>

            </form>
          )}
        </DialogBody>

        <DialogFooter>
          {created ? (
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 border border-input rounded-xl text-sm text-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
              <button
                form="invite-form"
                type="submit"
                disabled={!email || !fullName || submitting}
                className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Cadastrar usuário
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  profile: Profile | null;
  onClose: () => void;
}

function EditDialog({ profile, onClose }: EditDialogProps) {
  const { mutateAsync: updateUser } = useAdminUpdateUser();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [cargo, setCargo] = useState(profile?.cargo ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setCargo(profile.cargo ?? '');
    }
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    const updates: AdminUserUpdate = {};
    if (fullName !== profile.full_name) updates.full_name = fullName;
    if (cargo !== (profile.cargo ?? '')) updates.cargo = cargo || undefined;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    try {
      await updateUser({ userId: profile.id, updates });
      toast.success('Usuário atualizado!');
      onClose();
    } catch {
      toast.error('Não foi possível atualizar o usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!profile} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <form id="edit-user-form" onSubmit={handleSubmit} noValidate className="space-y-5 pt-1">
            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="edit-name" className="block text-sm font-medium text-foreground">
                Nome completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="edit-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                  className="w-full h-10 pl-9 pr-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>
            </div>

            {/* Cargo */}
            <div className="space-y-1.5">
              <label htmlFor="edit-cargo" className="block text-sm font-medium text-foreground">
                Cargo
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="edit-cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Analista, Gerente…"
                  className="w-full h-10 pl-9 pr-3 border border-input rounded-xl text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>
            </div>

          </form>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 border border-input rounded-xl text-sm text-foreground hover:bg-muted transition-all"
          >
            Cancelar
          </button>
          <button
            form="edit-user-form"
            type="submit"
            disabled={!fullName || submitting}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            )}
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

interface DeleteDialogProps {
  profile: Profile | null;
  onClose: () => void;
}

function DeleteDialog({ profile, onClose }: DeleteDialogProps) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!profile) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sessão inválida');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: profile.id }),
      });

      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Não foi possível excluir o usuário.');
      } else {
        qc.invalidateQueries({ queryKey: ['profiles', 'all'] });
        toast.success(`${profile.full_name ?? 'Usuário'} foi excluído.`);
        onClose();
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!profile} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir usuário</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-muted-foreground pt-1">
            Tem certeza que deseja excluir{' '}
            <span className="font-medium text-foreground">{profile?.full_name ?? 'este usuário'}</span>?
            Esta ação não pode ser desfeita.
          </p>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 border border-input rounded-xl text-sm text-foreground hover:bg-muted transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="h-9 px-4 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
            )}
            Excluir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GerenciarUsuarios() {
  const { user: currentUser } = useAuth();
  const { data: profiles = [], isLoading } = useAllProfiles();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      false
    );
  });

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
              <div className="grid grid-cols-[1fr_140px_72px] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Usuário</span>
                <span className="hidden sm:block">Membro desde</span>
                <span />
              </div>

              {filtered.map((profile) => {
                const isMe = profile.id === currentUser?.id;
                return (
                  <div
                    key={profile.id}
                    className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_72px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
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
                        {profile.email && (
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        )}
                        {profile.cargo && (
                          <p className="text-xs text-muted-foreground truncate">{profile.cargo}</p>
                        )}
                      </div>
                    </div>

                    {/* Created at */}
                    <div className="hidden sm:block">
                      <span className="text-xs text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTarget(profile)}
                        title="Editar usuário"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(profile)}
                          title="Excluir usuário"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <EditDialog
        profile={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <DeleteDialog
        profile={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
