import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import {
  useListAllUsers,
  useGetAdminStats,
  useUpdateUserRole,
  useDeleteUser,
  useListAllInterviews,
  useDeleteAdminInterview,
  useListInvites,
  useCreateInvite,
  useDeleteInvite,
  useListAccessCodes,
  useCreateAccessCode,
  useDeleteAccessCode,
  getListAllUsersQueryKey,
  getGetAdminStatsQueryKey,
  getListAllInterviewsQueryKey,
  getListInvitesQueryKey,
  getListAccessCodesQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Mail,
  KeyRound,
  UserCheck,
  Plus,
  Copy,
  Upload,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "users" | "interviews" | "access";

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-muted-foreground font-mono">—</span>;
  const color =
    score >= 85
      ? "text-green-700 bg-green-50 border-green-200"
      : score >= 70
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 55
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : score >= 38
      ? "text-orange-700 bg-orange-50 border-orange-200"
      : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={cn("text-xs font-mono font-semibold border rounded px-1.5 py-0.5", color)}>
      {Math.round(score)}%
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    admin: "bg-rose-100 text-rose-700 border-rose-200",
    facility: "bg-violet-100 text-violet-700 border-violet-200",
    student: "bg-teal-100 text-teal-700 border-teal-200",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono font-semibold border rounded px-1.5 py-0.5",
        cfg[role] ?? cfg.student
      )}
    >
      {role}
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
          <div key={label} className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {label}
              </span>
              <Icon size={14} className="text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold font-mono">{value}</p>
            )}
          </div>
        ))}
      </div>

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

  const handleRoleChange = async (userId: string, role: "student" | "admin" | "facility") => {
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
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !users?.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <UserX size={16} className="mr-2" /> No users found
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_160px_80px_80px_48px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <span>Email</span>
              <span>User ID</span>
              <span>Role</span>
              <span>Interviews</span>
              <span>Joined</span>
              <span />
            </div>

            <div className="divide-y divide-border">
              {users.map((user) => (
                <div key={user.id}>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_160px_80px_80px_48px] gap-3 items-center px-5 py-3">
                    <span className="text-sm font-mono truncate">{user.email}</span>
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {user.id.slice(0, 12)}…
                    </span>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v as "student" | "admin" | "facility")}
                      disabled={savingRole === user.id}
                    >
                      <SelectTrigger className="h-7 text-xs w-[140px] bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">student</SelectItem>
                        <SelectItem value="facility">facility</SelectItem>
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
                      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-mono truncate flex-1">{user.email}</p>
                      <button
                        onClick={() => setPendingDelete({ id: user.id, email: user.email })}
                        className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={user.role} />
                      <span className="text-xs text-muted-foreground font-mono">
                        {user.totalInterviews} interviews
                      </span>
                      <span className="text-xs text-muted-foreground font-mono ml-auto">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v as "student" | "admin" | "facility")}
                      disabled={savingRole === user.id}
                    >
                      <SelectTrigger className="h-7 text-xs w-full bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">student</SelectItem>
                        <SelectItem value="facility">facility</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent className="bg-card border-border mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-mono text-foreground">{pendingDelete?.email}</span> and all
              their data. This action cannot be undone.
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
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !interviews?.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Activity size={16} className="mr-2" /> No interviews yet
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[2fr_2fr_100px_80px_80px_48px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <span>Role</span>
              <span>User</span>
              <span>Status</span>
              <span>Score</span>
              <span>Date</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {interviews.map((iv) => (
                <div key={iv.id}>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[2fr_2fr_100px_80px_80px_48px] gap-3 items-center px-5 py-3">
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
                        iv.status === "completed" && "bg-green-100 text-green-700 border-green-200"
                      )}
                    >
                      {iv.status === "completed" ? "done" : "live"}
                    </Badge>
                    <ScorePill score={iv.score} />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Clock size={10} />
                      {new Date(iv.createdAt).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => setPendingDelete({ id: iv.id, role: iv.role })}
                      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate flex-1">{iv.role}</p>
                      <ScorePill score={iv.score} />
                      <button
                        onClick={() => setPendingDelete({ id: iv.id, role: iv.role })}
                        className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="truncate flex-1">{iv.userEmail}</span>
                      <Badge
                        variant={iv.status === "completed" ? "default" : "secondary"}
                        className={cn(
                          "text-xs font-mono h-4",
                          iv.status === "completed" && "bg-green-100 text-green-700 border-green-200"
                        )}
                      >
                        {iv.status === "completed" ? "done" : "live"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent className="bg-card border-border mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the{" "}
              <span className="font-mono text-foreground">{pendingDelete?.role}</span> interview
              along with all messages and evaluation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Bulk CSV Section ──────────────────────────────────────────────────── */

interface ParsedRow { email: string; role: string; valid: boolean; error?: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header row
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes("email") || firstLower.includes("role");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const email = (cols[0] ?? "").toLowerCase();
    const role = (cols[1] ?? "").toLowerCase();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return { email, role, valid: false, error: "Invalid email" };
    }
    if (!["student", "facility"].includes(role)) {
      return { email, role, valid: false, error: `Role must be "student" or "facility" — got "${role || "(empty)"}"` };
    }
    return { email, role, valid: true };
  });
}

function BulkCSVSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const handleUpload = async () => {
    if (validRows.length === 0) return;
    setUploading(true);
    try {
      const token = await getToken();
      const resp = await fetch("/api/admin/bulk-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invites: validRows.map((r) => ({ email: r.email, role: r.role })) }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await resp.json();
      setResult(data);
      await queryClient.invalidateQueries({ queryKey: getListInvitesQueryKey() });
      toast({
        title: `Upload complete — ${data.created} invited`,
        description: data.skipped > 0 ? `${data.skipped} skipped (already exist)` : undefined,
      });
      clearFile();
    } catch (e: any) {
      toast({ title: e.message ?? "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Upload size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Bulk CSV Upload</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Upload a <span className="font-mono text-foreground">.csv</span> file with two columns: <span className="font-mono text-foreground">email</span> and <span className="font-mono text-foreground">role</span>. Role must be <span className="font-mono text-violet-700">facility</span> or <span className="font-mono text-teal-700">student</span>. An invite will be created for each valid row — when that person signs up, their role is automatically applied. Maximum 500 rows per upload.
        </p>
        <div className="bg-secondary/40 rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground">
          <p className="text-foreground/60 mb-1">Example format:</p>
          <p>email,role</p>
          <p>priya@college.edu,facility</p>
          <p>rahul@college.edu,student</p>
          <p>neha@college.edu,student</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed bg-card transition-colors",
          fileName ? "border-primary/40" : "border-border hover:border-primary/40"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {!fileName ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop your CSV here</p>
              <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="gap-1.5"
            >
              <Upload size={13} /> Browse file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {rows.length} rows parsed · {validRows.length} valid · {invalidRows.length} errors
              </p>
            </div>
            <button onClick={clearFile} className="p-1.5 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <h3 className="text-sm font-semibold">Preview</h3>
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {validRows.length} valid / {invalidRows.length} invalid
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {rows.map((row, i) => (
              <div key={i} className={cn("flex items-center gap-3 px-5 py-2.5", !row.valid && "bg-red-500/5")}>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-mono truncate", row.valid ? "text-foreground" : "text-red-400")}>
                    {row.email || "(empty)"}
                  </p>
                  {row.error && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={9} /> {row.error}
                    </p>
                  )}
                </div>
                {row.valid ? (
                  <span className={cn(
                    "text-[10px] font-mono font-semibold border rounded px-1.5 py-0.5",
                    row.role === "facility"
                      ? "bg-violet-100 text-violet-700 border-violet-200"
                      : "bg-teal-100 text-teal-700 border-teal-200"
                  )}>
                    {row.role}
                  </span>
                ) : (
                  <span className="text-[10px] text-red-600 font-mono border border-red-200 rounded px-1.5 py-0.5">
                    error
                  </span>
                )}
              </div>
            ))}
          </div>
          {invalidRows.length > 0 && (
            <div className="px-5 py-2.5 border-t border-border bg-red-50 flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={12} />
              {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} with errors will be skipped
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      {validRows.length > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            {uploading ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={13} /> Upload {validRows.length} invite{validRows.length !== 1 ? "s" : ""}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {invalidRows.length > 0 && `${invalidRows.length} invalid row${invalidRows.length !== 1 ? "s" : ""} will be skipped · `}
            Existing invites for the same email will be skipped automatically
          </p>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-green-700 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-green-700">{result.created} invite{result.created !== 1 ? "s" : ""} created successfully</p>
            {result.skipped > 0 && (
              <p className="text-xs text-muted-foreground">{result.skipped} skipped (already had a pending invite)</p>
            )}
            {result.errors.length > 0 && (
              <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Access tab — 4 grant methods ─────────────────────────────────────── */

type AccessMethod = "role" | "invite" | "code" | "csv";

function AccessTab() {
  const [method, setMethod] = useState<AccessMethod>("role");

  return (
    <div className="space-y-6">
      {/* Method selector */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Grant access method</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: "role" as const,
              icon: UserCheck,
              title: "Role Assignment",
              desc: "Change a registered user's role directly from the Users tab",
            },
            {
              id: "invite" as const,
              icon: Mail,
              title: "Email Invite",
              desc: "Pre-register an email — role applied automatically on first sign-up",
            },
            {
              id: "code" as const,
              icon: KeyRound,
              title: "Access Code",
              desc: "Generate a shareable code — users redeem it in Settings",
            },
            {
              id: "csv" as const,
              icon: Upload,
              title: "Bulk CSV Upload",
              desc: "Upload a CSV to invite many students or teachers at once",
            },
          ].map(({ id, icon: Icon, title, desc }) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all",
                method === id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon size={18} className={method === id ? "text-primary" : ""} />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {method === "role" && <RoleAssignInfo />}
      {method === "invite" && <InviteSection />}
      {method === "code" && <AccessCodeSection />}
      {method === "csv" && <BulkCSVSection />}
    </div>
  );
}

function RoleAssignInfo() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <UserCheck size={16} className="text-primary mt-0.5 shrink-0" />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">Direct role assignment</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Switch to the <strong className="text-foreground">Users</strong> tab. Each user has a
            role dropdown — change it to <span className="font-mono text-violet-700">facility</span>,{" "}
            <span className="font-mono text-rose-400">admin</span>, or{" "}
            <span className="font-mono text-teal-700">student</span>. The change takes effect
            immediately on their next page load.
          </p>
        </div>
      </div>
    </div>
  );
}

function InviteSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: invites, isLoading } = useListInvites();
  const createInvite = useCreateInvite();
  const deleteInvite = useDeleteInvite();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "facility" | "admin">("facility");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!email.trim()) return;
    setCreating(true);
    try {
      await createInvite.mutateAsync({ data: { email: email.trim(), role } });
      await queryClient.invalidateQueries({ queryKey: getListInvitesQueryKey() });
      toast({ title: "Invite created", description: `${email} will get role '${role}' on sign-up` });
      setEmail("");
    } catch {
      toast({ title: "Failed to create invite", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInvite.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListInvitesQueryKey() });
      toast({ title: "Invite removed" });
    } catch {
      toast({ title: "Failed to remove invite", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">New email invite</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="student@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 bg-background border-border text-sm h-9"
          />
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">student</SelectItem>
              <SelectItem value="facility">facility</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleCreate} disabled={creating || !email.trim()} className="h-9 gap-1.5">
            <Plus size={13} />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          When this email address signs up via Clerk, they will automatically receive the selected role.
        </p>
      </div>

      {/* Invite list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Mail size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Pending invites</h3>
          {invites && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {invites.filter((i) => !i.used).length} pending
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !invites?.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No invites yet</div>
        ) : (
          <div className="divide-y divide-border">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        "text-[10px] font-mono font-semibold border rounded px-1.5 py-0.5",
                        inv.role === "facility"
                          ? "bg-violet-100 text-violet-700 border-violet-200"
                          : inv.role === "admin"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-teal-100 text-teal-700 border-teal-200"
                      )}
                    >
                      {inv.role}
                    </span>
                    {inv.used ? (
                      <span className="text-[10px] text-green-700 font-mono">✓ used</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">pending</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(inv.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccessCodeSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: codes, isLoading } = useListAccessCodes();
  const createCode = useCreateAccessCode();
  const deleteCode = useDeleteAccessCode();
  const [role, setRole] = useState<"student" | "facility" | "admin">("facility");
  const [customCode, setCustomCode] = useState("");
  const [maxUses, setMaxUses] = useState("50");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createCode.mutateAsync({
        data: {
          role,
          ...(customCode.trim() ? { code: customCode.trim() } : {}),
          maxUses: Number(maxUses) || 50,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListAccessCodesQueryKey() });
      toast({ title: "Access code created" });
      setCustomCode("");
    } catch (e: any) {
      toast({ title: "Failed to create code", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCode.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListAccessCodesQueryKey() });
      toast({ title: "Code deleted" });
    } catch {
      toast({ title: "Failed to delete code", variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Generate access code</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger className="h-9 text-sm bg-background border-border">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">student</SelectItem>
              <SelectItem value="facility">facility</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Custom code (optional)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            className="bg-background border-border text-sm h-9 font-mono uppercase"
          />
          <Input
            type="number"
            placeholder="Max uses"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="bg-background border-border text-sm h-9 font-mono"
          />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Button size="sm" onClick={handleCreate} disabled={creating} className="h-9 gap-1.5">
            <Plus size={13} />
            Generate
          </Button>
          <p className="text-xs text-muted-foreground">
            Leave the code field empty to auto-generate one. Users enter this in Settings → Redeem Code.
          </p>
        </div>
      </div>

      {/* Codes list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <KeyRound size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Active codes</h3>
          {codes && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {codes.filter((c) => c.active).length} active
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !codes?.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No codes yet</div>
        ) : (
          <div className="divide-y divide-border">
            {codes.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold tracking-wider text-foreground">
                      {c.code}
                    </span>
                    <button
                      onClick={() => copyCode(c.code)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-semibold border rounded px-1.5 py-0.5",
                        c.role === "facility"
                          ? "bg-violet-100 text-violet-700 border-violet-200"
                          : c.role === "admin"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-teal-100 text-teal-700 border-teal-200"
                      )}
                    >
                      {c.role}
                    </span>
                    {!c.active && (
                      <span className="text-[10px] text-muted-foreground font-mono border border-border rounded px-1 py-0.5">
                        inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {c.usedCount} / {c.maxUses} uses
                  </div>
                </div>
                {/* Usage bar */}
                <div className="hidden sm:block w-20">
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main admin page ───────────────────────────────────────────────────── */

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "interviews", label: "Interviews", icon: MessageSquare },
    { id: "access", label: "Access", icon: KeyRound },
  ];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Platform management and oversight
            </p>
          </div>
        </div>

        {/* Tab nav — scrollable on mobile */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 w-fit mb-6 overflow-x-auto max-w-full">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
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

        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "interviews" && <InterviewsTab />}
        {tab === "access" && <AccessTab />}
      </div>
    </AppLayout>
  );
}
