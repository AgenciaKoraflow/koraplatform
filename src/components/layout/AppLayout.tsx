import { ReactNode, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  Menu, X, Sun, Moon,
  Filter, FolderKanban, CheckSquare, FileSignature,
  MoreHorizontal, User, LogOut,
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
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useProfile } from "@/hooks/useProfile";

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

// Five primary routes shown in the mobile bottom nav
const BOTTOM_NAV = [
  { href: "/",         icon: Filter,        label: "Funil" },
  { href: "/tarefas",  icon: CheckSquare,   label: "Tarefas" },
  { href: "/projetos", icon: FolderKanban,  label: "Projetos" },
  { href: "/contratos",icon: FileSignature, label: "Contratos" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };
  const userName = useUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { avatarUrl } = useUserAvatar();
  const { data: profile } = useProfile(user?.id);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* ── Desktop Sidebar ── */}
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

      {/* ── Main content ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30 shadow-sm">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  toggleSidebar();
                } else {
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors touch-manipulation"
            >
              <div className="lg:hidden">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </div>
              <div className="hidden lg:block">
                <Menu className="w-5 h-5" />
              </div>
            </button>

            <p className="text-sm font-semibold text-foreground hidden sm:block">
              Bem vindo, {userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : ""}
            </p>
          </div>

          {/* Right */}
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
              <DropdownMenuContent align="end" className="w-52">
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
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Editar perfil
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

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto pb-24 lg:pb-8" style={{ scrollbarGutter: 'stable' }}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = location.pathname === href ||
              (href !== "/" && location.pathname.startsWith(href));
            return (
              <NavLink
                key={href}
                to={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span>{label}</span>
              </NavLink>
            );
          })}

          {/* "Mais" opens the mobile sidebar */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
