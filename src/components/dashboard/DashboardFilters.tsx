import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardFiltersProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const quickFilters = [
  { label: "Último mês", months: 1 },
  { label: "3 meses", months: 3 },
  { label: "6 meses", months: 6 },
  { label: "12 meses", months: 12 },
];

export function DashboardFilters({ startDate, endDate, onStartDateChange, onEndDateChange }: DashboardFiltersProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const applyQuickFilter = (months: number) => {
    const end = endOfMonth(new Date());
    const start = startOfMonth(subMonths(new Date(), months - 1));
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Período:</span>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.months}
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-secondary/50 border-border hover:bg-secondary"
            onClick={() => applyQuickFilter(filter.months)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {/* Start Date */}
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-secondary/50 border-border hover:bg-secondary"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => { if (date) onStartDateChange(date); setStartOpen(false); }}
              initialFocus
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">até</span>

        {/* End Date */}
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-secondary/50 border-border hover:bg-secondary"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => { if (date) onEndDateChange(date); setEndOpen(false); }}
              initialFocus
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
