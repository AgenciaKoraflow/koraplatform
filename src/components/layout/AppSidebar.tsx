import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
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
  LayoutDashboard,
  LogOut,
  Workflow,
  Target,
  Camera,
  Users,
  Settings,
  Tag,
} from "lucide-react";
import { BU } from "@/types/bu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KoraSystemLogo, KoraSystemLogoIcon } from "@/components/shared/KoraSystemLogo";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import type { Profile } from "@/hooks/useProfile";

type NavItem = {
  name: string;
  href: string;
  icon: typeof Filter;
  bu: BU;
  adminOnly?: boolean;
  hiddenForObserver?: boolean;
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, bu: "kora-corp", hiddenForObserver: true },
  { name: "Funil", href: "/funil", icon: Filter, bu: "kora-agents", hiddenForObserver: true },
  { name: "Clientes", href: "/clientes", icon: Heart, bu: "kora-agents", hiddenForObserver: true },
  { name: "Contratos", href: "/contratos", icon: FileSignature, bu: "kora-agents", hiddenForObserver: true },
  { name: "Projetos", href: "/projetos", icon: FolderKanban, bu: "kora-dev" },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare, bu: "kora-dev" },
  { name: "Sustentação", href: "/sustentacao", icon: HeadphonesIcon, bu: "kora-dev" },
  { name: "Observabilidade", href: "/observabilidade", icon: Activity, bu: "kora-dev", hiddenForObserver: true },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen, bu: "kora-studio", hiddenForObserver: true },
  { name: "Processos", href: "/processos", icon: Workflow, bu: "kora-corp", hiddenForObserver: true },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, bu: "kora-corp", hiddenForObserver: true },
  { name: "Serviços", href: "/servicos", icon: Tag, bu: "kora-corp", hiddenForObserver: true },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3, bu: "kora-corp", hiddenForObserver: true },
  { name: "OKR", href: "/okr", icon: Target, bu: "kora-corp", hiddenForObserver: true },
];

const roleMeta: Record<Profile['role'], { label: string; class: string }> = {
  admin: { label: "Admin", class: "bg-violet-500/20 text-violet-400" },
  operador: { label: "Operador", class: "bg-blue-500/20 text-blue-400" },
  observador: { label: "Observador", class: "bg-gray-500/20 text-gray-400" },
};

interface AppSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AppSidebar({ onNavigate, collapsed = false }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const { isAdmin, isObservador } = usePermissions();
  const { avatarUrl, uploadAvatar, isUploading } = useUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleNavItems = navigation.filter((item) => {
    if (isObservador && item.hiddenForObserver) return false;
    return true;
  });

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5 MB.");
      e.target.value = "";
      return;
    }
    try {
      await uploadAvatar(file);
      toast.success("Foto de perfil atualizada!");
    } catch {
      toast.error("Não foi possível atualizar a foto. Tente novamente.");
    }
    e.target.value = "";
  };

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "login";
  const roleInfo = profile?.role ? roleMeta[profile.role] : null;

  const UserAvatarButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "relative rounded-full overflow-hidden flex-shrink-0",
            "bg-gradient-to-br from-violet-500 to-purple-600",
            "flex items-center justify-center text-white font-medium",
            "ring-2 ring-transparent hover:ring-primary transition-all",
            collapsed ? "w-8 h-8 text-sm" : "w-9 h-9 text-sm"
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span>{user?.email?.charAt(0).toUpperCase() || "K"}</span>
          )}
          <span className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            {isUploading ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side={collapsed ? "right" : "top"} className="bg-popover text-popover-foreground">
        <p>Alterar foto de perfil</p>
      </TooltipContent>
    </Tooltip>
  );

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
          {visibleNavItems.map((item) => {
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

          {/* Admin-only items */}
          {isAdmin && (
            <>
              <div className={cn("my-1 border-t border-sidebar-border", collapsed ? "mx-2" : "mx-1")} />

              {[
                { href: "/usuarios", label: "Usuários", Icon: Users },
                { href: "/configuracoes", label: "Configurações", Icon: Settings },
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
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className={cn(
          "border-t border-sidebar-border p-3 transition-all duration-300",
          collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"
        )}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!collapsed ? (
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-3 min-w-0 flex-1 rounded-xl p-1.5 hover:bg-sidebar-accent/50 transition-all text-left"
            >
              <UserAvatarButton />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayName}
                </span>
                {roleInfo && (
                  <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-md w-fit mt-0.5", roleInfo.class)}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
            </button>
          ) : (
            <button onClick={() => navigate('/perfil')}>
              <UserAvatarButton />
            </button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "p-2 rounded-xl text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 flex-shrink-0",
                  collapsed && "mt-1"
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
