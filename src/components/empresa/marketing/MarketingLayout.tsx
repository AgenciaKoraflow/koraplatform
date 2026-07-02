import { useSearchParams } from "react-router-dom";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  userName: string;
  userHandle: string;
  followers: string;
  views?: string;
  profileImage?: string;
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
  views,
  profileImage,
  period,
  tabs,
  activeTab,
  onTabChange,
}: Props) {

  return (
    <div className="flex flex-col md:flex-row gap-0">
      {/* Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 bg-background border-b md:border-b-0 md:border-r border-border md:min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 space-y-3 md:space-y-6 md:sticky md:top-0">
          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 md:gap-3">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {!profileImage && <User className="w-4 h-4 md:w-6 md:h-6 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-foreground truncate">
                  {userName}
                </h3>
                <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                  {userHandle}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 truncate">
                  {followers} · {views && `${views} views · `}{period}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex md:flex-col gap-1.5 md:gap-2 overflow-x-auto md:overflow-visible -mx-3 px-3 md:mx-0 md:px-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "shrink-0 md:w-full text-left px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border-l-4 border-primary pl-2.5 md:pl-3"
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
      <div className="flex-1 p-3 sm:p-6 md:p-8 overflow-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
