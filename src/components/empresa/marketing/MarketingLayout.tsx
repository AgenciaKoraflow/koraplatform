import { useSearchParams } from "react-router-dom";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  userName: string;
  userHandle: string;
  followers: string;
  period: string;
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MarketingLayout({
  children,
  userName,
  userHandle,
  followers,
  period,
  tabs,
  activeTab,
  onTabChange,
}: Props) {

  return (
    <div className="flex gap-0">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 bg-background border-r border-border min-h-screen">
        <div className="p-6 space-y-6 sticky top-0">
          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {userHandle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {followers} · {period}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border-l-4 border-primary pl-3"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}
