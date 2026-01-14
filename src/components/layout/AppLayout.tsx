import { ReactNode, useState, createContext, useContext } from "react";
import { AppSidebar } from "./AppSidebar";
import { Search, User, Menu, X, Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within AppLayout");
  }
  return context;
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar - Fixed */}
        <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
          <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <AppSidebar onNavigate={() => setMobileMenuOpen(false)} collapsed={false} />
        </div>
        
        {/* Main content with margin to account for fixed sidebar */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-60"
        )}>
          {/* Top Bar */}
          <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationDropdown />
              
              <div className="hidden sm:flex items-center gap-3 pl-4 ml-2 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">João Silva</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">JS</span>
                </div>
              </div>
              
              {/* Mobile avatar only */}
              <div className="sm:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-foreground">JS</span>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
