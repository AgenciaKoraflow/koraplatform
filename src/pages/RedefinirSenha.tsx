import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordStrength, PASSWORD_RULES, callChangePassword } from '@/lib/password';
import { Logo } from '@/pages/Login';
import Silk from '@/components/Silk';

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
          className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
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

type Status = 'checking' | 'ready' | 'invalid';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');

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

  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        settled = true;
        setStatus('ready');
      }
    });

    // Fallback: cobre o caso de a sessão de recovery já ter sido processada
    // antes deste listener ser registrado.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled && session) {
        settled = true;
        setStatus('ready');
      }
    });

    // Sem sessão de recovery após alguns segundos → link inválido/expirado ou acesso direto.
    const timeout = setTimeout(() => {
      if (!settled) setStatus('invalid');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setStatus('invalid');
        setSubmitting(false);
        return;
      }

      const result = await callChangePassword(token, newPassword);
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível redefinir a senha. Tente novamente.');
        setSubmitting(false);
        return;
      }

      await supabase.auth.signOut();
      toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
      navigate('/login', { replace: true });
    } catch {
      setError('Erro inesperado. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute inset-0 z-0">
        <Silk color="#ff8800" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />
      </div>

      <div className="relative z-10 w-full md:w-[45%] md:min-w-[420px] bg-white rounded-r-3xl flex items-center justify-center p-10">
        <div className="w-full max-w-[460px]">
          <Logo />

          {status === 'checking' && (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {status === 'invalid' && (
            <div>
              <div className="mb-7">
                <h1 className="text-lg font-semibold text-black">Link inválido ou expirado</h1>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Este link de redefinição de senha não é mais válido. Solicite um novo link para continuar.
                </p>
              </div>
              <Link
                to="/esqueci-senha"
                className="w-full h-11 flex items-center justify-center bg-[#ff8800] text-white rounded-xl text-sm font-medium hover:bg-orange-600 active:bg-orange-700 transition-all"
              >
                Solicitar novo link
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <div>
              <div className="mb-7">
                <h1 className="text-lg font-semibold text-black">Defina sua nova senha</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Ela deve ter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.
                </p>
              </div>

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
                    <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
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
                  className="w-full h-11 bg-[#ff8800] text-white rounded-xl text-sm font-medium hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Redefinir senha
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center select-none">Acesso restrito · Kora Platform</p>
        </div>
      </div>
    </div>
  );
}
