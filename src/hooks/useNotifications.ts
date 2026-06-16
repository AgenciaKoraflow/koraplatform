import { useState, useEffect, useCallback, useMemo } from "react";
import { Notification } from "@/types/notifications";
import { useAllTasks } from "@/hooks/useTasks";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { useInternalWorkspace } from "@/hooks/useInternalWorkspace";
import { useInternalTasks } from "@/hooks/useInternalTasks";
import { parseISO, isPast, differenceInDays, isToday } from "date-fns";
import { Client } from "@/types/data";

type RequiredField = { field: keyof Client; label: string };

const REQUIRED_FIELDS: Record<string, RequiredField[]> = {
  cliente: [
    { field: "email", label: "e-mail" },
    { field: "phone", label: "telefone" },
    { field: "head", label: "responsável" },
    { field: "anniversary", label: "aniversário do contrato" },
    { field: "bu", label: "unidade de negócio" },
    { field: "value", label: "valor do contrato" },
  ],
  negociacao: [
    { field: "email", label: "e-mail" },
    { field: "briefing", label: "briefing" },
    { field: "head", label: "responsável" },
  ],
  proposta: [
    { field: "email", label: "e-mail" },
    { field: "briefing", label: "briefing" },
  ],
};

const HIGH_PRIORITY_FIELDS = new Set<keyof Client>(["email", "head"]);

// Parse date helper
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    return parseISO(dateString);
  } catch {
    const ddmmyyyy = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    const parsed = new Date(dateString);
    return !isNaN(parsed.getTime()) ? parsed : null;
  }
};

function isAssignedToUser(assignees: string[], userName: string | null): boolean {
  if (!userName) return false;
  const lower = userName.toLowerCase().trim();
  return assignees.some((a) => a.trim().toLowerCase() === lower);
}

