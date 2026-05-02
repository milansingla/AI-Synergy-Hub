import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ShieldCheck,
  Settings,
  LogOut,
  Zap,
  Building2,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetUserProfile } from "@/hooks/api";

type NavItem = { path: string; label: string; icon: React.ElementType };

const studentNavItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/jd/new", label: "Practice", icon: FileText },
  { path: "/interviews", label: "Interviews", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

const facilityNavItems: NavItem[] = [
  { path: "/facility", label: "Overview", icon: Building2 },
  { path: "/facility/students", label: "Students", icon: GraduationCap },
  { path: "/settings", label: "Settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { path: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { path: "/settings", label: "Settings", icon: Settings },
];

function getRoleNav(role: string | undefined): NavItem[] {
  if (role === "admin") return adminNavItems;
  if (role === "facility") return facilityNavItems;
  return studentNavItems;
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    admin: { label: "Admin", cls: "bg-rose-100 text-rose-700 border-rose-200" },
    facility: { label: "Facility", cls: "bg-violet-100 text-violet-700 border-violet-200" },
    student: { label: "Student", cls: "bg-teal-100 text-teal-700 border-teal-200" },
  };
  const { label, cls } = cfg[role] ?? cfg.student;
  return (
    <span className={cn("text-[10px] font-semibold border rounded px-1.5 py-0.5", cls)}>
      {label}
    </span>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useGetUserProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getRoleNav(profile?.role);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-sm">
          <Zap size={14} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm tracking-tight text-sidebar-foreground">Synorlab</span>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Main</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path || (path !== "/" && location.startsWith(path + "/"));
          return (
            <Link key={path} href={path} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer select-none relative",
                  active
                    ? "bg-accent text-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-secondary"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon size={15} className={active ? "text-primary" : "text-foreground/50"} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-3 shrink-0 bg-secondary/40">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {profile?.fullName || profile?.email || "Loading…"}
            </p>
            {profile?.role && <RoleBadge role={profile.role} />}
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border z-10 shadow-lg">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-white shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
              <Zap size={11} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm tracking-tight">Synorlab</span>
          </div>
          <div className="ml-auto">
            <UserButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden flex items-stretch border-t border-border bg-white shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
          {navItems.slice(0, 4).map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/" && location.startsWith(path + "/"));
            return (
              <Link key={path} href={path} className="flex-1">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors select-none",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
