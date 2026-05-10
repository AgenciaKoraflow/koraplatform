import { cn } from "@/lib/utils";
import { LayoutGrid, List, Kanban, GanttChart, Table2 } from "lucide-react";

export type ViewMode = "grid" | "list" | "kanban" | "gantt" | "table";

interface ViewModeToggleProps {
  modes: ViewMode[];
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modeConfig: Record<ViewMode, { icon: typeof LayoutGrid; label: string }> = {
  grid: { icon: LayoutGrid, label: "Grade" },
  list: { icon: List, label: "Lista" },
  kanban: { icon: Kanban, label: "Kanban" },
  gantt: { icon: GanttChart, label: "Gantt" },
  table: { icon: Table2, label: "Tabela" },
};

export function ViewModeToggle({ modes, currentMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-input rounded-xl border border-border">
      {modes.map((mode) => {
        const { icon: Icon, label } = modeConfig[mode];
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
              currentMode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
