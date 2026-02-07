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
  Zap,
  DollarSign,
  BarChart3,
  Filter,
  Activity,
  Heart,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Funil", href: "/funil", icon: Filter },
  { name: "Clientes", href: "/clientes", icon: Heart },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Propostas", href: "/propostas", icon: FileText },
  { name: "Contratos", href: "/contratos", icon: FileSignature },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen },
  { name: "Sustentação", href: "/sustentacao", icon: HeadphonesIcon },
  { name: "Observabilidade", href: "/observabilidade", icon: Activity },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="flex flex-col h-screen bg-sidebar border-r border-sidebar-border w-60">
      {/* Logo */}
      <div className="flex items-center h-16 border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">
            AgênciaIA
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border py-3 px-3">
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
      </div>
    </aside>
  );
}
