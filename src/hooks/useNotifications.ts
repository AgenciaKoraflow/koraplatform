import { useState, useEffect, useCallback, useMemo } from "react";
import { Notification } from "@/types/notifications";
import { useAllTasks } from "@/hooks/useTasks";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllTickets } from "@/hooks/useTickets";
import { useAllClients } from "@/hooks/useClients";
import { parseISO, isPast, differenceInDays, isToday } from "date-fns";

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

export function useNotifications() {
  const { data: tasks = [] } = useAllTasks();
  const { data: contracts = [] } = useAllContracts();
  const { data: tickets = [] } = useAllTickets();
  const { data: clients = [] } = useAllClients();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate notifications from real data
  const generatedNotifications = useMemo(() => {
    const notifs: Notification[] = [];

    // Overdue tasks
    tasks.forEach((task) => {
      if (task.status !== "done") {
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
            actionUrl: "/tarefas",
            priority: daysOverdue > 3 ? "critical" : "high",
            metadata: { taskId: task.id, title: task.title },
          });
        }
      }
    });

    // Tasks due today
    tasks.forEach((task) => {
      if (task.status !== "done") {
        const dueDate = parseDate(task.dueDate);
        if (dueDate && isToday(dueDate)) {
          notifs.push({
            id: `task-due-${task.id}`,
            type: "task_due",
            title: "Tarefa vence hoje",
            message: task.title,
            timestamp: dueDate,
            read: false,
            actionUrl: "/tarefas",
            priority: task.priority === "high" ? "high" : "medium",
            metadata: { taskId: task.id, title: task.title },
          });
        }
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
            actionUrl: "/contratos",
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
              actionUrl: "/contratos",
              priority: daysUntilExpiry <= 7 ? "high" : "medium",
              metadata: { contractId: contract.id, daysUntilExpiry, title: contract.title },
            });
          }
        }
      });

    // New tickets
    tickets
      .filter((t) => t.status === "open" || t.status === "in_progress")
      .forEach((ticket) => {
        const createdAt = parseDate(ticket.createdAt);
        if (createdAt) {
          const daysSinceCreation = differenceInDays(new Date(), createdAt);
          if (daysSinceCreation <= 7) {
            notifs.push({
              id: `ticket-${ticket.id}`,
              type: "new_ticket",
              title: "Novo ticket de suporte",
              message: ticket.title,
              timestamp: createdAt,
              read: false,
              actionUrl: "/sustentacao",
              priority: ticket.priority === "critical" ? "critical" : ticket.priority === "high" ? "high" : "medium",
              metadata: { ticketId: ticket.id, title: ticket.title },
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
              actionUrl: "/clientes",
              priority: "low",
              metadata: { clientId: client.id, name: client.name },
            });
          }
        }
      });

    // Sort by timestamp (most recent first) - create a copy to avoid mutating
    return [...notifs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [tasks, contracts, tickets, clients]);

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
