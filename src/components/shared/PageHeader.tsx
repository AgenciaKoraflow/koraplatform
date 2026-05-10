import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderKpi {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "emerald" | "primary" | "amber" | "red" | "blue" | "purple";
}

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  kpi?: PageHeaderKpi;
  actions?: ReactNode;
  className?: string;
}

const accentMap: Record<NonNullable<PageHeaderKpi["accent"]>, string> = {
  emerald: "text-emerald-500",
  primary: "text-primary",
  amber: "text-amber-500",
  red: "text-red-500",
  blue: "text-primary",
  purple: "text-muted-foreground",
};

export function PageHeader({ icon: Icon, title, subtitle, kpi, actions, className }: PageHeaderProps) {
  const KpiIcon = kpi?.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6",
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {kpi && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
              {KpiIcon && <KpiIcon className={cn("w-4 h-4", accentMap[kpi.accent || "emerald"])} />}
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">{kpi.label}</p>
                <p className="font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
