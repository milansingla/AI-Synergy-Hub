import { Link, useLocation } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import { LayoutDashboard, FileText, MessageSquare, ShieldCheck, Settings, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetUserProfile } from "@workspace/api-client-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/jd/new", label: "Upload JD", icon: FileText },
  { path: "/interviews", label: "Interviews", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { path: "/admin", label: "Admin", icon: ShieldCheck },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useGetUserProfile();

  const allNavItems = profile?.role === "admin" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-primary text-primary-foreground">
            <Zap size={14} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">Synorlab</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map(({ path, label, icon: Icon }) => {
            const active = location === path || location.startsWith(path + "/");
            return (
              <Link key={path} href={path}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer select-none",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon size={15} className={active ? "text-primary" : ""} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.email || "Student"}</p>
              {profile?.role === "admin" && (
                <span className="text-xs text-primary font-mono">admin</span>
              )}
            </div>
          </div>
          <button
            data-testid="btn-sign-out"
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
