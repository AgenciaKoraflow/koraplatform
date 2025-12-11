export type NotificationType = 
  | "task_due" 
  | "task_overdue" 
  | "new_ticket" 
  | "contract_pending" 
  | "contract_expiring"
  | "client_anniversary"
  | "proposal_viewed"
  | "payment_received";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

export const notificationConfig: Record<NotificationType, { icon: string; color: string }> = {
  task_due: { icon: "Clock", color: "text-amber-500" },
  task_overdue: { icon: "AlertTriangle", color: "text-red-500" },
  new_ticket: { icon: "MessageSquare", color: "text-blue-500" },
  contract_pending: { icon: "FileSignature", color: "text-purple-500" },
  contract_expiring: { icon: "AlertCircle", color: "text-orange-500" },
  client_anniversary: { icon: "Cake", color: "text-pink-500" },
  proposal_viewed: { icon: "Eye", color: "text-cyan-500" },
  payment_received: { icon: "DollarSign", color: "text-green-500" },
};
