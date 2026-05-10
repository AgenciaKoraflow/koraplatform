import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/logo/kora-logo.png';

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getStrength(pwd: string): PasswordStrength | null {
  if (!pwd) return null;
  if (pwd.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= 12, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'medium';
  return 'strong';
}

const strengthConfig = {
  weak: { label: 'Fraca', color: 'bg-red-400', bars: 1 },
  medium: { label: 'Moderada', color: 'bg-yellow-400', bars: 2 },
  strong: { label: 'Forte', color: 'bg-green-500', bars: 3 },
};

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // If recovery event doesn't fire within 3s, mark link as invalid
    const timeout = setTimeout(() => {
      setInvalidLink(true);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Não foi possível redefinir sua senha. O link pode ter expirado. Solicite um novo.');
    } else {
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
    setSubmitting(false);
  };

  const strength = getStrength(password);
  const strengthInfo = strength ? strengthConfig[strength] : null;

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="mb-10 flex flex-col items-center gap-3">
          <img src={logoImage} alt="KORA System" className="w-14 h-14 invert" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-wide text-black">KORA</span>
            <span className="text-sm font-light text-gray-400 tracking-wider">System</span>
          </div>
        </div>
        <div className="w-full max-w-[400px] border border-gray-200 rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-black">Senha redefinida com sucesso!</h2>
          <p className="text-sm text-gray-500 mt-2">
            Redirecionando para o login...
          </p>
          <div className="mt-5 flex justify-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (invalidLink && !ready) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="mb-10 flex flex-col items-center gap-3">
          <img src={logoImage} alt="KORA System" className="w-14 h-14 invert" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-wide text-black">KORA</span>
            <span className="text-sm font-light text-gray-400 tracking-wider">System</span>
          </div>
        </div>
        <div className="w-full max-w-[400px] border border-gray-200 rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-black">Link inválido ou expirado</h2>
          <p className="text-sm text-gray-500 mt-2">
            Este link de redefinição não é mais válido. Solicite um novo na tela de login.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 w-full h-11 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-all"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="mb-10 flex flex-col items-center gap-3">
          <img src={logoImage} alt="KORA System" className="w-14 h-14 invert" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-wide text-black">KORA</span>
            <span className="text-sm font-light text-gray-400 tracking-wider">System</span>
          </div>
        </div>
        <div className="w-full max-w-[400px] border border-gray-200 rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8 text-center">
          <p className="text-sm text-gray-500">Verificando link de redefinição...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <img src={logoImage} alt="KORA System" className="w-14 h-14 invert" />
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold tracking-wide text-black">KORA</span>
          <span className="text-sm font-light text-gray-400 tracking-wider">System</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] border border-gray-200 rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-black tracking-tight">
            Defina sua nova senha
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie uma senha forte e segura para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-black mb-2">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {strengthInfo && (
              <div className="mt-2.5">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strengthInfo.bars ? strengthInfo.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Segurança: <span className="font-medium text-black">{strengthInfo.label}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-black mb-2">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                className={`w-full h-11 px-4 pr-12 border rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:ring-1 transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:border-black focus:ring-black'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-500 mt-1.5">As senhas não coincidem</p>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full h-11 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 active:bg-gray-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              'Redefinir senha'
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-gray-400 select-none">
        Acesso restrito · Kora Platform
      </p>
    </div>
  );
}
