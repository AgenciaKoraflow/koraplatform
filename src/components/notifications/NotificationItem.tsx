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
  X
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
};

const colorMap = {
  task_due: "bg-amber-500/10 text-amber-500",
  task_overdue: "bg-red-500/10 text-red-500",
  new_ticket: "bg-blue-500/10 text-blue-500",
  contract_pending: "bg-purple-500/10 text-purple-500",
  contract_expiring: "bg-orange-500/10 text-orange-500",
  client_anniversary: "bg-pink-500/10 text-pink-500",
  proposal_viewed: "bg-cyan-500/10 text-cyan-500",
  payment_received: "bg-green-500/10 text-green-500",
};

const priorityIndicator = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
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
        "relative flex items-start gap-3 p-4 cursor-pointer transition-all hover:bg-secondary/50 group",
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
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
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
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
