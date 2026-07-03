import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { HookVault } from "./marketing/HookVault";
import { AnalyticsComplete as Analytics } from "./marketing/AnalyticsComplete";
import { Calendario } from "./marketing/Calendario";
import { fetchCompleteInstagramAnalytics } from "@/lib/instagram";

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
  const [profileImage, setProfileImage] = useState<string>("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23FF8800'/%3E%3Ctext x='50%25' y='50%25' font-size='80' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3EK%3C/text%3E%3C/svg%3E");

  const activeTab = searchParams.get("marketing") ?? "analytics";
  const isValidTab = MARKETING_TABS.some((tab) => tab.id === activeTab);
  const currentTab = isValidTab ? activeTab : "analytics";
  const CurrentComponent = pageComponents[currentTab] || Analytics;

  // Fetch Instagram profile picture
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const report = await fetchCompleteInstagramAnalytics();
        if (report?.account?.profilePictureUrl) {
          console.log("Profile picture loaded:", report.account.profilePictureUrl);
          setProfileImage(report.account.profilePictureUrl);
        }
      } catch (error) {
        console.log("Using default avatar:", error);
      }
    };

    fetchProfileImage();
  }, []);

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
      profileImage={profileImage}
      period="30D"
      tabs={MARKETING_TABS}
      activeTab={currentTab}
      onTabChange={handleTabChange}
    >
      <CurrentComponent workspaceId={workspaceId} />
    </MarketingLayout>
  );
}
