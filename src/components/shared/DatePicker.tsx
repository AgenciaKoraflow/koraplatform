import { useState } from "react";
import { format, startOfMonth, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => {
    // Initialize with selected date or current date
    if (value) {
      const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        return startOfMonth(new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, 1));
      }
    }
    return startOfMonth(new Date());
  });

  // Parse date from DD/MM/YYYY format or other formats
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    
    // Try ISO format or natural date
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    return undefined;
  };

  const selectedDate = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "dd/MM/yyyy"));
      setMonth(startOfMonth(date));
    }
    setOpen(false);
  };

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Month names in Portuguese
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(getYear(month), parseInt(monthIndex), 1);
    setMonth(startOfMonth(newMonth));
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year), getMonth(month), 1);
    setMonth(startOfMonth(newMonth));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-input border-border",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? value : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
        <div className="p-3 space-y-3 border-b border-border">
          <div className="flex gap-2">
            <Select
              value={getMonth(month).toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[140px] bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {months.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={getYear(month).toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px] bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
          locale={ptBR}
          className="pointer-events-auto"
          fixedWeeks
        />
      </PopoverContent>
    </Popover>
  );
}
