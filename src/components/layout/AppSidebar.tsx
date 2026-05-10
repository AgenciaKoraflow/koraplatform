import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Settings,
  DollarSign,
  BarChart3,
  Filter,
  Activity,
  Heart,
  FolderKanban,
  CheckSquare,
  FileSignature,
  BookOpen,
  HeadphonesIcon,
  LogOut,
  Workflow,
  Target,
  Palette,
} from "lucide-react";
import { BU, BU_CONFIG } from "@/types/bu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KoraSystemLogo, KoraSystemLogoIcon } from "@/components/shared/KoraSystemLogo";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { name: string; href: string; icon: typeof Filter; bu: BU };

const navigation: NavItem[] = [
  { name: "Funil", href: "/", icon: Filter, bu: "kora-agents" },
  { name: "Clientes", href: "/clientes", icon: Heart, bu: "kora-agents" },
  { name: "Contratos", href: "/contratos", icon: FileSignature, bu: "kora-agents" },
  { name: "Projetos", href: "/projetos", icon: FolderKanban, bu: "kora-dev" },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare, bu: "kora-dev" },
  { name: "Sustentação", href: "/sustentacao", icon: HeadphonesIcon, bu: "kora-dev" },
  { name: "Observabilidade", href: "/observabilidade", icon: Activity, bu: "kora-dev" },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen, bu: "kora-studio" },
  { name: "Processos", href: "/processos", icon: Workflow, bu: "kora-corp" },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, bu: "kora-corp" },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3, bu: "kora-corp" },
  { name: "OKR", href: "/okr", icon: Target, bu: "kora-corp" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AppSidebar({ onNavigate, collapsed = false }: AppSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "flex flex-col h-screen border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        {/* Logo/Title */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "justify-center px-2 h-14" : "px-5 h-16"
        )}>
          {!collapsed ? (
            <KoraSystemLogo size={48} className="text-foreground" />
          ) : (
            <KoraSystemLogoIcon className="text-foreground" size={36} />
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-3 space-y-0.5 overflow-y-auto transition-all duration-300",
          collapsed ? "px-2" : "px-2"
        )}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const buCfg = BU_CONFIG[item.bu];
            const navLink = (
              <NavLink
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-5 h-5" />
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
        </nav>

        {/* User Profile & Logout */}
        <div className={cn(
          "border-t border-sidebar-border p-3 transition-all duration-300",
          collapsed ? "flex justify-center" : "flex items-center justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || "K"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user?.email?.split("@")[0] || "login"}
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  {user?.email || "---"}
                </span>
              </div>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "p-2 rounded-xl text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150",
                  collapsed && "mx-auto"
                )}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground">
              <p>Sair</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
