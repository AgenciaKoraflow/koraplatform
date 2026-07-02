import { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordStrength, PASSWORD_RULES, callChangePassword } from '@/lib/password';

function InputField({
  id, label, value, onChange, show, onToggle, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean;
  onToggle: () => void; placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          required
          className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function ForcePasswordChangeModal() {
  const { refreshProfile, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(newPassword);
  const isStrong = strength.score === 4;
  const matches = newPassword === confirm;
  const canSubmit = isStrong && matches && newPassword.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sessão inválida.');

      const result = await callChangePassword(token, newPassword);
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível alterar a senha. Tente novamente.');
        setSubmitting(false);
        return;
      }

      refreshProfile();
    } catch {
      setError('Erro inesperado. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Bem-vindo à plataforma</h2>
            <p className="text-white/60 text-sm">Crie sua senha de acesso para continuar</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <p className="text-sm text-gray-500">
            Por segurança, você precisa definir uma senha pessoal antes de continuar.
            Ela deve ter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <InputField
              id="new-password"
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder="Crie uma senha forte"
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < strength.score ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength.score <= 1 ? 'text-red-500' :
                  strength.score === 2 ? 'text-yellow-600' :
                  strength.score === 3 ? 'text-lime-600' : 'text-green-600'
                }`}>
                  {strength.label}
                </p>
                <ul className="text-xs text-gray-400 space-y-0.5 mt-1">
                  {PASSWORD_RULES.map(({ regex, label }) => (
                    <li key={label} className={`flex items-center gap-1.5 ${regex.test(newPassword) ? 'text-green-600' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${regex.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <InputField
              id="confirm-password"
              label="Confirmar senha"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              placeholder="Repita a nova senha"
            />

            {confirm.length > 0 && !matches && (
              <p className="text-xs text-red-500">As senhas não coincidem.</p>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 active:bg-gray-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Definir senha e entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
