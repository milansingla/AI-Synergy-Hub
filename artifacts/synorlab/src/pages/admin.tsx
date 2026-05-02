import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllUsers,
  useGetAdminStats,
  useUpdateUserRole,
  useDeleteUser,
  useListAllInterviews,
  useDeleteAdminInterview,
  getListAllUsersQueryKey,
  getGetAdminStatsQueryKey,
  getListAllInterviewsQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Clock,
  Trash2,
  MessageSquare,
  ShieldCheck,
  UserX,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "users" | "interviews";

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-muted-foreground font-mono">—</span>;
  const color =
    score >= 80
      ? "text-green-400 bg-green-400/10 border-green-400/20"
      : score >= 60
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      : "text-red-400 bg-red-400/10 border-red-400/20";
  return (
    <span className={cn("text-xs font-mono font-semibold border rounded px-1.5 py-0.5", color)}>
      {Math.round(score)}%
    </span>
  );
}

/* ─── Overview tab ──────────────────────────────────────────────────────── */

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStats();

  const cards = [
    { label: "Total users", value: stats?.totalUsers ?? 0, icon: Users },
    { label: "Total interviews", value: stats?.totalInterviews ?? 0, icon: BarChart3 },
    { label: "Completed", value: stats?.completedInterviews ?? 0, icon: CheckCircle2 },
    {
      label: "Avg. score",
      value: stats?.averageScore ? `${Math.round(stats.averageScore)}%` : "—",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {label}
              </span>
              <Icon size={14} className="text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold font-mono">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Completion rate bar */}
      {!isLoading && stats && stats.totalInterviews > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Interview completion rate</span>
            <span className="text-sm font-mono text-muted-foreground">
              {Math.round((stats.completedInterviews / stats.totalInterviews) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{
                width: `${(stats.completedInterviews / stats.totalInterviews) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedInterviews} of {stats.totalInterviews} sessions completed
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Users tab ─────────────────────────────────────────────────────────── */

function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListAllUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string } | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: "student" | "admin") => {
    setSavingRole(userId);
    try {
      await updateRole.mutateAsync({ userId, data: { role } });
      await queryClient.invalidateQueries({ queryKey: getListAllUsersQueryKey() });
      toast({ title: "Role updated" });
    } catch {
      toast({ title: "Failed to update role", variant: "destructive" });
    } finally {
      setSavingRole(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUser.mutateAsync({ userId: pendingDelete.id });
      await queryClient.invalidateQueries({ queryKey: getListAllUsersQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "User deleted" });
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users size={14} className="text-primary" />
          <h2 className="font-semibold text-sm">All users</h2>
          {users && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {users.length} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !users?.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <UserX size={16} className="mr-2" /> No users found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_1fr_140px_80px_80px_48px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <span>Email</span>
              <span>User ID</span>
              <span>Role</span>
              <span>Interviews</span>
              <span>Joined</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[2fr_1fr_140px_80px_80px_48px] gap-3 items-center px-5 py-3"
                >
                  <span className="text-sm font-mono truncate text-foreground">
                    {user.email}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {user.id.slice(0, 12)}…
                  </span>

                  {/* Inline role selector */}
                  <Select
                    value={user.role}
                    onValueChange={(v) => handleRoleChange(user.id, v as "student" | "admin")}
                    disabled={savingRole === user.id}
                  >
                    <SelectTrigger className="h-7 text-xs w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">student</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm font-mono text-muted-foreground">
                    {user.totalInterviews}
                  </span>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock size={10} />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => setPendingDelete({ id: user.id, email: user.email })}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-mono text-foreground">{pendingDelete?.email}</span> and all
              their interviews, messages, and evaluations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Interviews tab ────────────────────────────────────────────────────── */

function InterviewsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: interviews, isLoading } = useListAllInterviews();
  const deleteInterview = useDeleteAdminInterview();
  const [pendingDelete, setPendingDelete] = useState<{ id: number; role: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteInterview.mutateAsync({ id: pendingDelete.id });
      await queryClient.invalidateQueries({ queryKey: getListAllInterviewsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "Interview deleted" });
    } catch {
      toast({ title: "Failed to delete interview", variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          <h2 className="font-semibold text-sm">All interviews</h2>
          {interviews && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {interviews.length} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !interviews?.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Activity size={16} className="mr-2" /> No interviews yet
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_2fr_100px_80px_80px_48px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <span>Role</span>
              <span>User</span>
              <span>Status</span>
              <span>Score</span>
              <span>Date</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {interviews.map((iv) => (
                <div
                  key={iv.id}
                  className="grid grid-cols-[2fr_2fr_100px_80px_80px_48px] gap-3 items-center px-5 py-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
                      <MessageSquare size={11} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{iv.role}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{iv.id}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {iv.userEmail}
                  </span>

                  <Badge
                    variant={iv.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      "text-xs font-mono h-5 w-fit",
                      iv.status === "completed" &&
                        "bg-green-500/15 text-green-400 border-green-500/20"
                    )}
                  >
                    {iv.status === "completed" ? "done" : "in progress"}
                  </Badge>

                  <ScorePill score={iv.score} />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock size={10} />
                    {new Date(iv.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => setPendingDelete({ id: iv.id, role: iv.role })}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete interview"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the{" "}
              <span className="font-mono text-foreground">{pendingDelete?.role}</span> interview
              along with all messages and its evaluation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Main admin page ───────────────────────────────────────────────────── */

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "interviews", label: "Interviews", icon: MessageSquare },
  ];

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Platform management and oversight
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 w-fit mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "interviews" && <InterviewsTab />}
      </div>
    </AppLayout>
  );
}
