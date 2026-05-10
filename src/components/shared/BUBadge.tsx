import { BU, BU_CONFIG } from "@/types/bu";
import { cn } from "@/lib/utils";

interface BUBadgeProps {
  bu?: BU;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function BUBadge({ bu, size = "sm", showLabel = true, className }: BUBadgeProps) {
  if (!bu) return null;
  const cfg = BU_CONFIG[bu];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border font-medium",
        cfg.badgeClass,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className,
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {showLabel && cfg.label}
    </span>
  );
}

export function BUDot({ bu, className }: { bu?: BU; className?: string }) {
  if (!bu) return null;
  const cfg = BU_CONFIG[bu];
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", cfg.dotClass, className)} />;
}
