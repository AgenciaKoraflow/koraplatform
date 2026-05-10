import { FileText, CheckCircle, Users, FileSignature, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "proposal" | "task" | "client" | "contract" | "message";
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "contract",
    title: "Contrato assinado",
    description: "TechCorp assinou o contrato de desenvolvimento de IA",
    time: "Há 2 horas",
  },
  {
    id: "2",
    type: "proposal",
    title: "Nova proposta enviada",
    description: "Proposta para automação enviada para InnovateLab",
    time: "Há 4 horas",
  },
  {
    id: "3",
    type: "task",
    title: "Tarefa concluída",
    description: "Setup do ambiente de desenvolvimento finalizado",
    time: "Há 5 horas",
  },
  {
    id: "4",
    type: "client",
    title: "Novo cliente adicionado",
    description: "DataFlow Inc. foi adicionado ao pipeline",
    time: "Há 6 horas",
  },
  {
    id: "5",
    type: "message",
    title: "Nova mensagem",
    description: "Feedback recebido do cliente sobre o chatbot",
    time: "Há 8 horas",
  },
];

const iconMap = {
  proposal: FileText,
  task: CheckCircle,
  client: Users,
  contract: FileSignature,
  message: MessageSquare,
};

const colorMap = {
  proposal: "bg-blue-500/10 text-blue-500",
  task: "bg-green-500/10 text-green-500",
  client: "bg-purple-500/10 text-purple-500",
  contract: "bg-primary/10 text-primary",
  message: "bg-amber-500/10 text-amber-500",
};

export function RecentActivity() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-6">Atividade Recente</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorMap[activity.type])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
