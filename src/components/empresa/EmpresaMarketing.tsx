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
      userName="KORAFLOW"
      userHandle="@koraflow.ia"
      followers="43"
      views="847"
      profileImage="https://graph.instagram.com/v18.0/27571261272563142/picture?height=256&width=256&access_token=IGAASrye7Q4e5BZAFpQeS1KNDFpU05vRlp1Y2lldzZAla3FmblI5cEsyZAUozcV82b2o2QnVCNzFhdTNIM3R0R0RjS2hlTDBkdWsxcTdoaERjZA0UxeG16RldfNkltX0o2OGxNV0NUaUQ3Y3VPQ1d2WXBpUXNqRF80ZAzBScmNwcU1MTQZDZD"
      period="30D"
      tabs={MARKETING_TABS}
      activeTab={currentTab}
      onTabChange={handleTabChange}
    >
      <CurrentComponent workspaceId={workspaceId} />
    </MarketingLayout>
  );
}
