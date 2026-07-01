import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "./marketing/VisaoGeral";
import { HookVault } from "./marketing/HookVault";
import { Analytics } from "./marketing/Analytics";
import { Concorrentes } from "./marketing/Concorrentes";
import { Agendador } from "./marketing/Agendador";
import { Calendario } from "./marketing/Calendario";
import { EmAlta } from "./marketing/EmAlta";

interface Props {
  workspaceId: string;
}

const MARKETING_TABS = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "hook-vault", label: "Hook Vault" },
  { id: "analytics", label: "Analytics" },
  { id: "concorrentes", label: "Concorrentes" },
  { id: "agendador", label: "Agendador" },
  { id: "calendario", label: "Calendário" },
  { id: "trending", label: "Trending" },
];

export function EmpresaMarketing({ workspaceId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("marketing") ?? "visao-geral";

  const isValidTab = MARKETING_TABS.some((tab) => tab.id === activeTab);
  const currentTab = isValidTab ? activeTab : "visao-geral";

  function handleTabChange(value: string) {
    setSearchParams({ marketing: value }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-transparent border-b border-border rounded-none p-0">
          {MARKETING_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao-geral">
          <VisaoGeral workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="hook-vault">
          <HookVault workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="concorrentes">
          <Concorrentes workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="agendador">
          <Agendador workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="calendario">
          <Calendario workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="trending">
          <EmAlta workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
