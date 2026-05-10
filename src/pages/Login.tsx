import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoImage from '@/logo/kora-logo.png';

function Logo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={logoImage} alt="KORA System" className="w-12 h-12 invert" />
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold tracking-widest text-black">KORA</span>
        <span className="text-xs font-light text-gray-400 tracking-widest">SYSTEM</span>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError('E-mail ou senha incorretos. Verifique suas credenciais.');
    setSubmitting(false);
  };

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-sm text-red-600">{msg}</p>
    </div>
  );

  const PrimaryButton = ({
    label,
    loadingLabel,
    disabled,
  }: { label: string; loadingLabel: string; disabled?: boolean }) => (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="w-full h-11 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 active:bg-gray-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {submitting
        ? <span className="flex items-center justify-center gap-2"><Spinner />{loadingLabel}</span>
        : label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="mb-10"><Logo /></div>

      <div className="w-full max-w-[400px] border border-gray-200 rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-black tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full h-11 px-4 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <ErrorBox msg={error} />}
            <PrimaryButton label="Entrar" loadingLabel="Entrando..." disabled={!email || !password} />
          </form>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 select-none">Acesso restrito · Kora Platform</p>
    </div>
  );
}
