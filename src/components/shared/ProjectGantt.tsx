import { useMemo, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Task, Project } from "@/types/data";
import { cn } from "@/lib/utils";
import { taskStatus } from "@/lib/colors";

// ─── date helpers ────────────────────────────────────────────────────────────

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<Task["status"], { label: string; bar: string; dot: string }> = {
  todo:          { label: "A Fazer",               bar: taskStatus.todo.dot,          dot: taskStatus.todo.dot },
  in_progress:   { label: "Em andamento",           bar: taskStatus.in_progress.dot,   dot: taskStatus.in_progress.dot },
  review:        { label: "Em Validação Interna",   bar: taskStatus.review.dot,        dot: taskStatus.review.dot },
  done:          { label: "Concluído",              bar: taskStatus.done.dot,          dot: taskStatus.done.dot },
  blocked:       { label: "Impedimento",            bar: taskStatus.blocked.dot,       dot: taskStatus.blocked.dot },
  client_review: { label: "Em cliente",             bar: taskStatus.client_review.dot, dot: taskStatus.client_review.dot },
};

const DAY_PX = 36; // px per day column

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  project: Project;
  tasks: Task[];
}

export function ProjectGantt({ project, tasks }: Props) {
  const todayRef = useRef<HTMLDivElement>(null);

  // Compute timeline bounds
  const { rangeStart, totalDays } = useMemo(() => {
    const projectStart = parseDate(project.createdAt ?? "") || new Date();
    const projectEnd = parseDate(project.dueDate) || addDays(projectStart, 30);

    const dates: Date[] = [projectStart, projectEnd];
    tasks.forEach(t => {
      const s = parseDate(t.createdAt ?? "");
      const e = parseDate(t.dueDate);
      if (s) dates.push(s);
      if (e) dates.push(e);
    });

    const min = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const max = startOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    const start = addDays(min, -2);
    const end = addDays(max, 4);

    return { rangeStart: start, rangeEnd: end, totalDays: Math.max(diffDays(start, end), 7) };
  }, [project, tasks]);

  // Scroll to today on mount
  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, []);

  const today = startOfDay(new Date());
  const todayOffset = diffDays(rangeStart, today);

  // Group months for header
  const months = useMemo(() => {
    const result: { label: string; startDay: number; days: number }[] = [];
    let day = 0;
    let current = new Date(rangeStart);
    while (day < totalDays) {
      const month = current.getMonth();
      const year = current.getFullYear();
      let count = 0;
      while (day + count < totalDays) {
        const d = addDays(rangeStart, day + count);
        if (d.getMonth() !== month || d.getFullYear() !== year) break;
        count++;
      }
      result.push({ label: `${MONTHS_PT[month]} ${year}`, startDay: day, days: count });
      day += count;
      current = addDays(rangeStart, day);
    }
    return result;
  }, [rangeStart, totalDays]);

  // Sort tasks: in_progress first, then by dueDate
  const sorted = useMemo(() => {
    const order: Record<Task["status"], number> = { in_progress: 0, client_review: 1, review: 2, blocked: 3, todo: 4, done: 5 };
    return [...tasks].sort((a, b) => {
      const so = order[a.status] - order[b.status];
      if (so !== 0) return so;
      return (parseDate(a.dueDate)?.getTime() ?? 0) - (parseDate(b.dueDate)?.getTime() ?? 0);
    });
  }, [tasks]);

  const totalWidth = totalDays * DAY_PX;

  function barStyle(task: Task) {
    const start = parseDate(task.createdAt ?? "") ?? rangeStart;
    const end = parseDate(task.dueDate) ?? addDays(start, 3);
    const left = Math.max(0, diffDays(rangeStart, startOfDay(start)));
    const width = Math.max(1, diffDays(startOfDay(start), startOfDay(end)));
    return { left: left * DAY_PX, width: width * DAY_PX };
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhuma tarefa encontrada neste projeto.
      </div>
    );
  }

  return (
    <div className="font-sans text-sm select-none">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-sm flex-shrink-0", v.bar)} />
            <span className="text-xs text-muted-foreground">{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-px h-4 bg-red-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">Hoje</span>
        </div>
      </div>

      {/* Gantt grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex">
          {/* Left: task names */}
          <div className="flex-shrink-0 w-48 border-r border-border bg-card z-10">
            {/* month header spacer */}
            <div className="h-8 border-b border-border bg-muted/40" />
            {/* day header spacer */}
            <div className="h-7 border-b border-border bg-muted/20" />
            {/* rows */}
            {sorted.map((task, i) => (
              <div
                key={task.id}
                className={cn(
                  "h-11 flex items-center px-3 border-b border-border/60 last:border-b-0 gap-2",
                  i % 2 === 0 ? "bg-card" : "bg-muted/10"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_CFG[task.status].dot)} />
                <span className="truncate text-xs font-medium text-foreground leading-tight">{task.title}</span>
              </div>
            ))}
          </div>

          {/* Right: scrollable timeline */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: "100%", position: "relative" }}>
              {/* Month header */}
              <div className="h-8 flex border-b border-border bg-muted/40 sticky top-0">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 flex items-center justify-center border-r border-border/60 last:border-r-0 text-xs font-semibold text-muted-foreground"
                    style={{ width: m.days * DAY_PX }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Day header */}
              <div className="h-7 flex border-b border-border bg-muted/20">
                {Array.from({ length: totalDays }, (_, i) => {
                  const d = addDays(rangeStart, i);
                  const isToday = i === todayOffset;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      ref={isToday ? todayRef : undefined}
                      className={cn(
                        "flex-shrink-0 flex items-center justify-center border-r border-border/30 last:border-r-0 text-[10px]",
                        isToday ? "bg-red-500/10 text-red-500 font-bold" : isWeekend ? "text-muted-foreground/50" : "text-muted-foreground"
                      )}
                      style={{ width: DAY_PX }}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Task rows */}
              {sorted.map((task, i) => {
                const { left, width } = barStyle(task);
                const isOverdue = !["done"].includes(task.status) && parseDate(task.dueDate) && parseDate(task.dueDate)! < today;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "h-11 flex items-center border-b border-border/60 last:border-b-0 relative",
                      i % 2 === 0 ? "bg-card" : "bg-muted/5"
                    )}
                  >
                    {/* vertical day grid lines */}
                    {Array.from({ length: totalDays }, (_, j) => {
                      const d = addDays(rangeStart, j);
                      const isWknd = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={j}
                          className={cn(
                            "absolute top-0 bottom-0 border-r border-border/20",
                            isWknd && "bg-muted/20"
                          )}
                          style={{ left: j * DAY_PX, width: DAY_PX }}
                        />
                      );
                    })}

                    {/* Today line */}
                    {todayOffset >= 0 && todayOffset < totalDays && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10 pointer-events-none"
                        style={{ left: todayOffset * DAY_PX + DAY_PX / 2 }}
                      />
                    )}

                    {/* Bar */}
                    <div
                      className={cn(
                        "absolute h-6 rounded-md flex items-center px-2 z-20 cursor-default group",
                        isOverdue ? "bg-red-500/80" : STATUS_CFG[task.status].bar,
                        "shadow-sm"
                      )}
                      style={{ left: left + 2, width: Math.max(width - 4, 8) }}
                      title={`${task.title} — ${task.dueDate}`}
                    >
                      {width >= 48 && (
                        <span className="text-[10px] font-medium text-white truncate leading-none">
                          {task.title}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:flex bg-popover border border-border rounded-lg shadow-lg p-2.5 z-30 min-w-[160px] flex-col gap-1 pointer-events-none">
                        <p className="font-semibold text-foreground text-xs leading-tight">{task.title}</p>
                        <p className="text-muted-foreground text-[10px]">Status: {STATUS_CFG[task.status].label}</p>
                        <p className="text-muted-foreground text-[10px]">Prazo: {task.dueDate}</p>
                        {task.assignees.length > 0 && (
                          <p className="text-muted-foreground text-[10px]">Resp.: {task.assignees.join(", ")}</p>
                        )}
                        {isOverdue && (
                          <p className="text-red-500 text-[10px] font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Atrasada
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
