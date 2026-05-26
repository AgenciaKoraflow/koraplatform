import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  step?: number | string;
  min?: number | string;
  max?: number | string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, step = 1, min, max, value, onChange, onKeyDown, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const toNum = (v: string | number | undefined) =>
      v !== undefined && v !== "" ? parseFloat(String(v)) : NaN;

    const handleStep = (direction: 1 | -1) => {
      const current = isNaN(toNum(value as string | number)) ? 0 : toNum(value as string | number);
      const numStep = isNaN(toNum(step)) ? 1 : toNum(step);
      const numMin = isNaN(toNum(min)) ? -Infinity : toNum(min);
      const numMax = isNaN(toNum(max)) ? Infinity : toNum(max);
      const raw = current + direction * numStep;
      // Round to avoid floating-point drift (e.g. 0.5 + 0.5 = 1.0000000001)
      const decimals = String(numStep).includes(".") ? String(numStep).split(".")[1].length : 0;
      const next = Math.min(numMax, Math.max(numMin, parseFloat(raw.toFixed(decimals))));
      onChange?.({
        target: { value: String(next) },
        currentTarget: { value: String(next) },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div
        className={cn(
          "flex h-9 rounded-xl border-2 border-border bg-background overflow-hidden ring-offset-background transition-shadow",
          isFocused && "ring-2 ring-ring ring-offset-1",
          className,
        )}
      >
        <input
          ref={ref}
          type="number"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          step={step}
          min={min}
          max={max}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 min-w-0 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...props}
        />
        <div className="flex flex-col border-l-2 border-border shrink-0 w-6">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(1)}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <div className="border-t border-border" />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(-1)}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
