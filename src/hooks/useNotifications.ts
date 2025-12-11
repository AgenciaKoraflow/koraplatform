import { useState, useEffect, useCallback } from "react";
import { Notification, NotificationType } from "@/types/notifications";

// Mock notifications - será substituído por dados do Supabase
const generateMockNotifications = (): Notification[] => [
  {
    id: "1",
    type: "task_overdue",
    title: "Tarefa atrasada",
    message: "Implementar autenticação OAuth está 2 dias atrasada",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    read: false,
    actionUrl: "/tarefas",
    priority: "critical",
    metadata: { taskId: "1", project: "TechCorp - Chatbot" }
  },
  {
    id: "2",
    type: "contract_pending",
    title: "Contrato aguardando assinatura",
    message: "InnovateLab ainda não assinou o contrato de Automação",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    actionUrl: "/contratos",
    priority: "high",
    metadata: { contractId: "3", client: "InnovateLab" }
  },
  {
    id: "3",
    type: "new_ticket",
    title: "Novo ticket de suporte",
    message: "TechCorp abriu ticket: Erro no processamento de dados",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    read: false,
    actionUrl: "/sustentacao",
    priority: "high",
    metadata: { ticketId: "TK-001" }
  },
  {
    id: "4",
    type: "task_due",
    title: "Tarefa vence hoje",
    message: "Deploy do modelo de IA vence às 18:00",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false,
    actionUrl: "/tarefas",
    priority: "medium",
    metadata: { taskId: "2" }
  },
  {
    id: "5",
    type: "client_anniversary",
    title: "Aniversário de cliente",
    message: "TechCorp completa 1 ano como cliente hoje! 🎉",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    actionUrl: "/clientes",
    priority: "low",
    metadata: { clientId: "1", years: 1 }
  },
  {
    id: "6",
    type: "proposal_viewed",
    title: "Proposta visualizada",
    message: "SmartRetail visualizou a proposta de Sistema de Recomendação",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    read: true,
    actionUrl: "/propostas",
    priority: "medium",
    metadata: { proposalId: "2" }
  },
  {
    id: "7",
    type: "contract_expiring",
    title: "Contrato expirando",
    message: "Contrato com FinTech Plus expira em 7 dias",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
    actionUrl: "/contratos",
    priority: "medium",
    metadata: { contractId: "5", daysUntilExpiry: 7 }
  },
  {
    id: "8",
    type: "payment_received",
    title: "Pagamento recebido",
    message: "DataFlow Inc pagou R$ 35.000 referente ao projeto Analytics",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    read: true,
    actionUrl: "/clientes",
    priority: "low",
    metadata: { amount: 35000, clientId: "3" }
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento das notificações
    const timer = setTimeout(() => {
      setNotifications(generateMockNotifications());
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Simula notificações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotifications: Notification[] = [
        {
          id: `new-${Date.now()}`,
          type: "new_ticket" as NotificationType,
          title: "Novo ticket recebido",
          message: "Cliente abriu novo chamado de suporte",
          timestamp: new Date(),
          read: false,
          actionUrl: "/sustentacao",
          priority: "high",
        },
        {
          id: `new-${Date.now()}`,
          type: "task_due" as NotificationType,
          title: "Lembrete de tarefa",
          message: "Reunião de alinhamento em 30 minutos",
          timestamp: new Date(),
          read: false,
          actionUrl: "/tarefas",
          priority: "medium",
        },
      ];

      // 20% de chance de receber uma notificação nova a cada 30 segundos
      if (Math.random() < 0.2) {
        const newNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
