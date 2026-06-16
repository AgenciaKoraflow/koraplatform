import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const importIndicadores = () => import("./pages/Indicadores");
const importSignContract = () => import("./pages/SignContract");
const importNotFound = () => import("./pages/NotFound");
const importBuscar = () => import("./pages/Buscar");
const importLogin = () => import("./pages/Login");
const importPerfilPessoal = () => import("./pages/PerfilPessoal");
const importGerenciarUsuarios = () => import("./pages/GerenciarUsuarios");
const importEmpresa = () => import("./pages/Empresa");

const Dashboard = lazy(importDashboard);
const Funil = lazy(importFunil);
const ClientesAtivos = lazy(importClientesAtivos);
const Projetos = lazy(importProjetos);
const Tarefas = lazy(importTarefas);
const Contratos = lazy(importContratos);
const Conhecimento = lazy(importConhecimento);
const Indicadores = lazy(importIndicadores);
const SignContract = lazy(importSignContract);
const NotFound = lazy(importNotFound);
const Buscar = lazy(importBuscar);
const Login = lazy(importLogin);
const PerfilPessoal = lazy(importPerfilPessoal);
const GerenciarUsuarios = lazy(importGerenciarUsuarios);
const Empresa = lazy(importEmpresa);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // gcTime must outlive the persist window so data survives until rehydration
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "kora-query-cache",
});

function CacheManager() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        qc.clear();
        localStorage.removeItem("kora-query-cache");
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
      importIndicadores();
      importSignContract();
      importNotFound();
      importBuscar();
      importLogin();
      importPerfilPessoal();
      importGerenciarUsuarios();
      importEmpresa();
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
          <Route path="/financeiro" element={<Navigate to="/empresa" replace />} />
          <Route path="/servicos" element={<Navigate to="/empresa" replace />} />
          <Route path="/processos" element={<Navigate to="/empresa" replace />} />
          <Route path="/indicadores" element={<ProtectedRoute><Indicadores /></ProtectedRoute>} />
          <Route path="/okr" element={<Navigate to="/empresa" replace />} />
          <Route path="/buscar" element={<ProtectedRoute><Buscar /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPessoal /></ProtectedRoute>} />
          <Route path="/empresa" element={<ProtectedRoute><Empresa /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><GerenciarUsuarios /></ProtectedRoute>} />
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
    >
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
    </PersistQueryClientProvider>
  </ThemeProvider>
);

export default App;
