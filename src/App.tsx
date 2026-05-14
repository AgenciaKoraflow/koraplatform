import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense, useEffect } from "react";

// Separate importers so we can preload them without re-creating the lazy component
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

// Preload all page chunks in the background after the app is idle.
// This ensures navigations after the first page load are instant — no Suspense flash.
function usePreloadAllPages() {
  useEffect(() => {
    const preload = () => {
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
    };

    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(preload, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(preload, 2000);
      return () => clearTimeout(id);
    }
  }, []);
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  usePreloadAllPages();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Funil /></ProtectedRoute>} />
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
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/buscar" element={<ProtectedRoute><Buscar /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign/:token" element={<SignContract />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true }}>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
