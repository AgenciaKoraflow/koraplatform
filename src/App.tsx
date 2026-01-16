import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import Tarefas from "./pages/Tarefas";
import Propostas from "./pages/Propostas";
import Contratos from "./pages/Contratos";
import Conhecimento from "./pages/Conhecimento";
import Sustentacao from "./pages/Sustentacao";
import Financeiro from "./pages/Financeiro";
import Indicadores from "./pages/Indicadores";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/propostas" element={<Propostas />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/conhecimento" element={<Conhecimento />} />
            <Route path="/sustentacao" element={<Sustentacao />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
