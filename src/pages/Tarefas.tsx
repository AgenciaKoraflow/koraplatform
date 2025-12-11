import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Calendar, User, MoreHorizontal, CheckCircle2, Circle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
}

const tasks: Task[] = [
  { id: "1", title: "Implementar autenticação OAuth", description: "Adicionar login com Google e Microsoft", project: "TechCorp - Chatbot", assignee: "CS", status: "in_progress", priority: "high", dueDate: "Hoje" },
  { id: "2", title: "Design do dashboard", description: "Criar mockups para o painel de controle", project: "SmartRetail - Recomendação", assignee: "AM", status: "review", priority: "medium", dueDate: "Amanhã" },
  { id: "3", title: "Treinar modelo NLP", description: "Fine-tuning do modelo de linguagem", project: "InnovateLab - Automação", assignee: "PC", status: "todo", priority: "urgent", dueDate: "Hoje" },
  { id: "4", title: "Documentação da API", description: "Escrever docs no Swagger", project: "DataFlow - Analytics", assignee: "MO", status: "done", priority: "low", dueDate: "Ontem" },
  { id: "5", title: "Testes de integração", description: "Testar endpoints de IA", project: "TechCorp - Chatbot", assignee: "LM", status: "in_progress", priority: "high", dueDate: "Amanhã" },
  { id: "6", title: "Setup do ambiente", description: "Configurar Docker e CI/CD", project: "AIStartup - API", assignee: "JF", status: "todo", priority: "medium", dueDate: "3 dias" },
];

const statusColumns = [
  { id: "todo", label: "A Fazer", icon: Circle },
  { id: "in_progress", label: "Em Progresso", icon: Clock },
  { id: "review", label: "Em Revisão", icon: CheckCircle2 },
  { id: "done", label: "Concluído", icon: CheckCircle2 },
];

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-blue-500" },
  high: { label: "Alta", color: "bg-amber-500" },
  urgent: { label: "Urgente", color: "bg-red-500" },
};

export default function Tarefas() {
  const [searchQuery, setSearchQuery] = useState("");

  const getTasksByStatus = (status: string) => 
    tasks.filter(task => 
      task.status === status && 
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.project.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
            <p className="text-muted-foreground mt-1">Gerencie as tarefas de todos os projetos</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            const Icon = column.icon;
            
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Icon className={cn(
                    "w-4 h-4",
                    column.id === "done" ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <span className="font-semibold text-foreground">{column.label}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-3">
                  {columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer animate-scale-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Priority & Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                          <span className="text-xs text-muted-foreground">{priorityConfig[task.priority].label}</span>
                        </div>
                        <button className="p-1 rounded hover:bg-secondary transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

                      {/* Project Tag */}
                      <div className="mb-3">
                        <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                          {task.project}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Task Button */}
                  <button className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
