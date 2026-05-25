import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense, useEffect } from "react";
import { RouteErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/integrations/supabase/client";
import { clearAllToasts } from "@/hooks/use-toast";
import { ForcePasswordChangeModal } from "@/components/auth/ForcePasswordChangeModal";

// Separate importers so we can preload them without re-creating the lazy component
const importDashboard = () => import("./pages/Dashboard");
const importFunil = () => import("./pages/Funil");
const importClientesAtivos = () => import("./pages/ClientesAtivos");
const importProjetos = () => import("./pages/Projetos");
const importTarefas = () => import("./pages/Tarefas");
const importContratos = () => import("./pages/Contratos");
const importConhecimento = () => import("./pages/Conhecimento");
const importSustentacao = () => import("./pages/Sustentacao");
const importObservabilidade = () => import("./pages/Observabilidade");
const importFinanceiro = () => import("./pages/Financeiro");
const importIndicadores = () => import("./pages/Indicadores");
const importProcessos = () => import("./pages/Processos");
const importConfiguracoes = () => import("./pages/Configuracoes");
const importSignContract = () => import("./pages/SignContract");
const importNotFound = () => import("./pages/NotFound");
const importOKR = () => import("./pages/OKR");
const importBuscar = () => import("./pages/Buscar");
const importLogin = () => import("./pages/Login");
const importPerfilPessoal = () => import("./pages/PerfilPessoal");
const importGerenciarUsuarios = () => import("./pages/GerenciarUsuarios");

const Dashboard = lazy(importDashboard);
const Funil = lazy(importFunil);
const ClientesAtivos = lazy(importClientesAtivos);
const Projetos = lazy(importProjetos);
const Tarefas = lazy(importTarefas);
const Contratos = lazy(importContratos);
const Conhecimento = lazy(importConhecimento);
const Sustentacao = lazy(importSustentacao);
const Observabilidade = lazy(importObservabilidade);
const Financeiro = lazy(importFinanceiro);
const Indicadores = lazy(importIndicadores);
const Processos = lazy(importProcessos);
const Configuracoes = lazy(importConfiguracoes);
const SignContract = lazy(importSignContract);
const NotFound = lazy(importNotFound);
const OKR = lazy(importOKR);
const Buscar = lazy(importBuscar);
const Login = lazy(importLogin);
const PerfilPessoal = lazy(importPerfilPessoal);
const GerenciarUsuarios = lazy(importGerenciarUsuarios);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Routes accessible by Observers (limited access)
const OBSERVER_ALLOWED_PATHS = ["/tarefas", "/projetos", "/sustentacao", "/buscar", "/perfil"];

function CacheManager() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        qc.clear();
        clearAllToasts();
      }
    });
    return () => subscription.unsubscribe();
  }, [qc]);
  return null;
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

function usePreloadAllPages() {
  useEffect(() => {
    const preload = () => {
      importDashboard();
      importFunil();
      importClientesAtivos();
      importProjetos();
      importTarefas();
      importContratos();
      importConhecimento();
      importSustentacao();
      importObservabilidade();
      importFinanceiro();
      importIndicadores();
      importProcessos();
      importConfiguracoes();
      importSignContract();
      importNotFound();
      importOKR();
      importBuscar();
      importLogin();
      importPerfilPessoal();
      importGerenciarUsuarios();
    };

    if ("requestIdleCallback" in window) {
      const w = window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback: (id: number) => void;
      };
      const id = w.requestIdleCallback(preload, { timeout: 3000 });
      return () => w.cancelIdleCallback(id);
    } else {
      const id = setTimeout(preload, 2000);
      return () => clearTimeout(id);
    }
  }, []);
}

// Requires authentication + applies observer route restrictions
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Observer role: only allowed on specific paths
  if (profile?.role === "observador" && !OBSERVER_ALLOWED_PATHS.includes(location.pathname)) {
    return <Navigate to="/tarefas" replace />;
  }

  return <>{children}</>;
};

// Requires admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Renders the forced password change modal globally when first_login is true
function GlobalModals() {
  const { user, profile, profileLoading } = useAuth();
  if (!user || profileLoading) return null;
  if (profile?.first_login) return <ForcePasswordChangeModal />;
  return null;
}

function AppRoutes() {
  usePreloadAllPages();

  return (
    <RouteErrorBoundary>
      <GlobalModals />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/funil" element={<ProtectedRoute><Funil /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientesAtivos /></ProtectedRoute>} />
          <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
          <Route path="/tarefas" element={<ProtectedRoute><Tarefas /></ProtectedRoute>} />
          <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
          <Route path="/conhecimento" element={<ProtectedRoute><Conhecimento /></ProtectedRoute>} />
          <Route path="/sustentacao" element={<ProtectedRoute><Sustentacao /></ProtectedRoute>} />
          <Route path="/observabilidade" element={<ProtectedRoute><Observabilidade /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
          <Route path="/indicadores" element={<ProtectedRoute><Indicadores /></ProtectedRoute>} />
          <Route path="/processos" element={<ProtectedRoute><Processos /></ProtectedRoute>} />
          <Route path="/okr" element={<ProtectedRoute><OKR /></ProtectedRoute>} />
          <Route path="/buscar" element={<ProtectedRoute><Buscar /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPessoal /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<AdminRoute><Configuracoes /></AdminRoute>} />
          <Route path="/usuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign/:token" element={<SignContract />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <CacheManager />
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true }}>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
