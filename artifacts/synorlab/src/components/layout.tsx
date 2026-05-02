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
import { useGetUserProfile } from "@workspace/api-client-react";

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
    admin: { label: "Admin", cls: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
    facility: { label: "Facility", cls: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
    student: { label: "Student", cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  };
  const { label, cls } = cfg[role] ?? cfg.student;
  return (
    <span className={cn("text-[10px] font-mono font-semibold border rounded px-1.5 py-0.5", cls)}>
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
      <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-primary text-primary-foreground">
          <Zap size={14} strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">Synorlab</span>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path || (path !== "/" && location.startsWith(path + "/"));
          return (
            <Link key={path} href={path} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer select-none",
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
      <div className="px-4 py-4 border-t border-sidebar-border space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {profile?.email || "Loading…"}
            </p>
            {profile?.role && <RoleBadge role={profile.role} />}
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
      <aside className="hidden md:flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer */}
          <aside className="relative flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground">
              <Zap size={11} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight">Synorlab</span>
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
        <nav className="md:hidden flex items-stretch border-t border-border bg-sidebar shrink-0">
          {navItems.slice(0, 4).map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/" && location.startsWith(path + "/"));
            return (
              <Link key={path} href={path} className="flex-1">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors select-none",
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
