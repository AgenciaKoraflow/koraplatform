import { cn } from "@/lib/utils";
import { BU, BU_CONFIG } from "@/types/bu";

interface BUMultiSelectProps {
  value: BU[];
  onChange: (bus: BU[]) => void;
  label?: string;
  disabled?: boolean;
}

export function BUMultiSelect({ value, onChange, label = "BUs (Selecione uma ou mais)", disabled = false }: BUMultiSelectProps) {
  const BU_LIST: BU[] = ["kora-agents", "kora-dev", "kora-studio", "kora-corp"];

  const toggleBU = (bu: BU) => {
    const isSelected = value.includes(bu);
    onChange(
      isSelected
        ? value.filter(b => b !== bu)
        : [...value, bu]
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-foreground/90">{label}</label>
      <div className="flex flex-wrap gap-2">
        {BU_LIST.map((bu) => {
          const isSelected = value.includes(bu);
          const config = BU_CONFIG[bu];
          return (
            <button
              key={bu}
              type="button"
              disabled={disabled}
              onClick={() => toggleBU(bu)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-input text-foreground border-border hover:bg-muted",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", config.dotClass)} />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
