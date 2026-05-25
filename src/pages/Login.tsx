import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoImage from '@/logo/kora-logo-preto.png';
import Silk from '@/components/Silk';

function Logo() {
  return (
    <div className="flex items-start gap-1 flex-col">
      <img src={logoImage} alt="KORA System" className="h-12 object-cover" />
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tracking-widest text-black">KORA</span>
        <span className="text-xs font-light text-gray-400 tracking-widest">SYSTEM</span>
      </div>
      <div></div>
    </div>
  );
}

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Background animado — tela inteira */}
      <div className="absolute inset-0 z-0">
        <Silk color="#ff8800" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />
      </div>

      {/* Painel esquerdo — formulário (sobre o background) */}
      <div className="relative z-10 w-full md:w-[45%] md:min-w-[420px] bg-white rounded-r-3xl flex items-center justify-center p-10">
        <div className="w-full max-w-[460px]">
          <Logo />

          <div>
            <div>
              <div className="mb-7">
                <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar</p>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-5">
                {/* Email */}
                <div>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-11 px-4 pr-12 border border-gray-300 rounded-xl text-sm text-black placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Lembrar-me + Esqueceu a senha */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Lembrar-me</span>
                  </label>
                </div>

                {/* Erro */}
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={submitting || !email || !password}
                  className="w-full h-11 bg-[#ff8800] text-white rounded-xl text-sm font-medium hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </span>
                  ) : 'Entrar'}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center select-none">Acesso restrito · Kora Platform</p>
        </div>
      </div>

    </div>
  );
}