export function useNotifications() {
  const { data: tasks = [] } = useAllTasks();
  const { data: contracts = [] } = useAllContracts();
  const { data: clients = [] } = useAllClients();
  const { profile } = useAuth();
  const { data: workspace } = useInternalWorkspace();
  const { data: internalTasks = [] } = useInternalTasks(workspace?.id);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate notifications from real data
  const generatedNotifications = useMemo(() => {
    const notifs: Notification[] = [];
    const currentUserName = profile?.full_name ?? null;

    // Password expiry — pinned at the top if > 90 days without change
    if (profile?.password_changed_at) {
      const changedAt = parseISO(profile.password_changed_at);
      const daysSinceChange = differenceInDays(new Date(), changedAt);
      if (daysSinceChange >= 90) {
        notifs.push({
          id: "password-expiry",
          type: "password_expiry",
          title: "Recomendamos trocar sua senha",
          message: `Sua senha não é alterada há ${daysSinceChange} dias. Acesse seu perfil para atualizá-la.`,
          timestamp: changedAt,
          read: false,
          actionUrl: "/perfil",
          priority: daysSinceChange >= 180 ? "high" : "medium",
          metadata: { daysSinceChange },
        });
      }
    }

    // Overdue tasks — only for the current user's assigned tasks
    tasks.forEach((task) => {
      if (task.status !== "done" && isAssignedToUser(task.assignees, currentUserName)) {
        const dueDate = parseDate(task.dueDate);
        if (dueDate && isPast(dueDate) && !isToday(dueDate)) {
          const daysOverdue = differenceInDays(new Date(), dueDate);
          notifs.push({
            id: `task-overdue-${task.id}`,
            type: "task_overdue",
            title: "Tarefa atrasada",
            message: `${task.title} está ${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"} atrasada`,
            timestamp: dueDate,
            read: false,
            actionUrl: `/tarefas?task=${task.id}`,
            priority: daysOverdue > 3 ? "critical" : "high",
            metadata: { taskId: task.id, title: task.title },
          });
        }
      }
    });

    // Tasks due today — only for the current user's assigned tasks
    tasks.forEach((task) => {
      if (task.status !== "done" && isAssignedToUser(task.assignees, currentUserName)) {
        const dueDate = parseDate(task.dueDate);
        if (dueDate && isToday(dueDate)) {
          notifs.push({
            id: `task-due-${task.id}`,
            type: "task_due",
            title: "Tarefa vence hoje",
            message: task.title,
            timestamp: dueDate,
            read: false,
            actionUrl: `/tarefas?task=${task.id}`,
            priority: task.priority === "high" ? "high" : "medium",
            metadata: { taskId: task.id, title: task.title },
          });
        }
      }
    });

    // Internal tasks — overdue
    internalTasks.forEach((task) => {
      if (task.status === "done") return;
      const isForCurrentUser =
        task.allInvolved || (currentUserName && task.assignedTo?.trim().toLowerCase() === currentUserName.toLowerCase().trim());
      if (!isForCurrentUser) return;
      const dueDate = task.dueDate ? parseDate(task.dueDate) : null;
      if (dueDate && isPast(dueDate) && !isToday(dueDate)) {
        const daysOverdue = differenceInDays(new Date(), dueDate);
        notifs.push({
          id: `internal-task-overdue-${task.id}`,
          type: "task_overdue",
          title: "Tarefa interna atrasada",
          message: `${task.title} está ${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"} atrasada`,
          timestamp: dueDate,
          read: false,
          actionUrl: `/empresa?tab=tarefas`,
          priority: daysOverdue > 3 ? "critical" : "high",
          metadata: { taskId: task.id, title: task.title, internal: true },
        });
      }
    });

    // Internal tasks — due today
    internalTasks.forEach((task) => {
      if (task.status === "done") return;
      const isForCurrentUser =
        task.allInvolved || (currentUserName && task.assignedTo?.trim().toLowerCase() === currentUserName.toLowerCase().trim());
      if (!isForCurrentUser) return;
      const dueDate = task.dueDate ? parseDate(task.dueDate) : null;
      if (dueDate && isToday(dueDate)) {
        notifs.push({
          id: `internal-task-due-${task.id}`,
          type: "task_due",
          title: "Tarefa interna vence hoje",
          message: task.title,
          timestamp: dueDate,
          read: false,
          actionUrl: `/empresa?tab=tarefas`,
          priority: task.priority === "high" ? "high" : "medium",
          metadata: { taskId: task.id, title: task.title, internal: true },
        });
      }
    });

    // Pending contracts
    contracts
      .filter((c) => c.status === "awaiting_client_signature" || c.status === "awaiting_koraflow_signature")
      .forEach((contract) => {
        const createdAt = parseDate(contract.createdAt);
        if (createdAt) {
          notifs.push({
            id: `contract-pending-${contract.id}`,
            type: "contract_pending",
            title: "Contrato aguardando assinatura",
            message: contract.title,
            timestamp: createdAt,
            read: false,
            actionUrl: `/contratos?contract=${contract.id}`,
            priority: "high",
            metadata: { contractId: contract.id, title: contract.title },
          });
        }
      });

    // Expiring contracts
    contracts
      .filter((c) => c.status === "signed")
      .forEach((contract) => {
        const expiresAt = parseDate(contract.expiresAt);
        if (expiresAt) {
          const daysUntilExpiry = differenceInDays(expiresAt, new Date());
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            notifs.push({
              id: `contract-expiring-${contract.id}`,
              type: "contract_expiring",
              title: "Contrato expirando",
              message: `${contract.title} expira em ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "dia" : "dias"}`,
              timestamp: expiresAt,
              read: false,
              actionUrl: `/contratos?contract=${contract.id}`,
              priority: daysUntilExpiry <= 7 ? "high" : "medium",
              metadata: { contractId: contract.id, daysUntilExpiry, title: contract.title },
            });
          }
        }
      });


    // Client anniversaries (if anniversary date exists)
    clients
      .filter((c) => c.stage === "cliente" && c.anniversary)
      .forEach((client) => {
        const anniversary = parseDate(client.anniversary!);
        if (anniversary) {
          const daysUntilAnniversary = differenceInDays(anniversary, new Date());
          if (daysUntilAnniversary === 0) {
            notifs.push({
              id: `client-anniversary-${client.id}`,
              type: "client_anniversary",
              title: "Aniversário de cliente",
              message: `${client.name} completa 1 ano como cliente hoje! 🎉`,
              timestamp: anniversary,
              read: false,
              actionUrl: `/clientes?client=${client.id}`,
              priority: "low",
              metadata: { clientId: client.id, name: client.name },
            });
          }
        }
      });

    // Clientes com informações incompletas
    clients
      .filter((c) => c.stage in REQUIRED_FIELDS)
      .forEach((client) => {
        const required = REQUIRED_FIELDS[client.stage];
        const missingFields = required.filter(({ field }) => {
          const val = client[field];
          if (Array.isArray(val)) return val.length === 0;
          return !val;
        });

        if (missingFields.length === 0) return;

        const hasHighPriority =
          client.stage === "cliente" &&
          missingFields.some(({ field }) => HIGH_PRIORITY_FIELDS.has(field));

        const priority = hasHighPriority
          ? "high"
          : client.stage === "cliente" || missingFields.some(({ field }) => field === "email")
          ? "medium"
          : "low";

        const fieldList = missingFields.map(({ label }) => label).join(", ");
        const clientName = client.name || client.company || "Cliente sem nome";

        notifs.push({
          id: `client-incomplete-${client.id}`,
          type: "client_incomplete",
          title: "Informações incompletas",
          message: `${clientName} — Faltam: ${fieldList}`,
          timestamp: new Date(),
          read: false,
          actionUrl: `/clientes?client=${client.id}`,
          priority,
          metadata: { clientId: client.id, missingFields: missingFields.map((f) => f.field) },
        });
      });

    // Sort by timestamp (most recent first) - create a copy to avoid mutating
    const sorted = [...notifs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Filter by user notification preferences (absent key = enabled by default)
    const notifPrefs = profile?.preferences?.notifications;
    if (!notifPrefs) return sorted;
    return sorted.filter((n) => notifPrefs[n.type] !== false);
  }, [tasks, contracts, clients, profile, internalTasks]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setNotifications(generatedNotifications);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [generatedNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
