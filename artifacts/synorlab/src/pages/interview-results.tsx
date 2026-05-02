import { useParams, Link } from "wouter";
import {
  useGetInterview,
  useCompleteInterview,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, CheckCircle2, XCircle, Loader2, ArrowLeft, MessageSquare, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171";
  const size = 96;
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute text-xl font-bold font-mono" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const interviewId = Number(id);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: interview, isLoading } = useGetInterview(interviewId, {
    query: { enabled: !!interviewId, queryKey: ["getInterview", interviewId] },
  });
  const complete = useCompleteInterview();

  const generateEval = async () => {
    setIsGenerating(true);
    try {
      await complete.mutateAsync({ id: interviewId });
      await queryClient.invalidateQueries({ queryKey: ["getInterview", interviewId] });
    } catch {
      toast({ title: "Failed to generate evaluation", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-8 py-8 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!interview) return null;

  const evaluation = interview.evaluation;

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/interviews">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 px-2" data-testid="btn-back">
              <ArrowLeft size={13} /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{interview.role}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Interview #{interview.id} · {new Date(interview.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {!evaluation ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Star size={32} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-2">Evaluation not generated yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Complete the interview and generate your score.
            </p>
            <Button onClick={generateEval} disabled={isGenerating} className="gap-2" data-testid="btn-generate-eval">
              {isGenerating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : "Generate evaluation"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score card */}
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-8">
              <ScoreRing score={evaluation.overallScore} data-testid="score-ring" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Overall score</p>
                <p className="text-sm leading-relaxed" data-testid="text-feedback">{evaluation.feedback}</p>
              </div>
            </div>

            {/* Strengths & improvements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <h3 className="text-sm font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-2" data-testid="list-strengths">
                  {(evaluation.strengths as string[]).map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-400 mt-1 text-xs">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-yellow-400" />
                  <h3 className="text-sm font-semibold">Improvements</h3>
                </div>
                <ul className="space-y-2" data-testid="list-improvements">
                  {(evaluation.improvements as string[]).map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-400 mt-1 text-xs">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Per-question evaluations */}
            {evaluation.questionEvals && (evaluation.questionEvals as any[]).length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    Question-by-question breakdown
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {(evaluation.questionEvals as any[]).map((qe: any, i: number) => (
                    <div key={i} className="px-5 py-4" data-testid={`question-eval-${i}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm font-medium leading-snug flex-1">{qe.question}</p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-mono text-xs shrink-0",
                            qe.score >= 80 ? "bg-green-400/10 text-green-400 border-green-400/20"
                            : qe.score >= 60 ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                            : "bg-red-400/10 text-red-400 border-red-400/20"
                          )}
                        >
                          {qe.score}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{qe.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/jd/new">
                <Button className="gap-2" data-testid="btn-practice-again">
                  Practice again
                </Button>
              </Link>
              <Link href="/interviews">
                <Button variant="outline" data-testid="btn-all-interviews">
                  All interviews
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
