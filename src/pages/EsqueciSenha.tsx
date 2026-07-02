import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/pages/Login';
import Silk from '@/components/Silk';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    // Sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail —
    // evita que a tela revele quais contas estão cadastradas na plataforma.
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute inset-0 z-0">
        <Silk color="#ff8800" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />
      </div>

      <div className="relative z-10 w-full md:w-[45%] md:min-w-[420px] bg-white rounded-r-3xl flex items-center justify-center p-10">
        <div className="w-full max-w-[460px]">
          <Logo />

          {submitted ? (
            <div>
              <div className="mb-7">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h1 className="text-lg font-semibold text-black">Verifique seu e-mail</h1>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Se este e-mail estiver cadastrado em nossa plataforma, você receberá em instantes
                  um link para redefinir sua senha.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full h-11 flex items-center justify-center border border-gray-300 rounded-xl text-sm font-medium text-black hover:bg-gray-50 transition-all"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-7">
                <h1 className="text-lg font-semibold text-black">Esqueceu sua senha?</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full h-11 bg-[#ff8800] text-white rounded-xl text-sm font-medium hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : 'Enviar link de redefinição'}
                </button>

                <Link
                  to="/login"
                  className="block text-center text-sm text-gray-500 hover:text-[#ff8800] transition-colors"
                >
                  Voltar para o login
                </Link>
              </form>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center select-none">Acesso restrito · Kora Platform</p>
        </div>
      </div>
    </div>
  );
}
