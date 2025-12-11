import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Users, MoreHorizontal, Clock } from "lucide-react";

interface Project {
  id: string;
  name: string;
  client: string;
  status: "planning" | "in_progress" | "review" | "completed";
  progress: number;
  dueDate: string;
  team: string[];
  tasks: { completed: number; total: number };
}

const projects: Project[] = [
  { id: "1", name: "Chatbot de Atendimento", client: "TechCorp", status: "in_progress", progress: 65, dueDate: "15 Jan 2025", team: ["CS", "AM", "PC"], tasks: { completed: 13, total: 20 } },
  { id: "2", name: "Sistema de Recomendação", client: "SmartRetail", status: "planning", progress: 15, dueDate: "28 Jan 2025", team: ["MO", "LM"], tasks: { completed: 3, total: 18 } },
  { id: "3", name: "Automação de Processos", client: "InnovateLab", status: "in_progress", progress: 40, dueDate: "10 Fev 2025", team: ["AS", "JF", "CS"], tasks: { completed: 8, total: 22 } },
  { id: "4", name: "Analytics Dashboard", client: "DataFlow Inc", status: "review", progress: 90, dueDate: "05 Jan 2025", team: ["PC", "AM"], tasks: { completed: 17, total: 19 } },
  { id: "5", name: "Modelo Preditivo", client: "FinTech Plus", status: "completed", progress: 100, dueDate: "20 Dez 2024", team: ["JF", "LM", "MO"], tasks: { completed: 15, total: 15 } },
  { id: "6", name: "Integração API IA", client: "AIStartup", status: "planning", progress: 5, dueDate: "20 Fev 2025", team: ["CS"], tasks: { completed: 1, total: 12 } },
];

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  in_progress: { label: "Em Andamento", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  review: { label: "Em Revisão", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-500", dot: "bg-green-500" },
};

export default function Projetos() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o progresso de todos os projetos</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = projects.filter(p => p.status === key).length;
            return (
              <button
                key={key}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "bg-secondary/50 hover:bg-secondary border border-border"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                <span className="text-foreground">{config.label}</span>
                <span className="text-muted-foreground">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    statusConfig[project.status].color
                  )}>
                    {statusConfig[project.status].label}
                  </span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{project.client}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{project.dueDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{project.tasks.completed}/{project.tasks.total}</span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-primary">{member}</span>
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
