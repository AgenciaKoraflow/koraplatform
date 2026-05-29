import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Filter,
  Activity,
  Heart,
  FolderKanban,
  CheckSquare,
  FileSignature,
  BookOpen,
  HeadphonesIcon,
  LayoutDashboard,
  Users,
  Building2,
} from "lucide-react";
import { BU } from "@/types/bu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KoraSystemLogo, KoraSystemLogoIcon } from "@/components/shared/KoraSystemLogo";

type NavItem = {
  name: string;
  href: string;
  icon: typeof Filter;
  bu: BU;
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, bu: "kora-corp" },
  { name: "Funil", href: "/funil", icon: Filter, bu: "kora-agents" },
  { name: "Clientes", href: "/clientes", icon: Heart, bu: "kora-agents" },
  { name: "Contratos", href: "/contratos", icon: FileSignature, bu: "kora-agents" },
  { name: "Projetos", href: "/projetos", icon: FolderKanban, bu: "kora-dev" },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare, bu: "kora-dev" },
  { name: "Sustentação", href: "/sustentacao", icon: HeadphonesIcon, bu: "kora-dev" },
  { name: "Observabilidade", href: "/observabilidade", icon: Activity, bu: "kora-dev" },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen, bu: "kora-studio" },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3, bu: "kora-corp" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AppSidebar({ onNavigate, collapsed = false }: AppSidebarProps) {
  const location = useLocation();

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "justify-center px-2 h-14" : "px-5 h-14"
        )}>
          {!collapsed ? (
            <KoraSystemLogo size={48} className="text-foreground" />
          ) : (
            <KoraSystemLogoIcon className="text-foreground" size={36} />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const navLink = (
              <NavLink
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground before:content-[''] before:absolute before:left-0 before:inset-y-1.5 before:w-[3px] before:bg-primary before:rounded-r-full"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}

          {/* Empresa + Admin items */}
          <>
            <div className={cn("my-1 border-t border-sidebar-border", collapsed ? "mx-2" : "mx-1")} />

            {[
              { href: "/empresa", label: "Empresa", Icon: Building2 },
              { href: "/usuarios", label: "Usuários", Icon: Users },
            ].map(({ href, label, Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={href}
                      onClick={handleNavClick}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden",
                        collapsed ? "justify-center" : "",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground before:content-[''] before:absolute before:left-0 before:inset-y-1.5 before:w-[3px] before:bg-primary before:rounded-r-full"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      <p>{label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </>
        </nav>

      </aside>
    </TooltipProvider>
  );
}
