import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookOpen, LayoutGrid, Key, FileText, Link2, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConhecimentoGeral } from "@/components/conhecimento/ConhecimentoGeral";
import { ConhecimentoSenhas } from "@/components/conhecimento/ConhecimentoSenhas";
import { ConhecimentoDocumentos } from "@/components/conhecimento/ConhecimentoDocumentos";
import { ConhecimentoLinks } from "@/components/conhecimento/ConhecimentoLinks";
import { InsightsManager } from "@/components/insights/InsightsManager";

const VALID_TABS = ["geral", "senhas", "documentos", "links", "insights"];

export default function Conhecimento() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = VALID_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "geral";

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={BookOpen}
          title="Base de Conhecimento"
          subtitle="Senhas, documentos, links e insights dos clientes"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-proximity sm:overflow-visible">
            <TabsList className="w-max flex-nowrap gap-1">
              <TabsTrigger value="geral" className="shrink-0 snap-start gap-2">
                <LayoutGrid className="w-4 h-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="senhas" className="shrink-0 snap-start gap-2">
                <Key className="w-4 h-4" />
                Senhas
              </TabsTrigger>
              <TabsTrigger value="documentos" className="shrink-0 snap-start gap-2">
                <FileText className="w-4 h-4" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="links" className="shrink-0 snap-start gap-2">
                <Link2 className="w-4 h-4" />
                Links Importantes
              </TabsTrigger>
              <TabsTrigger value="insights" className="shrink-0 snap-start gap-2">
                <Lightbulb className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="geral" className="mt-6">
            <ConhecimentoGeral />
          </TabsContent>

          <TabsContent value="senhas" className="mt-6">
            <ConhecimentoSenhas />
          </TabsContent>

          <TabsContent value="documentos" className="mt-6">
            <ConhecimentoDocumentos onSaved={() => handleTabChange("geral")} />
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <ConhecimentoLinks />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsManager source="conhecimento" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
