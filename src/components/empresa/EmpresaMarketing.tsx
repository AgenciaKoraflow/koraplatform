import { useSearchParams } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { id: "hook-vault", label: "Hook Vault" },
  { id: "analytics", label: "Analytics" },
  { id: "concorrentes", label: "Concorrentes" },
  { id: "agendador", label: "Agendador" },
  { id: "calendario", label: "Calendário" },
  { id: "em-alta", label: "Em Alta" },
];

export function EmpresaMarketing({ workspaceId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("marketing") ?? "hook-vault";

  const isValidTab = MARKETING_TABS.some((tab) => tab.id === activeTab);
  const currentTab = isValidTab ? activeTab : "hook-vault";

  function handleTabChange(value: string) {
    setSearchParams({ marketing: value }, { replace: true });
  }

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {MARKETING_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

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

        <TabsContent value="em-alta">
          <EmAlta workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
