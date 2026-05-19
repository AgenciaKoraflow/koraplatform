import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Copy, Send, Download } from "lucide-react";

interface ActionMenuItem {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  variant?: "default" | "destructive";
  show?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu = memo(function ActionMenu({ items }: ActionMenuProps) {
  const visibleItems = items.filter((item) => item.show !== false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-xl hover:bg-muted transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
        {visibleItems.map((item, index) => (
          <div key={item.label}>
            {index > 0 && item.variant === "destructive" && <DropdownMenuSeparator className="bg-border" />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={
                item.variant === "destructive"
                  ? "text-destructive focus:text-destructive focus:bg-destructive/10"
                  : "text-foreground focus:bg-muted"
              }
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export { Eye, Edit, Trash2, Copy, Send, Download };
