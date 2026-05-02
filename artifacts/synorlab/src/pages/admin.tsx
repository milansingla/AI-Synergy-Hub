import { useListAllUsers, useGetAdminStats } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChart3, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPanel() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListAllUsers();

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform overview and user management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total users", value: stats?.totalUsers ?? 0, icon: Users, loading: statsLoading },
            { label: "Total interviews", value: stats?.totalInterviews ?? 0, icon: BarChart3, loading: statsLoading },
            { label: "Completed", value: stats?.completedInterviews ?? 0, icon: CheckCircle2, loading: statsLoading },
            {
              label: "Avg. score",
              value: stats?.averageScore ? `${Math.round(stats.averageScore)}%` : "—",
              icon: TrendingUp,
              loading: statsLoading,
            },
          ].map(({ label, value, icon: Icon, loading }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5" data-testid={`admin-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
                <Icon size={14} className="text-primary" />
              </div>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-3xl font-bold font-mono">{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <h2 className="font-semibold text-sm">All users</h2>
            {users && (
              <span className="ml-auto text-xs font-mono text-muted-foreground">{users.length} total</span>
            )}
          </div>

          {usersLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !users?.length ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1fr_80px_80px_100px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <span>User</span>
                <span>ID</span>
                <span>Role</span>
                <span>Interviews</span>
                <span>Joined</span>
              </div>
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[2fr_1fr_80px_80px_100px] gap-4 items-center px-5 py-3.5"
                    data-testid={`row-user-${user.id}`}
                  >
                    <span className="text-sm font-mono truncate text-muted-foreground">{user.email}</span>
                    <span className="text-xs font-mono text-muted-foreground truncate">{user.id.slice(0, 10)}…</span>
                    <div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-mono",
                          user.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : ""
                        )}
                        data-testid={`badge-role-${user.id}`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground" data-testid={`interview-count-${user.id}`}>
                      {user.totalInterviews}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock size={10} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
