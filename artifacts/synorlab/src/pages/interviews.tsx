import { Link } from "wouter";
import { useListInterviews } from "@/hooks/api";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Clock, ChevronRight, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? "text-green-400 bg-green-400/10 border-green-400/20"
    : score >= 60 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";
  return (
    <span className={cn("text-xs font-mono font-semibold border rounded px-1.5 py-0.5", color)}>
      {score}%
    </span>
  );
}

function StatusBadge({ status }: { status: "scheduled" | "in_progress" | "completed" }) {
  if (status === "completed") {
    return (
      <Badge variant="secondary" className="text-xs font-mono h-4 mt-0.5 bg-green-500/15 text-green-400 border-green-500/20">
        completed
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge variant="secondary" className="text-xs font-mono h-4 mt-0.5 bg-blue-500/15 text-blue-400 border-blue-500/20">
        scheduled
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-mono h-4 mt-0.5">
      in progress
    </Badge>
  );
}

export default function InterviewsList() {
  const { data: interviews, isLoading } = useListInterviews();

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Interviews</h1>
            <p className="text-sm text-muted-foreground mt-1">All your practice sessions</p>
          </div>
          <Link href="/jd/new">
            <Button size="sm" className="gap-2" data-testid="btn-new-interview">
              <Plus size={14} />
              New interview
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !interviews?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <FileText size={36} className="text-muted-foreground/30 mb-4" />
              <p className="font-medium mb-1">No interviews yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                Upload a job description to start your first practice session
              </p>
              <Link href="/jd/new">
                <Button size="sm" data-testid="btn-start-first">Start your first interview</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_100px_80px_80px_32px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <span>Role</span>
                <span>Date</span>
                <span>Messages</span>
                <span>Score</span>
                <span />
              </div>
              <div className="divide-y divide-border">
                {interviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={interview.status === "completed" ? `/interviews/${interview.id}/results` : `/interviews/${interview.id}`}
                  >
                    <div
                      className="grid grid-cols-[1fr_100px_80px_80px_32px] gap-4 items-center px-5 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                      data-testid={`row-interview-${interview.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          interview.status === "scheduled" ? "bg-blue-500/10" : "bg-accent"
                        )}>
                          {interview.status === "scheduled"
                            ? <Calendar size={13} className="text-blue-400" />
                            : <MessageSquare size={13} className="text-primary" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{interview.role}</p>
                          <StatusBadge status={interview.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock size={10} className="shrink-0" />
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </div>

                      <span className="text-xs text-muted-foreground font-mono" data-testid={`msg-count-${interview.id}`}>
                        {interview.messageCount}
                      </span>

                      <div data-testid={`score-${interview.id}`}>
                        <ScorePill score={interview.score} />
                      </div>

                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
