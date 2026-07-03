import { ReactNode, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  Menu, X, Sun, Moon,
  User, LogOut, Settings, Bell, Lock,
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

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { avatarUrl } = useUserAvatar();
  const { data: profile } = useProfile(user?.id);

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* ── Desktop Sidebar - Fixa, sempre visível ── */}
      <div className={cn(
        "hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <AppSidebar collapsed={sidebarCollapsed} />
      </div>

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

      {/* ── Main content, deslocado pela sidebar fixa no desktop ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>

      {/* ── Top Header ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30 shadow-sm">
        {/* Left: hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const isDesktop = window.innerWidth >= 1024;
              if (isDesktop) {
                setSidebarCollapsed(!sidebarCollapsed);
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors touch-manipulation"
          >
            <span className="lg:hidden">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </span>
            <span className="hidden lg:block">
              <Menu className="w-5 h-5" />
            </span>
          </button>

          <NavLink to="/" className="flex items-center lg:hidden">
            <KoraSystemLogoIcon className="text-foreground" size={30} />
          </NavLink>
        </div>

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
    </div>
  );
}
