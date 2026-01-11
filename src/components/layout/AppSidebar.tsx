import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  FileSignature,
  BookOpen,
  HeadphonesIcon,
  Settings,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Propostas", href: "/propostas", icon: FileText },
  { name: "Contratos", href: "/contratos", icon: FileSignature },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen },
  { name: "Sustentação", href: "/sustentacao", icon: HeadphonesIcon },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-foreground text-lg tracking-tight">
                AgênciaIA
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/configuracoes"
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Settings className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                Configurações
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/configuracoes"
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </NavLink>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full hidden lg:flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", collapsed && "rotate-180")} />
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
