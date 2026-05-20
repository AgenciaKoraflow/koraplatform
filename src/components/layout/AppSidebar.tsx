import { NavLink, useLocation } from "react-router-dom";
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
  LogOut,
  Workflow,
  Target,
  Camera,
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
import { useUserAvatar } from "@/hooks/useUserAvatar";

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
  const { avatarUrl, uploadAvatar, isUploading } = useUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side guard before the hook does the same check — fail fast
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
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

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
          {/* Camera overlay on hover */}
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
          collapsed ? "justify-center px-2 h-14" : "px-5 h-16"
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
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
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
          collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"
        )}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <UserAvatarButton />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email?.split("@")[0] || "login"}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || "---"}
                </span>
              </div>
            </div>
          ) : (
            <UserAvatarButton />
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
