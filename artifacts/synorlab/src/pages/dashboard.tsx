import { Link } from "wouter";
import { useGetInterviewStats } from "@/hooks/api";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, TrendingUp, Plus, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <span className="text-xs text-muted-foreground font-mono">—</span>;
  const color = score >= 85 ? "text-green-600" : score >= 70 ? "text-emerald-600" : score >= 55 ? "text-yellow-600" : score >= 38 ? "text-orange-600" : "text-red-600";
  return <span className={cn("text-xs font-mono font-semibold", color)}>{score}%</span>;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetInterviewStats();

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your interview practice overview</p>
          </div>
          <Link href="/jd/new">
            <Button size="sm" className="gap-2" data-testid="btn-new-interview">
              <Plus size={14} />
              New Interview
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total sessions",
              value: isLoading ? null : (stats?.totalInterviews ?? 0),
              icon: MessageSquare,
              testid: "stat-total",
            },
            {
              label: "Completed",
              value: isLoading ? null : (stats?.completedInterviews ?? 0),
              icon: CheckCircle2,
              testid: "stat-completed",
            },
            {
              label: "Avg. score",
              value: isLoading ? null : (stats?.averageScore ? `${Math.round(stats.averageScore)}%` : "—"),
              icon: TrendingUp,
              testid: "stat-avg-score",
            },
          ].map(({ label, value, icon: Icon, testid }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5" data-testid={testid}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
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

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Recent interviews</h2>
            <Link href="/interviews">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground h-7" data-testid="btn-view-all">
                View all <ChevronRight size={12} />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !stats?.recentInterviews?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <FileText size={32} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No interviews yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Upload a job description to get started</p>
              <Link href="/jd/new">
                <Button size="sm" variant="outline" data-testid="btn-empty-cta">Upload a JD</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentInterviews.map((interview) => (
                <Link key={interview.id} href={interview.status === "completed" ? `/interviews/${interview.id}/results` : `/interviews/${interview.id}`}>
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors cursor-pointer"
                    data-testid={`row-interview-${interview.id}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <MessageSquare size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{interview.role}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={10} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{interview.messageCount} messages</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ScoreBadge score={interview.score} />
                      <Badge
                        variant={interview.status === "completed" ? "default" : "secondary"}
                        className={cn(
                          "text-xs font-mono h-5",
                          interview.status === "completed" && "bg-green-100 text-green-700 border-green-200"
                        )}
                        data-testid={`status-${interview.id}`}
                      >
                        {interview.status === "completed" ? "done" : "in progress"}
                      </Badge>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
