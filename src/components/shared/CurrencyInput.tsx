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

  const formatValue = (inputValue: string): string => {
    // Remove all non-numeric characters
    const numericOnly = inputValue.replace(/[^\d]/g, '');
    
    if (!numericOnly) return '';
    
    // Convert to number (divide by 100 for cents)
    const num = parseInt(numericOnly, 10) / 100;
    
    // Format as Brazilian currency
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatValue(inputValue);
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
