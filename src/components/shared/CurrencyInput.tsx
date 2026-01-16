import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", className, id }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const parseUserInputToNumber = (inputValue: string): number | null => {
    // Allow: digits, thousand separators (.), decimal separator (,)
    const cleaned = inputValue.replace(/[^\d,\.]/g, "");
    if (!cleaned) return null;

    // If user typed decimals, treat "," as decimal separator.
    if (cleaned.includes(",")) {
      const [intRaw, decRaw = ""] = cleaned.split(",");
      const intDigits = intRaw.replace(/\./g, "").replace(/\D/g, "");
      const decDigits = decRaw.replace(/\D/g, "").slice(0, 2);
      const decPadded = decDigits.padEnd(2, "0");

      const intPart = parseInt(intDigits || "0", 10);
      const decPart = parseInt(decPadded || "0", 10);
      const num = intPart + decPart / 100;
      return Number.isFinite(num) ? num : null;
    }

    // No decimals: interpret as whole reais (e.g. "4000" => 4000)
    const intDigits = cleaned.replace(/\./g, "").replace(/\D/g, "");
    const intPart = parseInt(intDigits, 10);
    return Number.isFinite(intPart) ? intPart : null;
  };

  const formatNumberToBRL = (num: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const num = parseUserInputToNumber(inputValue);

    if (num === null) {
      setDisplayValue("");
      onChange("");
      return;
    }

    const formatted = formatNumberToBRL(num);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("bg-secondary/50 border-border", className)}
    />
  );
}
