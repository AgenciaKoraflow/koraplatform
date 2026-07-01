import { useSearchParams } from "react-router-dom";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { VisaoGeral } from "./marketing/VisaoGeral";
import { HookVault } from "./marketing/HookVault";
import { AnalyticsComplete as Analytics } from "./marketing/AnalyticsComplete";
import { Calendario } from "./marketing/Calendario";
import { EmAlta } from "./marketing/EmAlta";

interface Props {
  workspaceId: string;
}

const MARKETING_TABS = [
  { id: "visao-geral", label: "VISÃO GERAL" },
  { id: "hook-vault", label: "HOOK" },
  { id: "analytics", label: "ANALYTICS" },
  { id: "calendario", label: "CALENDÁRIO" },
  { id: "trending", label: "TRENDING" },
];

const pageComponents: Record<string, React.ComponentType<{ workspaceId: string }>> = {
  "visao-geral": VisaoGeral,
  "hook-vault": HookVault,
  analytics: Analytics,
  calendario: Calendario,
  trending: EmAlta,
};

export function EmpresaMarketing({ workspaceId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("marketing") ?? "visao-geral";

  const isValidTab = MARKETING_TABS.some((tab) => tab.id === activeTab);
  const currentTab = isValidTab ? activeTab : "visao-geral";

  const CurrentComponent = pageComponents[currentTab] || VisaoGeral;

  function handleTabChange(tabId: string) {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("marketing", tabId);
    setSearchParams(newParams, { replace: true });
  }

  return (
    <MarketingLayout
      userName="Fabiano"
      userHandle="@fabianocarvalhojr"
      followers="287.4K"
      period="30D"
      tabs={MARKETING_TABS}
      activeTab={currentTab}
      onTabChange={handleTabChange}
    >
      <CurrentComponent workspaceId={workspaceId} />
    </MarketingLayout>
  );
}
