import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, SplitSquareHorizontal, Settings, HelpCircle, FileSearch, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Documents", href: "/documents" },
    { icon: SplitSquareHorizontal, label: "Cross-Reference", href: "/multi-analysis" },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30">
      <aside className="w-64 border-r border-border/40 bg-sidebar/50 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl">
              L
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight">LexAI</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analysis
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border/40 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="w-4 h-4" />
            Settings
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-[100dvh] flex flex-col">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="text-sm text-muted-foreground font-medium">
            Indian Legal Document Analysis Platform
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-xs font-medium text-muted-foreground">System Operational</span>
          </div>
        </header>
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
