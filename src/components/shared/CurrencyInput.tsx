import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", className, id, disabled }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value || "");
    }
  }, [value, isFocused]);

  const parseUserInputToNumber = (inputValue: string): number | null => {
    if (!inputValue || inputValue.trim() === "") return null;

    // Remove currency symbols, spaces, and R$
    let cleaned = inputValue.replace(/[R$\s]/g, "").trim();
    
    if (!cleaned) return null;

    // Check if it has a comma (decimal separator in BR format)
    if (cleaned.includes(",")) {
      // Has decimal part: "4.000,50" or "4000,50"
      const [intPart, decPart = ""] = cleaned.split(",");
      
      // Remove thousand separators (dots) from integer part
      const intDigits = intPart.replace(/\./g, "").replace(/\D/g, "");
      
      // Get decimal digits (max 2)
      const decDigits = decPart.replace(/\D/g, "").slice(0, 2);
      
      if (!intDigits && !decDigits) return null;
      
      const integer = parseInt(intDigits || "0", 10);
      const decimal = parseInt(decDigits || "0", 10);
      
      const num = integer + decimal / 100;
      return Number.isFinite(num) && num >= 0 ? num : null;
    }

    // No comma: treat as integer value (e.g., "4000" => 4000.00)
    // Remove thousand separators (dots) and any non-digit
    const intDigits = cleaned.replace(/\./g, "").replace(/\D/g, "");
    
    if (!intDigits) return null;
    
    const intPart = parseInt(intDigits, 10);
    return Number.isFinite(intPart) && intPart >= 0 ? intPart : null;
  };

  const formatNumberToBRL = (num: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow user to type freely while focused
    // Only keep digits, dots (thousand separator), and comma (decimal separator)
    const cleaned = inputValue.replace(/[^\d,\.]/g, "");
    
    setDisplayValue(cleaned);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the value when user leaves the field
    if (displayValue && displayValue.trim() !== "") {
      const num = parseUserInputToNumber(displayValue);
      if (num !== null && num >= 0) {
        const formatted = formatNumberToBRL(num);
        setDisplayValue(formatted);
        onChange(formatted);
      } else {
        // If can't parse, clear it
        setDisplayValue("");
        onChange("");
      }
    } else {
      setDisplayValue("");
      onChange("");
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("bg-input border-border", className)}
      disabled={disabled}
    />
  );
}
