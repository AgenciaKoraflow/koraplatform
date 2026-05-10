import { BU, BU_LIST } from "@/types/bu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BUSelectProps {
  value?: BU;
  onChange: (bu: BU) => void;
  placeholder?: string;
  className?: string;
}

export function BUSelect({ value, onChange, placeholder = "Selecione uma BU", className }: BUSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BU)}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BU_LIST.map((cfg) => {
          const Icon = cfg.icon;
          return (
            <SelectItem key={cfg.id} value={cfg.id}>
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span className="text-xs text-muted-foreground">· {cfg.owner}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
