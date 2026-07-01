import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const weeks = [
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, 1],
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15],
];

const scheduledDays = {
  20: 2,
  23: 1,
  26: 3,
  28: 1,
  30: 2,
  2: 1,
  5: 2,
};

export function Calendario({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Calendário Editorial</h1>
          <p className="text-muted-foreground text-sm">MAIO 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-muted-foreground text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const scheduled = scheduledDays[day as keyof typeof scheduledDays];
                const isCurrentMonth = day >= 19 && day <= 31;

                return (
                  <div
                    key={`${weekIdx}-${day}`}
                    className={`p-2 rounded-lg text-center transition-all cursor-pointer ${
                      isCurrentMonth
                        ? scheduled
                          ? "bg-primary/10 border-2 border-primary hover:bg-primary/20"
                          : "bg-secondary/50 border border-border hover:bg-secondary"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">{day}</p>
                    {scheduled && (
                      <p className="text-primary text-xs font-bold mt-1">
                        {scheduled}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-border flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary" />
            <span className="text-sm text-muted-foreground">Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary/50 border border-border" />
            <span className="text-sm text-muted-foreground">Disponível</span>
          </div>
        </div>
      </div>
    </div>
  );
}
