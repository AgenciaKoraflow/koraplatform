import { Building2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternalWorkspace } from "@/hooks/useInternalWorkspace";
import { EmpresaGeral } from "@/components/empresa/EmpresaGeral";
import { EmpresaOKR } from "@/components/empresa/EmpresaOKR";
import { EmpresaFinanceiro } from "@/components/empresa/EmpresaFinanceiro";
import { EmpresaServicos } from "@/components/empresa/EmpresaServicos";
import { EmpresaProcessos } from "@/components/empresa/EmpresaProcessos";
import { EmpresaContratos } from "@/components/empresa/EmpresaContratos";
import { EmpresaSenhas } from "@/components/empresa/EmpresaSenhas";
import { InsightsManager } from "@/components/insights/InsightsManager";
import { EmpresaTarefas } from "@/components/empresa/EmpresaTarefas";
import { EmpresaDocumentos } from "@/components/empresa/EmpresaDocumentos";
import { EmpresaGantt } from "@/components/empresa/EmpresaGantt";

const VALID_TABS = ["geral", "okr", "financeiro", "servicos", "processos", "contratos", "senhas", "insights", "tarefas", "documentacao", "gantt"];

export default function Empresa() {
  const { data: workspace, isLoading } = useInternalWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = VALID_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "geral";

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          icon={Building2}
          title="Empresa"
          subtitle={workspace?.description ?? "Operação interna da empresa"}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Carregando workspace...
          </div>
        ) : !workspace ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Workspace interno não encontrado. Execute a migration do banco de dados.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="okr">OKR</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="processos">Processos</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="senhas">Senhas</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
              <TabsTrigger value="documentacao">Documentação</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
              <EmpresaGeral />
            </TabsContent>

            <TabsContent value="okr">
              <EmpresaOKR />
            </TabsContent>

            <TabsContent value="financeiro">
              <EmpresaFinanceiro />
            </TabsContent>

            <TabsContent value="servicos">
              <EmpresaServicos />
            </TabsContent>

            <TabsContent value="processos">
              <EmpresaProcessos />
            </TabsContent>

            <TabsContent value="contratos">
              <EmpresaContratos />
            </TabsContent>

            <TabsContent value="senhas">
              <EmpresaSenhas workspaceId={workspace.id} />
            </TabsContent>

            <TabsContent value="insights">
              <InsightsManager source="empresa" />
            </TabsContent>

            <TabsContent value="tarefas">
              <EmpresaTarefas workspaceId={workspace.id} />
            </TabsContent>

            <TabsContent value="documentacao">
              <EmpresaDocumentos workspaceId={workspace.id} />
            </TabsContent>

            <TabsContent value="gantt">
              <EmpresaGantt workspaceId={workspace.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
