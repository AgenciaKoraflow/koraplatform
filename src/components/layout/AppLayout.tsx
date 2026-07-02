import { ReactNode, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  Menu, X, Sun, Moon,
  Filter, FolderKanban, CheckSquare, FileSignature,
  User, LogOut, Settings, Bell, Lock,
  BarChart3, Heart, BookOpen, LayoutDashboard, Users, Building2,
} from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useProfile } from "@/hooks/useProfile";
import { KoraSystemLogoIcon } from "@/components/shared/KoraSystemLogo";

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0.92";
    el.style.transform = "translateY(2px)";
    el.style.transition = "none";
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.12s ease, transform 0.12s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

const TOP_NAV = [
  { name: "Dashboard", href: "/",           icon: LayoutDashboard },
  { name: "Funil",     href: "/funil",       icon: Filter },
  { name: "Clientes",  href: "/clientes",    icon: Heart },
  { name: "Contratos", href: "/contratos",   icon: FileSignature },
  { name: "Projetos",  href: "/projetos",    icon: FolderKanban },
  { name: "Tarefas",   href: "/tarefas",     icon: CheckSquare },
  { name: "Conhecimento", href: "/conhecimento", icon: BookOpen },
  { name: "Indicadores",  href: "/indicadores",  icon: BarChart3 },
];

const TOP_NAV_ADMIN = [
  { name: "Empresa",  href: "/empresa",   icon: Building2 },
  { name: "Usuários", href: "/usuarios",  icon: Users },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { avatarUrl } = useUserAvatar();
  const { data: profile } = useProfile(user?.id);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar ── */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* ── Top Header ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30 shadow-sm">
        {/* Left: hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors touch-manipulation lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/" className="flex items-center">
            <KoraSystemLogoIcon className="text-foreground" size={30} />
          </NavLink>
        </div>

        {/* Center: Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto mx-4">
          {[...TOP_NAV, null, ...TOP_NAV_ADMIN].map((item) => {
            if (!item) return <div key="sep" className="w-px h-5 bg-border mx-1 flex-shrink-0" />;
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 rounded-lg transition-all duration-300 ease-out",
                  isActive
                    ? "bg-accent/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 text-sm font-medium transition-all duration-300 ease-out group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-foreground touch-manipulation"
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium ring-2 ring-transparent hover:ring-primary transition-all w-8 h-8 text-sm touch-manipulation">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.email?.charAt(0).toUpperCase() ?? "K"}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {profile?.full_name ?? user?.email?.split("@")[0] ?? ""}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil?tab=perfil")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/perfil?tab=preferencias")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Preferências
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/perfil?tab=notificacoes")} className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/perfil?tab=seguranca")} className="cursor-pointer">
                <Lock className="mr-2 h-4 w-4" />
                Segurança
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
