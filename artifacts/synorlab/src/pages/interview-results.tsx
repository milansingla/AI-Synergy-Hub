import { useParams, Link, useLocation } from "wouter";
import { useGetInterview, useCompleteInterview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, CheckCircle2, Loader2, ArrowLeft, MessageSquare, Star,
  Home, Building2, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Score helpers ─────────────────────────────────────────────────────────── */
function scoreColor(score: number): string {
  if (score >= 85) return "#4ade80";
  if (score >= 70) return "#34d399";
  if (score >= 55) return "#facc15";
  if (score >= 38) return "#fb923c";
  return "#f87171";
}

function verdictFromScore(score: number): { label: string; color: string; bg: string; border: string; description: string } {
  if (score >= 85) return { label: "Strong Hire", color: "#4ade80", bg: "#4ade8015", border: "#4ade8040", description: "Top-tier performance. Recommend advancing immediately." };
  if (score >= 70) return { label: "Hire", color: "#34d399", bg: "#34d39915", border: "#34d39940", description: "Meets the bar. Recommend proceeding to next round." };
  if (score >= 55) return { label: "Hold", color: "#facc15", bg: "#facc1515", border: "#facc1540", description: "Below the hiring bar. Consider a follow-up interview." };
  if (score >= 38) return { label: "Weak", color: "#fb923c", bg: "#fb923c15", border: "#fb923c40", description: "Significant gaps identified. Does not recommend hire." };
  return { label: "No Hire", color: "#f87171", bg: "#f8717115", border: "#f8717140", description: "Failed to demonstrate minimum competencies for this role." };
}

/* ─── Score ring ────────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const size = 112;
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const verdict = verdictFromScore(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <span className="absolute text-2xl font-bold font-mono" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color, borderColor: verdict.border, backgroundColor: verdict.bg }}>
        {verdict.label}
      </span>
    </div>
  );
}

/* ─── Criteria bar ──────────────────────────────────────────────────────────── */
function CriteriaBar({ dimension, score, weight, feedback }: { dimension: string; score: number; weight: number; feedback: string }) {
  const color = score >= 85 ? "bg-green-500" : score >= 70 ? "bg-emerald-500" : score >= 55 ? "bg-yellow-500" : score >= 38 ? "bg-orange-500" : "bg-red-500";
  const textColor = score >= 85 ? "text-green-400" : score >= 70 ? "text-emerald-400" : score >= 55 ? "text-yellow-400" : score >= 38 ? "text-orange-400" : "text-red-400";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{dimension}</span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0">({weight}%)</span>
        </div>
        <span className={cn("text-sm font-bold font-mono shrink-0", textColor)}>{score}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
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
        <div className="px-8 py-8 max-w-4xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!interview) return null;

  const evaluation = interview.evaluation;
  const criteriaScores = evaluation ? ((evaluation as any).criteriaScores as Array<{ dimension: string; score: number; weight: number; feedback: string }> ?? []) : [];

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/interviews">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 px-2">
              <ArrowLeft size={13} /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{interview.role}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {(interview as any).company && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 size={11} /> {(interview as any).company}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                Interview #{interview.id} · {new Date(interview.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/")}>
              <Home size={13} /> Home
            </Button>
          </div>
        </div>

        {!evaluation ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Star size={32} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-2">Evaluation not generated yet</p>
            <p className="text-sm text-muted-foreground mb-6">Complete the interview and generate your full HR evaluation report.</p>
            <Button onClick={generateEval} disabled={isGenerating} className="gap-2">
              {isGenerating ? <><Loader2 size={14} className="animate-spin" /> Generating evaluation…</> : "Generate evaluation"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero score card */}
            {(() => {
              const verdict = verdictFromScore(evaluation.overallScore);
              const hiringVerdict = (evaluation as any).hiringVerdict as string | undefined;
              const displayVerdict = hiringVerdict ?? verdict.label;
              return (
                <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: verdict.border }}>
                  <div className="px-5 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: verdict.bg, borderColor: verdict.border }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: verdict.color }}>Hiring Recommendation</span>
                    <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono" style={{ color: verdict.color, borderColor: verdict.border, backgroundColor: "transparent" }}>
                      {displayVerdict}
                    </span>
                  </div>
                  <div className="p-6 flex items-start gap-6 md:gap-8">
                    <ScoreRing score={evaluation.overallScore} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Overall Score · Weighted Assessment</p>
                      <p className="text-sm leading-relaxed text-foreground" data-testid="text-feedback">{evaluation.feedback}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: verdict.color }}>{verdict.description}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 6-Dimension criteria */}
            {criteriaScores.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold">HR Evaluation — 6-Dimension Competency Framework</h3>
                </div>
                <div className="p-5 grid grid-cols-1 gap-5">
                  {criteriaScores.map((cs, i) => (
                    <CriteriaBar key={i} dimension={cs.dimension} score={cs.score} weight={cs.weight} feedback={cs.feedback} />
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Evaluation criteria aligned with top-company (FAANG) and Indian corporate HR standards. Weighted composite score reflects role-specific competency requirements.</p>
                </div>
              </div>
            )}

            {/* Strengths & improvements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <h3 className="text-sm font-semibold">Key Strengths</h3>
                </div>
                <ul className="space-y-3" data-testid="list-strengths">
                  {(evaluation.strengths as string[]).map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 text-xs shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-yellow-400" />
                  <h3 className="text-sm font-semibold">Areas to Improve</h3>
                </div>
                <ul className="space-y-3" data-testid="list-improvements">
                  {(evaluation.improvements as string[]).map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5 text-xs shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Per-question breakdown */}
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
                    <div key={i} className="px-5 py-5" data-testid={`question-eval-${i}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm font-medium leading-snug flex-1">{qe.question}</p>
                        <Badge
                          variant="secondary"
                          className={cn("font-mono text-xs shrink-0",
                            qe.score >= 85 ? "bg-green-400/10 text-green-400 border-green-400/20"
                            : qe.score >= 70 ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                            : qe.score >= 55 ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                            : qe.score >= 38 ? "bg-orange-400/10 text-orange-400 border-orange-400/20"
                            : "bg-red-400/10 text-red-400 border-red-400/20"
                          )}
                        >
                          {qe.score}%
                        </Badge>
                      </div>
                      {qe.answer && (
                        <p className="text-xs text-muted-foreground/70 italic mb-2 line-clamp-2">"{qe.answer}"</p>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{qe.feedback}</p>
                      {qe.idealAnswer && (
                        <div className="mt-2 bg-muted/40 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-wider mb-1">Ideal answer</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{qe.idealAnswer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link href="/jd/new">
                <Button className="gap-2" data-testid="btn-practice-again">
                  <RotateCcw size={13} /> Practice again
                </Button>
              </Link>
              <Link href="/interviews">
                <Button variant="outline" data-testid="btn-all-interviews">All interviews</Button>
              </Link>
              <Button variant="ghost" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground ml-auto">
                <Home size={13} /> Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
