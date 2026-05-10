import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Search, Menu, X, Bell, Sun, Moon } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { cn } from "@/lib/utils";
import { KoraSystemLogoIcon } from "@/components/shared/KoraSystemLogo";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userName = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar - Fixed, sempre visível */}
      <div className={cn(
        "hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <AppSidebar collapsed={sidebarCollapsed} />
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>
      
      {/* Main content with margin to account for fixed sidebar */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-30 shadow-sm">
          {/* Left side - User name and Menu button */}
          <div className="flex items-center gap-4">
            {/* Menu button - Desktop e Mobile */}
            <button
              onClick={() => {
                // Verifica se é desktop (lg breakpoint = 1024px)
                const isDesktop = window.innerWidth >= 1024;
                if (isDesktop) {
                  setSidebarCollapsed(!sidebarCollapsed);
                } else {
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="lg:hidden">
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </div>
              <div className="hidden lg:block">
                <Menu className="w-5 h-5 text-foreground" />
              </div>
            </button>

            {/* User name */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Bem vindo, {userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : ""}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md ml-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Q Buscar qualquer coisa.."
                className="w-full h-9 pl-10 pr-4 rounded-xl bg-input border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 -mr-2 rounded-xl hover:bg-muted transition-colors text-foreground"
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <NotificationDropdown />
            
            <div className="hidden sm:flex items-center gap-3 pl-4 ml-2 border-l border-border">
              <div className="w-12 h-12 flex items-center justify-center">
                <KoraSystemLogoIcon className="text-foreground" size={40} />
              </div>
            </div>

            {/* Mobile - Logo only */}
            <div className="sm:hidden w-12 h-12 flex items-center justify-center">
              <KoraSystemLogoIcon className="text-foreground" size={36} />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
