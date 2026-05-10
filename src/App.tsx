import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Funil from "./pages/Funil";
import ClientesAtivos from "./pages/ClientesAtivos";
import Projetos from "./pages/Projetos";
import Tarefas from "./pages/Tarefas";
import Contratos from "./pages/Contratos";
import Conhecimento from "./pages/Conhecimento";
import Sustentacao from "./pages/Sustentacao";
import Observabilidade from "./pages/Observabilidade";
import Financeiro from "./pages/Financeiro";
import Indicadores from "./pages/Indicadores";
import Processos from "./pages/Processos";
import Configuracoes from "./pages/Configuracoes";
import SignContract from "./pages/SignContract";
import NotFound from "./pages/NotFound";
import OKR from "./pages/OKR";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/sign/:token" element={<SignContract />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
