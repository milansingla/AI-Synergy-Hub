import { useState } from "react";
import {
  useListFacilityStudents,
  useGetFacilityStats,
  useListFacilityJDs,
  useBulkUploadStudents,
  useBulkUploadJDs,
  useScheduleInterviews,
  downloadCohortReport,
} from "@/hooks/api";
import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  GraduationCap,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Clock,
  Activity,
  Users,
  Upload,
  Calendar,
  FileDown,
  Plus,
  X,
  Loader2,
  CheckSquare,
  Square,
  Download,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Tab = "overview" | "students" | "upload" | "schedule" | "reports";

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

/* ── Overview tab ─────────────────────────────────────────────────────────── */
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

/* ── Students tab ─────────────────────────────────────────────────────────── */
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
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px_90px_100px] gap-3 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
            <span>Student</span>
            <span>Department / Year</span>
            <span>Sessions</span>
            <span>Done</span>
            <span>Avg score</span>
            <span>Last active</span>
          </div>

          <div className="divide-y divide-border">
            {students.map((s) => (
              <div key={s.id}>
                <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px_90px_100px] gap-3 items-center px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate">{s.email}</p>
                    {s.fullName && <p className="text-xs text-muted-foreground">{s.fullName}</p>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {[s.department, s.yearOfStudy].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{s.totalInterviews}</span>
                  <span className="text-sm font-mono text-muted-foreground">{s.completedInterviews}</span>
                  <ScorePill score={s.averageScore} />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock size={10} />
                    {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Never"}
                  </div>
                </div>

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
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Never"}
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

/* ── Upload tab ───────────────────────────────────────────────────────────── */
function parseStudentLines(text: string) {
  return text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        email: parts[0] ?? "",
        fullName: parts[1] || undefined,
        department: parts[2] || undefined,
        yearOfStudy: parts[3] || undefined,
      };
    })
    .filter((e) => e.email.includes("@") && e.email.includes("."));
}

function UploadTab() {
  const { toast } = useToast();

  const [studentText, setStudentText] = useState("");
  const [studentPreview, setStudentPreview] = useState<ReturnType<typeof parseStudentLines>>([]);
  const [studentResult, setStudentResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const bulkStudents = useBulkUploadStudents();

  const [jdTexts, setJdTexts] = useState<string[]>([""]);
  const [jdResult, setJdResult] = useState<{ created: number; errors: string[] } | null>(null);
  const bulkJDs = useBulkUploadJDs();

  const handlePreview = () => setStudentPreview(parseStudentLines(studentText));

  const handleUploadStudents = async () => {
    if (!studentPreview.length) return;
    try {
      const result = await bulkStudents.mutateAsync({ students: studentPreview });
      setStudentResult(result);
      setStudentText("");
      setStudentPreview([]);
      toast({ title: `${result.created} students invited` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleUploadJDs = async () => {
    const valid = jdTexts.filter((t) => t.trim().length >= 50);
    if (!valid.length) {
      toast({ title: "Add at least one JD (min 50 characters)", variant: "destructive" });
      return;
    }
    try {
      const result = await bulkJDs.mutateAsync({ jds: valid });
      setJdResult({ created: result.created.length, errors: result.errors });
      setJdTexts([""]);
      toast({ title: `${result.created.length} job descriptions saved` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const validJdCount = jdTexts.filter((t) => t.trim().length >= 50).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload students */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-primary" />
          <h3 className="font-semibold text-sm">Upload students</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          One email per line, or CSV columns:{" "}
          <code className="text-xs bg-secondary rounded px-1">email, name, department, year</code>
        </p>
        <Textarea
          value={studentText}
          onChange={(e) => { setStudentText(e.target.value); setStudentPreview([]); setStudentResult(null); }}
          placeholder={"student@iit.ac.in\nravi@iim.ac.in,Ravi Kumar,MBA,2nd Year\npriya@bits.ac.in,Priya Sharma,CSE,3rd Year"}
          className="min-h-[160px] font-mono text-xs resize-none"
        />

        {studentText.trim() && !studentPreview.length && (
          <Button size="sm" variant="outline" onClick={handlePreview} className="gap-2">
            <Users size={12} />
            Preview ({parseStudentLines(studentText).length} detected)
          </Button>
        )}

        {studentPreview.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{studentPreview.length} students ready</p>
            <div className="rounded-lg border border-border max-h-36 overflow-y-auto divide-y divide-border">
              {studentPreview.slice(0, 25).map((s, i) => (
                <div key={i} className="px-3 py-1.5 text-xs font-mono flex items-center gap-2">
                  <span className="flex-1 truncate">{s.email}</span>
                  {s.fullName && <span className="text-muted-foreground shrink-0">{s.fullName}</span>}
                </div>
              ))}
              {studentPreview.length > 25 && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground">
                  +{studentPreview.length - 25} more
                </div>
              )}
            </div>
            <Button size="sm" onClick={handleUploadStudents} disabled={bulkStudents.isPending} className="gap-2">
              {bulkStudents.isPending
                ? <><Loader2 size={12} className="animate-spin" />Uploading…</>
                : <><Upload size={12} />Invite {studentPreview.length} student{studentPreview.length !== 1 ? "s" : ""}</>
              }
            </Button>
          </div>
        )}

        {studentResult && (
          <div className="rounded-lg border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 px-3 py-2 text-xs space-y-0.5">
            <p className="font-medium text-green-700 dark:text-green-400">
              {studentResult.created} invited · {studentResult.skipped} already registered
            </p>
            {studentResult.errors.length > 0 && (
              <p className="text-red-500">{studentResult.errors.slice(0, 3).join(", ")}</p>
            )}
          </div>
        )}
      </div>

      {/* Upload JDs */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-primary" />
          <h3 className="font-semibold text-sm">Upload job descriptions</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste the full JD text. AI will extract role, company, and skills automatically.
        </p>

        <div className="space-y-3">
          {jdTexts.map((text, i) => (
            <div key={i} className="relative">
              <Textarea
                value={text}
                onChange={(e) => {
                  const t = [...jdTexts];
                  t[i] = e.target.value;
                  setJdTexts(t);
                  setJdResult(null);
                }}
                placeholder={`Paste job description ${i + 1} here…`}
                className="min-h-[120px] font-mono text-xs resize-none pr-8"
              />
              {jdTexts.length > 1 && (
                <button
                  onClick={() => setJdTexts(jdTexts.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setJdTexts([...jdTexts, ""])}
            className="gap-1.5"
          >
            <Plus size={12} />
            Add another
          </Button>
          <Button
            size="sm"
            onClick={handleUploadJDs}
            disabled={bulkJDs.isPending || validJdCount === 0}
            className="gap-2"
          >
            {bulkJDs.isPending
              ? <><Loader2 size={12} className="animate-spin" />Parsing &amp; saving…</>
              : <><Upload size={12} />Save {validJdCount} JD{validJdCount !== 1 ? "s" : ""}</>
            }
          </Button>
        </div>

        {jdResult && (
          <div className="rounded-lg border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 px-3 py-2 text-xs space-y-0.5">
            <p className="font-medium text-green-700 dark:text-green-400">
              {jdResult.created} job description{jdResult.created !== 1 ? "s" : ""} saved
            </p>
            {jdResult.errors.length > 0 && (
              <p className="text-red-500">{jdResult.errors.slice(0, 2).join(" · ")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Schedule tab ─────────────────────────────────────────────────────────── */
function ScheduleTab({ onGoToUpload }: { onGoToUpload: () => void }) {
  const { data: jds, isLoading: jdsLoading } = useListFacilityJDs();
  const { data: students, isLoading: studentsLoading } = useListFacilityStudents();
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [scheduleResult, setScheduleResult] = useState<{ scheduled: number; skipped: number; errors: string[] } | null>(null);
  const schedule = useScheduleInterviews();
  const { toast } = useToast();

  const toggleStudent = (id: string) => {
    const s = new Set(selectedStudentIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedStudentIds(s);
  };

  const toggleAll = () => {
    if (selectedStudentIds.size === (students?.length ?? 0)) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students?.map((s) => s.id) ?? []));
    }
  };

  const handleSchedule = async () => {
    if (!selectedJdId || selectedStudentIds.size === 0) return;
    try {
      const result = await schedule.mutateAsync({
        jdId: selectedJdId,
        studentIds: [...selectedStudentIds],
      });
      setScheduleResult(result);
      setSelectedStudentIds(new Set());
      toast({ title: `${result.scheduled} interviews scheduled` });
    } catch {
      toast({ title: "Failed to schedule interviews", variant: "destructive" });
    }
  };

  if (jdsLoading || studentsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!jds?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <FileText size={28} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-medium text-sm mb-1">No job descriptions yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Upload job descriptions first, then come back to schedule interviews.
        </p>
        <Button size="sm" variant="outline" onClick={onGoToUpload} className="gap-2">
          <Upload size={12} />
          Go to Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step 1: JD selector */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">1</span>
          Select job description
        </h3>
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {jds.map((jd) => (
            <label
              key={jd.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/40 transition-colors",
                selectedJdId === jd.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <input
                type="radio"
                name="jd"
                value={jd.id}
                checked={selectedJdId === jd.id}
                onChange={() => setSelectedJdId(jd.id)}
                className="hidden"
              />
              <div className={cn(
                "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                selectedJdId === jd.id ? "border-primary" : "border-border"
              )}>
                {selectedJdId === jd.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{jd.role}</p>
                {jd.company && <p className="text-xs text-muted-foreground">{jd.company}</p>}
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">{jd.experienceLevel}</Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Student selector */}
      {selectedJdId && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">2</span>
              Select students
              {selectedStudentIds.size > 0 && (
                <span className="text-xs text-muted-foreground font-normal">({selectedStudentIds.size} selected)</span>
              )}
            </h3>
            <button onClick={toggleAll} className="text-xs text-primary hover:underline">
              {selectedStudentIds.size === (students?.length ?? 0) ? "Deselect all" : "Select all"}
            </button>
          </div>

          {!students?.length ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No students yet — upload students first.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden max-h-72 overflow-y-auto">
              {students.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/40 transition-colors",
                    selectedStudentIds.has(s.id) && "bg-primary/5"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="hidden"
                  />
                  {selectedStudentIds.has(s.id)
                    ? <CheckSquare size={14} className="text-primary shrink-0" />
                    : <Square size={14} className="text-muted-foreground shrink-0" />
                  }
                  <span className="text-sm font-mono flex-1 truncate">{s.email}</span>
                  {s.fullName && <span className="text-xs text-muted-foreground shrink-0">{s.fullName}</span>}
                  {s.totalInterviews > 0 && (
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {s.totalInterviews} sessions
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <Button
            onClick={handleSchedule}
            disabled={schedule.isPending || selectedStudentIds.size === 0}
            className="gap-2"
          >
            {schedule.isPending
              ? <><Loader2 size={14} className="animate-spin" />Scheduling…</>
              : <><Calendar size={14} />Schedule {selectedStudentIds.size} interview{selectedStudentIds.size !== 1 ? "s" : ""}</>
            }
          </Button>
        </div>
      )}

      {scheduleResult && (
        <div className="rounded-xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 p-4 text-sm space-y-1">
          <p className="font-medium text-green-700 dark:text-green-400">
            {scheduleResult.scheduled} interview{scheduleResult.scheduled !== 1 ? "s" : ""} scheduled
            {scheduleResult.skipped > 0 && ` · ${scheduleResult.skipped} already existed`}
          </p>
          {scheduleResult.errors.length > 0 && (
            <p className="text-xs text-red-500">{scheduleResult.errors.slice(0, 3).join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reports tab ──────────────────────────────────────────────────────────── */
function ReportsTab() {
  const { data: stats, isLoading } = useGetFacilityStats();
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCohortReport();
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const cards = [
    { label: "Total students", value: isLoading ? "—" : String(stats?.totalStudents ?? 0), icon: GraduationCap },
    { label: "Avg. score", value: isLoading ? "—" : stats?.averageScore ? `${Math.round(stats.averageScore)}%` : "—", icon: TrendingUp },
    { label: "Completion rate", value: isLoading ? "—" : stats?.completionRate ? `${Math.round(stats.completionRate)}%` : "—", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
              <Icon size={13} className="text-primary" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold font-mono">{value}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold mb-1">Cohort interview report</h3>
            <p className="text-sm text-muted-foreground">
              Download a CSV with every student's interview history, scores, department, and last active date.
            </p>
          </div>
          <Button onClick={handleDownload} disabled={downloading} className="gap-2 shrink-0">
            {downloading
              ? <><Loader2 size={14} className="animate-spin" />Generating…</>
              : <><Download size={14} />Download CSV</>
            }
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/50 text-xs font-mono text-muted-foreground border-b border-border">
            CSV columns
          </div>
          <div className="px-4 py-3 text-xs font-mono text-muted-foreground leading-relaxed">
            Email · Full Name · Department · Year of Study · Total Interviews · Completed · Avg Score (%) · Last Active
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main panel ───────────────────────────────────────────────────────────── */
export default function FacilityPanel({ initialTab = "overview" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "reports", label: "Reports", icon: FileDown },
  ];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Building2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Facility Panel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage students, upload JDs, schedule interviews, and download reports
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 w-fit mb-6 flex-wrap">
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
        {tab === "upload" && <UploadTab />}
        {tab === "schedule" && <ScheduleTab onGoToUpload={() => setTab("upload")} />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </AppLayout>
  );
}
