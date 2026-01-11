import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = "Selecione", className }: MultiSelectProps) {
  const handleAdd = (newValue: string) => {
    if (newValue !== "none" && !value.includes(newValue)) {
      onChange([...value, newValue]);
    }
  };

  const handleRemove = (removeValue: string) => {
    onChange(value.filter(v => v !== removeValue));
  };

  const availableOptions = options.filter(opt => !value.includes(opt.value));

  return (
    <div className={cn("space-y-2", className)}>
      <Select value="none" onValueChange={handleAdd}>
        <SelectTrigger className="bg-secondary/50 border-border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="none">{placeholder}</SelectItem>
          {availableOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(v => {
            const option = options.find(opt => opt.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium"
              >
                {option?.label || v}
                <button
                  type="button"
                  onClick={() => handleRemove(v)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const TEAM_OPTIONS = [
  { value: "James", label: "James" },
  { value: "João", label: "João" },
  { value: "Edson", label: "Edson" },
];
