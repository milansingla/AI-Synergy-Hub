import { useState } from "react";
import {
  useListFacilityStudents,
  useGetFacilityStats,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  GraduationCap,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Clock,
  Activity,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "students";

interface Props {
  initialTab?: Tab;
}

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

function OverviewTab() {
  const { data: stats, isLoading } = useGetFacilityStats();

  const cards = [
    { label: "Total students", value: stats?.totalStudents ?? 0, icon: GraduationCap },
    { label: "Active this week", value: stats?.activeThisWeek ?? 0, icon: Activity },
    {
      label: "Avg. score",
      value: stats?.averageScore ? `${Math.round(stats.averageScore)}%` : "—",
      icon: TrendingUp,
    },
    {
      label: "Completion rate",
      value: stats?.completionRate ? `${Math.round(stats.completionRate)}%` : "—",
      icon: CheckCircle2,
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

      {!isLoading && stats && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Interview completion rate</span>
            <span className="text-sm font-mono text-muted-foreground">
              {Math.round(stats.completionRate ?? 0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${stats.completionRate ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on all student interview sessions
          </p>
        </div>
      )}
    </div>
  );
}

function StudentsTab() {
  const { data: students, isLoading } = useListFacilityStudents();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <GraduationCap size={14} className="text-primary" />
        <h2 className="font-semibold text-sm">All students</h2>
        {students && (
          <span className="ml-auto text-xs font-mono text-muted-foreground">
            {students.length} total
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !students?.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-muted-foreground">
          <Users size={24} className="opacity-40" />
          <p>No students registered yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[2fr_80px_80px_90px_100px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
            <span>Student</span>
            <span>Sessions</span>
            <span>Done</span>
            <span>Avg score</span>
            <span>Last active</span>
          </div>

          <div className="divide-y divide-border">
            {students.map((s) => (
              <div key={s.id}>
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[2fr_80px_80px_90px_100px] gap-3 items-center px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate">{s.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {s.id.slice(0, 14)}…
                    </p>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {s.totalInterviews}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {s.completedInterviews}
                  </span>
                  <ScorePill score={s.averageScore} />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock size={10} />
                    {s.lastActive
                      ? new Date(s.lastActive).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono truncate flex-1">{s.email}</p>
                    <ScorePill score={s.averageScore} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                    <span>{s.totalInterviews} sessions</span>
                    <span>{s.completedInterviews} completed</span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {s.lastActive
                        ? new Date(s.lastActive).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FacilityPanel({ initialTab = "overview" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "students", label: "Students", icon: GraduationCap },
  ];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Building2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Facility Panel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor student interview performance
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
                "flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all",
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
        {tab === "students" && <StudentsTab />}
      </div>
    </AppLayout>
  );
}
