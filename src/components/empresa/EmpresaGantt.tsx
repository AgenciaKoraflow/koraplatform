import { useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllClients } from "@/hooks/useClients";
import type { Project } from "@/types/data";

// ─── date helpers ─────────────────────────────────────────────────────────────

function parseDate(s?: string | null): Date | null {
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

type ProjectStatus = Project["status"];

const STATUS_CFG: Record<ProjectStatus, { label: string; bar: string; dot: string }> = {
  planning:    { label: "Planejamento",           bar: "bg-primary",       dot: "bg-primary" },
  in_progress: { label: "Em Andamento",           bar: "bg-blue-500",      dot: "bg-blue-500" },
  review:      { label: "Em Validação Interna",   bar: "bg-amber-500",     dot: "bg-amber-500" },
  completed:   { label: "Concluído",              bar: "bg-green-500",     dot: "bg-green-500" },
  on_hold:     { label: "Pausado",                bar: "bg-slate-400",     dot: "bg-slate-400" },
};

const ALL_STATUSES: ProjectStatus[] = ["planning", "in_progress", "review", "completed", "on_hold"];

const DAY_PX = 36;

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string;
}

export function EmpresaGantt({ workspaceId: _workspaceId }: Props) {
  const { data: allProjects = [], isLoading: loadingProjects } = useAllProjects();
  const { data: allClients = [], isLoading: loadingClients } = useAllClients();
  const todayRef = useRef<HTMLDivElement>(null);

  const [activeStatuses, setActiveStatuses] = useState<Set<ProjectStatus>>(
    new Set(ALL_STATUSES)
  );

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    allClients.forEach((c) => m.set(c.id, c.company || c.name));
    return m;
  }, [allClients]);

  const projects = useMemo(
    () => allProjects.filter((p) => activeStatuses.has(p.status)),
    [allProjects, activeStatuses]
  );

  function toggleStatus(s: ProjectStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size === 1) return prev;
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  }

  const { rangeStart, totalDays } = useMemo(() => {
    if (projects.length === 0) {
      const start = addDays(startOfDay(new Date()), -7);
      return { rangeStart: start, totalDays: 30 };
    }

    const dates: Date[] = [new Date()];
    projects.forEach((p) => {
      const s = parseDate(p.createdAt) ?? parseDate(p.recurrenceStartDate);
      const e = parseDate(p.dueDate);
      if (s) dates.push(s);
      if (e) dates.push(e);
    });

    const min = startOfDay(new Date(Math.min(...dates.map((d) => d.getTime()))));
    const max = startOfDay(new Date(Math.max(...dates.map((d) => d.getTime()))));
    const start = addDays(min, -2);
    const end = addDays(max, 4);

    return { rangeStart: start, totalDays: Math.max(diffDays(start, end), 14) };
  }, [projects]);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, []);

  const today = startOfDay(new Date());
  const todayOffset = diffDays(rangeStart, today);

  const months = useMemo(() => {
    const result: { label: string; startDay: number; days: number }[] = [];
    let day = 0;
    while (day < totalDays) {
      const d = addDays(rangeStart, day);
      const month = d.getMonth();
      const year = d.getFullYear();
      let count = 0;
      while (day + count < totalDays) {
        const cur = addDays(rangeStart, day + count);
        if (cur.getMonth() !== month || cur.getFullYear() !== year) break;
        count++;
      }
      result.push({ label: `${MONTHS_PT[month]} ${year}`, startDay: day, days: count });
      day += count;
    }
    return result;
  }, [rangeStart, totalDays]);

  const sorted = useMemo(() => {
    const order: Record<ProjectStatus, number> = {
      in_progress: 0, review: 1, planning: 2, on_hold: 3, completed: 4,
    };
    return [...projects].sort((a, b) => {
      const so = order[a.status] - order[b.status];
      if (so !== 0) return so;
      return (parseDate(a.dueDate)?.getTime() ?? 0) - (parseDate(b.dueDate)?.getTime() ?? 0);
    });
  }, [projects]);

  const totalWidth = totalDays * DAY_PX;

  function barStyle(project: Project) {
    const start =
      parseDate(project.createdAt) ??
      parseDate(project.recurrenceStartDate) ??
      addDays(parseDate(project.dueDate) ?? today, -14);
    const end = parseDate(project.dueDate) ?? addDays(startOfDay(start), 7);
    const left = Math.max(0, diffDays(rangeStart, startOfDay(start)));
    const width = Math.max(1, diffDays(startOfDay(start), startOfDay(end)));
    return { left: left * DAY_PX, width: width * DAY_PX };
  }

  const isLoading = loadingProjects || loadingClients;

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Carregando...</div>;
  }

  if (allProjects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhum projeto cadastrado para exibir no Gantt.
      </div>
    );
  }

  return (
    <div className="font-sans text-sm select-none space-y-4">
      {/* Filters + Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
        {ALL_STATUSES.map((s) => {
          const active = activeStatuses.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                active
                  ? "border-transparent bg-foreground/10 text-foreground"
                  : "border-border text-muted-foreground/50"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", active ? STATUS_CFG[s].dot : "bg-muted-foreground/30")} />
              {STATUS_CFG[s].label}
            </button>
          );
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-px h-4 bg-red-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">Hoje</span>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum projeto encontrado com os filtros selecionados.
        </div>
      )}

      {sorted.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex">
            {/* Left: project info */}
            <div className="flex-shrink-0 w-72 border-r border-border bg-card z-10">
              <div className="h-8 border-b border-border bg-muted/40" />
              <div className="h-7 border-b border-border bg-muted/20" />
              {sorted.map((project, i) => {
                const clientName = clientMap.get(project.clientId) ?? "—";
                return (
                  <div
                    key={project.id}
                    className={cn(
                      "h-14 flex items-center px-3 border-b border-border/60 last:border-b-0 gap-2",
                      i % 2 === 0 ? "bg-card" : "bg-muted/10"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5", STATUS_CFG[project.status].dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-foreground leading-tight">{project.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
                        <span className="font-medium">Cliente:</span> {clientName}
                      </p>
                      {project.head && (
                        <p className="truncate text-[10px] text-muted-foreground leading-tight">
                          <span className="font-medium">Resp.:</span> {project.head}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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
                          isToday
                            ? "bg-red-500/10 text-red-500 font-bold"
                            : isWeekend
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground"
                        )}
                        style={{ width: DAY_PX }}
                      >
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>

                {/* Project rows */}
                {sorted.map((project, i) => {
                  const { left, width } = barStyle(project);
                  const isOverdue =
                    project.status !== "completed" &&
                    !!project.dueDate &&
                    parseDate(project.dueDate)! < today;
                  const clientName = clientMap.get(project.clientId) ?? "—";
                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "h-14 flex items-center border-b border-border/60 last:border-b-0 relative",
                        i % 2 === 0 ? "bg-card" : "bg-muted/5"
                      )}
                    >
                      {/* Day grid lines */}
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
                          "absolute h-7 rounded-md flex items-center px-2 z-20 cursor-default group shadow-sm",
                          isOverdue ? "bg-red-500/80" : STATUS_CFG[project.status].bar
                        )}
                        style={{ left: left + 2, width: Math.max(width - 4, 8) }}
                        title={`${project.name} — ${project.dueDate || "sem prazo"}`}
                      >
                        {width >= 80 && (
                          <span className="text-[10px] font-medium text-white truncate leading-none">
                            {project.name}
                          </span>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:flex bg-popover border border-border rounded-lg shadow-lg p-2.5 z-30 min-w-[200px] flex-col gap-1 pointer-events-none">
                          <p className="font-semibold text-foreground text-xs leading-tight">{project.name}</p>
                          <p className="text-muted-foreground text-[10px]">
                            Status: {STATUS_CFG[project.status].label}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            Cliente: {clientName}
                          </p>
                          {project.head && (
                            <p className="text-muted-foreground text-[10px]">
                              Responsável: {project.head}
                            </p>
                          )}
                          {project.dueDate && (
                            <p className="text-muted-foreground text-[10px]">
                              Prazo: {project.dueDate}
                            </p>
                          )}
                          {isOverdue && (
                            <p className="text-red-500 text-[10px] font-medium">Atrasado</p>
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
      )}
    </div>
  );
}
