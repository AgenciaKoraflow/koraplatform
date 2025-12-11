import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Revisar proposta comercial",
    project: "TechCorp - Chatbot",
    dueDate: "Hoje, 14:00",
    priority: "high",
  },
  {
    id: "2",
    title: "Deploy do modelo de IA",
    project: "InnovateLab - Automação",
    dueDate: "Hoje, 18:00",
    priority: "high",
  },
  {
    id: "3",
    title: "Reunião de alinhamento",
    project: "DataFlow - Analytics",
    dueDate: "Amanhã, 10:00",
    priority: "medium",
  },
  {
    id: "4",
    title: "Documentação técnica",
    project: "SmartRetail - Recomendação",
    dueDate: "Amanhã, 16:00",
    priority: "low",
  },
];

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

export function UpcomingTasks() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Próximas Tarefas</h3>
        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-2 h-2 rounded-full mt-2", priorityColors[task.priority])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{task.project}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{task.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
