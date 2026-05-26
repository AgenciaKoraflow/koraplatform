import { cn } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  FileSignature,
  AlertCircle,
  Cake,
  Eye,
  DollarSign,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const iconMap = {
  task_due: Clock,
  task_overdue: AlertTriangle,
  new_ticket: MessageSquare,
  contract_pending: FileSignature,
  contract_expiring: AlertCircle,
  client_anniversary: Cake,
  proposal_viewed: Eye,
  payment_received: DollarSign,
  password_expiry: ShieldAlert,
  client_incomplete: UserX,
};

const colorMap = {
  task_due: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
  task_overdue: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900",
  new_ticket: "bg-primary/15 text-primary dark:text-primary/80 border border-primary/20 dark:border-primary",
  contract_pending: "bg-primary/15 text-primary dark:text-primary/80 border border-primary/20 dark:border-primary",
  contract_expiring: "bg-primary/15 text-primary dark:text-primary/80 border border-primary/20 dark:border-primary",
  client_anniversary: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-900",
  proposal_viewed: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-900",
  payment_received: "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900",
  password_expiry: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
  client_incomplete: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900",
};

const priorityIndicator = {
  low: "bg-slate-500",
  medium: "bg-primary",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Agora";
  if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)}h`;
  return `Há ${Math.floor(diffInSeconds / 86400)} dias`;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = iconMap[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 cursor-pointer transition-all hover:bg-input group",
        !notification.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* Priority indicator */}
      {!notification.read && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          priorityIndicator[notification.priority]
        )} />
      )}

      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        colorMap[notification.type]
      )}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium text-foreground",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
