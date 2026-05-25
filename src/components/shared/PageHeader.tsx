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
        "relative rounded-xl bg-card border border-border p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {kpi && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted">
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
