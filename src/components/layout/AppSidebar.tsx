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
  ChevronRight,
  Zap,
  DollarSign,
  BarChart3,
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
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    // No mobile, fecha o menu overlay
    if (onNavigate) {
      onNavigate();
    }
    // No desktop, não colapsa automaticamente ao clicar
  };

  const renderNavItem = (item: typeof navigation[0]) => {
    const isActive = location.pathname === item.href;
    
    const link = (
      <NavLink
        to={item.href}
        onClick={handleNavClick}
        className={cn(
          "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            {link}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-popover border-border font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.name}>{link}</div>;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "px-4"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
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
        <nav className={cn(
          "flex-1 py-4 space-y-1 overflow-y-auto",
          collapsed ? "px-2" : "px-3"
        )}>
          {navigation.map(renderNavItem)}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-sidebar-border py-3 space-y-1",
          collapsed ? "px-2" : "px-3"
        )}>
          {/* Configurações */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/configuracoes"
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === "/configuracoes"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Settings className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="bg-popover border-border font-medium">
                Configurações
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/configuracoes"
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === "/configuracoes"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </NavLink>
          )}

          {/* Toggle Button */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="bg-popover border-border font-medium">
                Expandir menu
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Recolher</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
