import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "error" | "info" | "pending";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
  error: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900",
  info: "bg-primary/15 text-primary dark:text-primary/80 border border-primary/20 dark:border-primary/40",
  pending: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-900",
};

const dotColors: Record<StatusVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-primary",
  pending: "bg-slate-500",
};

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl font-medium transition-all",
        statusStyles[status],
        sizeStyles[size],
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", dotColors[status])} />
      {label}
    </span>
  );
}
