import { useSearchParams } from "react-router-dom";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { HookVault } from "./marketing/HookVault";
import { AnalyticsComplete as Analytics } from "./marketing/AnalyticsComplete";
import { Calendario } from "./marketing/Calendario";

interface Props {
  workspaceId: string;
}

const MARKETING_TABS = [
  { id: "analytics", label: "ANALYTICS" },
  { id: "hook-vault", label: "HOOK" },
  { id: "calendario", label: "CALENDÁRIO" },
];

const pageComponents: Record<string, React.ComponentType<{ workspaceId: string }>> = {
  "hook-vault": HookVault,
  analytics: Analytics,
  calendario: Calendario,
};

export function EmpresaMarketing({ workspaceId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("marketing") ?? "analytics";

  const isValidTab = MARKETING_TABS.some((tab) => tab.id === activeTab);
  const currentTab = isValidTab ? activeTab : "analytics";

  const CurrentComponent = pageComponents[currentTab] || Analytics;

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
