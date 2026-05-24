export type NotificationType =
  | "task_due"
  | "task_overdue"
  | "new_ticket"
  | "contract_pending"
  | "contract_expiring"
  | "client_anniversary"
  | "proposal_viewed"
  | "payment_received"
  | "password_expiry";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

export const notificationConfig: Record<NotificationType, { icon: string; color: string }> = {
  task_due: { icon: "Clock", color: "text-primary" },
  task_overdue: { icon: "AlertTriangle", color: "text-red-500" },
  new_ticket: { icon: "MessageSquare", color: "text-primary" },
  contract_pending: { icon: "FileSignature", color: "text-primary" },
  contract_expiring: { icon: "AlertCircle", color: "text-primary" },
  client_anniversary: { icon: "Cake", color: "text-pink-500" },
  proposal_viewed: { icon: "Eye", color: "text-muted-foreground" },
  payment_received: { icon: "DollarSign", color: "text-green-500" },
  password_expiry: { icon: "ShieldAlert", color: "text-amber-500" },
};
