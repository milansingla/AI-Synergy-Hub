import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetInterview,
  useRespondToInterview,
  useCompleteInterview,
  useStartScheduledInterview,
  getListInterviewsQueryKey,
  getGetInterviewStatsQueryKey,
} from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio } from "@/lib/ai";
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle2, Loader2, Home, XCircle, Building2, Mic2, LayoutList, BarChart2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Web Speech API type shims ────────────────────────────────────────────── */

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: ISpeechRecognitionEvent) => unknown) | null;
  onerror: ((ev: Event) => unknown) | null;
  onend: ((ev: Event) => unknown) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;
type AnyWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type Phase =
  | "loading"
  | "intro"
  | "system-check"
  | "ai-speaking"
  | "waiting"
  | "user-speaking"
  | "processing"
  | "complete"
  | "cancelled";

interface LocalMessage {
  role: "ai" | "user";
  content: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const isFemale = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    return (
      n.includes("female") ||
      n.includes("woman") ||
      n.includes("zira") ||
      n.includes("samantha") ||
      n.includes("victoria") ||
      n.includes("karen") ||
      n.includes("moira") ||
      n.includes("tessa") ||
      n.includes("fiona") ||
      n.includes("allison") ||
      n.includes("ava") ||
      n.includes("susan") ||
      n.includes("serena") ||
      n.includes("kate")
    );
  };
  return (
    voices.find((v) => v.lang === "en-US" && isFemale(v) && v.name.toLowerCase().includes("natural")) ||
    voices.find((v) => v.lang === "en-US" && isFemale(v) && !v.localService) ||
    voices.find((v) => v.lang === "en-US" && isFemale(v)) ||
    voices.find((v) => v.lang.startsWith("en") && isFemale(v)) ||
    voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("natural")) ||
    voices.find((v) => v.lang === "en-US" && !v.localService) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

const PHASE_LABELS = [
  { label: "Opening", color: "text-cyan-400", bg: "bg-cyan-500/20 border-cyan-500/30" },
  { label: "Technical", color: "text-violet-400", bg: "bg-violet-500/20 border-violet-500/30" },
  { label: "Behavioural", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" },
  { label: "Situational", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
  { label: "Closing", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/30" },
];

function getPhaseInfo(answeredCount: number, total: number) {
  if (total === 0) return PHASE_LABELS[0];
  const pct = answeredCount / total;
  if (pct === 0) return PHASE_LABELS[0];
  if (pct < 0.4) return PHASE_LABELS[1];
  if (pct < 0.65) return PHASE_LABELS[2];
  if (pct < 0.85) return PHASE_LABELS[3];
  return PHASE_LABELS[4];
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function AIAvatar({ phase }: { phase: Phase }) {
  const speaking = phase === "ai-speaking";
  const listening = phase === "user-speaking";
  const processing = phase === "processing";

  return (
    <>
      <style>{`
        @keyframes ring-pulse   { 0% { transform:scale(1);   opacity:0.6; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes ring-pulse-2 { 0% { transform:scale(1);   opacity:0.4; } 100% { transform:scale(1.9); opacity:0; } }
        @keyframes ring-pulse-3 { 0% { transform:scale(1);   opacity:0.25;} 100% { transform:scale(2.6); opacity:0; } }
        @keyframes mic-ring     { 0% { transform:scale(1);   opacity:0.5; } 100% { transform:scale(2);   opacity:0; } }
        .ring-1  { animation: ring-pulse   2s ease-out infinite; }
        .ring-2  { animation: ring-pulse-2 2s ease-out infinite 0.4s; }
        .ring-3  { animation: ring-pulse-3 2s ease-out infinite 0.8s; }
        .mic-ring{ animation: mic-ring     1.2s ease-out infinite; }
      `}</style>
      <div className="relative flex items-center justify-center w-48 h-48">
        {speaking && (
          <>
            <div className="ring-1 absolute inset-0 rounded-full bg-cyan-500/30" />
            <div className="ring-2 absolute inset-0 rounded-full bg-cyan-500/20" />
            <div className="ring-3 absolute inset-0 rounded-full bg-cyan-500/10" />
          </>
        )}
        {listening && (
          <>
            <div className="mic-ring absolute inset-0 rounded-full bg-emerald-500/30" />
            <div className="mic-ring absolute inset-0 rounded-full bg-emerald-500/20" style={{ animationDelay: "0.5s" }} />
          </>
        )}
        <div className={cn(
          "w-36 h-36 rounded-full flex items-center justify-center relative z-10 transition-all duration-500",
          speaking  ? "bg-gradient-to-br from-cyan-500/30   to-cyan-500/10   border-2 border-cyan-500/60   shadow-lg shadow-cyan-500/20"
          : listening ? "bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
          : processing ? "bg-white/5 border border-white/20"
          : "bg-white/5 border border-white/10"
        )}>
          {processing ? (
            <div className="flex items-end gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 bg-white/40 rounded-full animate-bounce" style={{ height: 24, animationDelay: `${i*0.15}s`, animationDuration:"0.8s" }} />
              ))}
            </div>
          ) : (
            <svg viewBox="0 0 64 64" className={cn("w-16 h-16 transition-colors duration-500", speaking ? "text-cyan-400" : listening ? "text-emerald-400" : "text-white/30")} fill="currentColor">
              <rect x="10" y="28" width="6" height={speaking?"16":"8"}  rx="3" className={cn(speaking?"animate-bounce":"")} style={speaking?{animationDelay:"0ms",  animationDuration:"0.6s"}:{}} />
              <rect x="20" y="20" width="6" height={speaking?"24":"16"} rx="3" className={cn(speaking?"animate-bounce":"")} style={speaking?{animationDelay:"120ms",animationDuration:"0.6s"}:{}} />
              <rect x="30" y="14" width="6" height={speaking?"36":"22"} rx="3" className={cn(speaking?"animate-bounce":"")} style={speaking?{animationDelay:"240ms",animationDuration:"0.6s"}:{}} />
              <rect x="40" y="20" width="6" height={speaking?"24":"16"} rx="3" className={cn(speaking?"animate-bounce":"")} style={speaking?{animationDelay:"120ms",animationDuration:"0.6s"}:{}} />
              <rect x="50" y="28" width="6" height={speaking?"16":"8"}  rx="3" className={cn(speaking?"animate-bounce":"")} style={speaking?{animationDelay:"0ms",  animationDuration:"0.6s"}:{}} />
            </svg>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

/* ─── SystemCheckScreen ─────────────────────────────────────────────────── */
type CheckStatus = "idle" | "running" | "pass" | "warn" | "fail";
interface CheckItem { id: string; label: string; desc: string; status: CheckStatus; detail: string; }

function SystemCheckScreen({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const INITIAL: CheckItem[] = [
    { id: "mic",     label: "Microphone Permission", desc: "Requesting access to your microphone",              status: "idle", detail: "" },
    { id: "audio",   label: "Audio Signal Quality",  desc: "Verifying microphone is capturing audio correctly", status: "idle", detail: "" },
    { id: "network", label: "Network Connectivity",  desc: "Testing connection to transcription servers",       status: "idle", detail: "" },
  ];

  const [checks, setChecks]   = useState<CheckItem[]>(INITIAL);
  const [allDone, setAllDone] = useState(false);
  const [anyFail, setAnyFail] = useState(false);
  const [volume, setVolume]   = useState(0);
  const [runKey, setRunKey]   = useState(0);

  const streamRef  = useRef<MediaStream | null>(null);
  const animRef    = useRef<number>(0);
  const isMounted  = useRef(true);

  const upd = (id: string, patch: Partial<CheckItem>) =>
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  useEffect(() => {
    isMounted.current = true;
    setChecks(INITIAL);
    setAllDone(false);
    setAnyFail(false);
    setVolume(0);

    (async () => {
      /* ── Step 1: Mic permission ─────────────────────────────────────── */
      upd("mic", { status: "running" });
      await delay(350);
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        upd("mic", { status: "pass", detail: "Permission granted — microphone is available" });
      } catch (e: unknown) {
        const name = (e as { name?: string })?.name ?? "";
        const denied = name === "NotAllowedError" || name === "PermissionDeniedError";
        upd("mic", { status: "fail", detail: denied ? "Permission denied — click the lock icon in the address bar to allow" : "No microphone device found" });
        if (!isMounted.current) return;
        setAnyFail(true); setAllDone(true); return;
      }
      await delay(250);

      /* ── Step 2: Audio signal ──────────────────────────────────────── */
      upd("audio", { status: "running" });
      let maxVol = 0;
      try {
        const ctx = new AudioContext();
        const src  = ctx.createMediaStreamSource(stream);
        const anal = ctx.createAnalyser();
        anal.fftSize = 256;
        src.connect(anal);
        const data = new Uint8Array(anal.frequencyBinCount);
        const t0   = Date.now();

        await new Promise<void>((res) => {
          const tick = () => {
            if (!isMounted.current) { res(); return; }
            anal.getByteFrequencyData(data);
            const avg  = data.reduce((a, b) => a + b, 0) / data.length;
            const norm = avg / 128;
            if (norm > maxVol) maxVol = norm;
            setVolume(norm);
            if (Date.now() - t0 > 3200) { res(); return; }
            animRef.current = requestAnimationFrame(tick);
          };
          animRef.current = requestAnimationFrame(tick);
        });

        setVolume(0);
        ctx.close().catch(() => {});

        if (maxVol > 0.02) {
          upd("audio", { status: "pass",  detail: `Signal detected — peak ${Math.round(maxVol * 100)}% — microphone is working` });
        } else {
          upd("audio", { status: "warn",  detail: "No audio detected — microphone may be muted or too far away" });
        }
      } catch {
        upd("audio", { status: "warn", detail: "Could not measure signal level — proceeding anyway" });
      }
      await delay(200);

      /* ── Step 3: Network latency ───────────────────────────────────── */
      upd("network", { status: "running" });
      try {
        const t0  = performance.now();
        await fetch("https://api.groq.com/openai/v1/models", { signal: AbortSignal.timeout(8000) });
        const ms  = Math.round(performance.now() - t0);
        if      (ms < 600)  upd("network", { status: "pass", detail: `Excellent — ${ms} ms latency` });
        else if (ms < 1800) upd("network", { status: "pass", detail: `Good — ${ms} ms latency` });
        else if (ms < 4000) upd("network", { status: "warn", detail: `Fair — ${ms} ms latency (transcription may be slightly slow)` });
        else                upd("network", { status: "warn", detail: `High latency — ${ms} ms (check your internet connection)` });
      } catch {
        upd("network", { status: "warn", detail: "Could not reach transcription servers — check internet connection" });
      }
      await delay(300);

      /* ── Done ──────────────────────────────────────────────────────── */
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if (!isMounted.current) return;
      setChecks((prev) => {
        const fail = prev.some((c) => c.status === "fail");
        setAnyFail(fail);
        setAllDone(true);
        return prev;
      });
    })();

    return () => {
      isMounted.current = false;
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const StatusIcon = ({ s }: { s: CheckStatus }) => {
    if (s === "idle")    return <div className="w-4 h-4 rounded-full border border-white/15 bg-white/[0.04]" />;
    if (s === "running") return <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />;
    if (s === "pass")    return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
    if (s === "warn")    return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
    return <XCircle size={16} className="text-rose-400 shrink-0" />;
  };

  const isAudioStep = (c: CheckItem) => c.id === "audio" && c.status === "running";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10">

      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30">System Verification</p>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Pre-Interview Check</h2>
        <p className="text-white/35 text-sm">Verifying your setup before the session begins</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-md flex flex-col gap-2.5">
        {checks.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "border rounded-lg px-5 py-4 transition-all duration-300",
              c.status === "running" ? "border-cyan-500/30   bg-cyan-500/[0.04]"
              : c.status === "pass"  ? "border-emerald-500/20 bg-emerald-500/[0.03]"
              : c.status === "fail"  ? "border-rose-500/25   bg-rose-500/[0.04]"
              : c.status === "warn"  ? "border-amber-500/20  bg-amber-500/[0.03]"
              : "border-white/[0.07] bg-white/[0.02]"
            )}
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 shrink-0"><StatusIcon s={c.status} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white/75 text-sm font-medium mb-0.5">
                  <span className="text-white/25 font-normal mr-1.5 text-xs">0{i + 1}</span>
                  {c.label}
                </p>
                <p className="text-white/30 text-xs leading-relaxed">
                  {c.status === "idle" || c.status === "running" ? c.desc : c.detail}
                </p>
                {isAudioStep(c) && (
                  <div className="mt-3">
                    <p className="text-white/25 text-[11px] mb-2">Speak a few words to verify your microphone…</p>
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(100, volume * 260)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {allDone && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {anyFail ? (
            <>
              <p className="text-rose-400/70 text-xs text-center">Fix the issues above, then retry.</p>
              <button
                onClick={() => { isMounted.current = true; setRunKey((k) => k + 1); }}
                className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] text-white/80 font-semibold text-sm px-8 py-3.5 rounded-lg transition-colors border border-white/[0.12]"
              >
                Retry Checks
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400/70 text-[11px]">
                <CheckCircle2 size={11} /> All checks passed — ready to begin
              </div>
              <button
                onClick={onPass}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-[#0a0f1a] font-semibold text-sm px-8 py-3.5 rounded-lg transition-colors duration-150"
              >
                <Mic size={15} /> Start Interview
              </button>
            </>
          )}
          <button
            onClick={onBack}
            className="text-white/20 hover:text-white/45 text-xs transition-colors mt-1"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

function IntroScreen({ role, company, onStart, warnings }: { role: string; company: string; onStart: () => void; warnings: number }) {
  const features = [
    {
      icon: <Mic2 size={16} className="text-white/60" />,
      label: "Voice Assessment",
      sub: "Respond naturally — AI evaluates content, clarity, and confidence",
    },
    {
      icon: <LayoutList size={16} className="text-white/60" />,
      label: "Structured Phases",
      sub: "Opening · Technical · Behavioural · Situational · Closing",
    },
    {
      icon: <BarChart2 size={16} className="text-white/60" />,
      label: "6-Dimension Scoring",
      sub: "Benchmarked against industry HR evaluation standards",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 max-w-xl">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30">
          Assessment Session
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight leading-snug">
          {role}
        </h1>
        {company && (
          <div className="flex items-center gap-1.5 text-white/40 text-sm">
            <Building2 size={12} />
            <span>{company}</span>
          </div>
        )}
        <p className="text-white/40 text-sm leading-relaxed mt-1 max-w-md">
          A structured interview across technical, behavioural, and situational competencies — tailored to this job description.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl w-full">
        {features.map((item) => (
          <div
            key={item.label}
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-left"
          >
            <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
              {item.icon}
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">{item.label}</p>
            <p className="text-white/35 text-xs leading-relaxed">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Divider + action */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {warnings > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-amber-400/90 text-xs w-full justify-center">
            <AlertTriangle size={13} />
            {warnings} warning{warnings > 1 ? "s" : ""} — {3 - warnings} exit{3 - warnings === 1 ? "" : "s"} remaining
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full inline-flex items-center justify-center gap-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-[#0a0f1a] font-semibold text-sm px-8 py-3.5 rounded-lg transition-colors duration-150"
        >
          <Mic size={15} />
          Begin Interview
        </button>

        <div className="flex items-center gap-4 text-white/20 text-[11px]">
          <span className="flex items-center gap-1"><Mic size={10} /> Microphone required</span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1"><Shield size={10} /> Session is private</span>
        </div>
      </div>

    </div>
  );
}

function CancelledScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
        <AlertTriangle size={36} className="text-rose-400" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white mb-3">Interview Cancelled</h2>
        <p className="text-white/50 max-w-sm leading-relaxed">
          You exited fullscreen mode 3 times. The interview has been cancelled to maintain integrity. Start a new session from your dashboard.
        </p>
      </div>
      <button onClick={onGoHome} className="bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/20">
        Back to Dashboard
      </button>
    </div>
  );
}

function EndInterviewModal({ onConfirm, onCancel, isLoading }: { onConfirm: () => void; onCancel: () => void; isLoading: boolean }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#151e30] border border-white/15 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5">
          <XCircle size={30} className="text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">End Interview?</h2>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          You'll receive a full evaluation based on your answers so far. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-xl transition-colors border border-white/15 text-sm"
          >
            Continue
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Ending...</> : "End & Evaluate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const interviewId = Number(id);

  const containerRef       = useRef<HTMLDivElement>(null);
  const recognitionRef     = useRef<ISpeechRecognition | null>(null);
  const recStoppedRef      = useRef(false);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const audioChunksRef     = useRef<Blob[]>([]);
  const micStreamRef       = useRef<MediaStream | null>(null);
  const interviewActiveRef = useRef(false);
  const warningsRef        = useRef(0);
  const transcriptRef      = useRef("");
  const interimRef         = useRef("");
  const lastAiContentRef   = useRef("");
  const phasePauseRef      = useRef<Phase>("waiting");
  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const voicesReadyRef     = useRef(false);

  const [phase, setPhase]                 = useState<Phase>("loading");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [transcriptDisplay, setTDisplay]  = useState("");
  const [interimDisplay, setIDisplay]     = useState("");
  const [textInput, setTextInput]         = useState("");
  const [warnings, setWarnings]           = useState(0);
  const [showWarning, setShowWarning]     = useState(false);
  const [showEndModal, setShowEndModal]   = useState(false);
  const [isEnding, setIsEnding]           = useState(false);

  const { data: interview, isLoading } = useGetInterview(interviewId, {
    query: { enabled: !!interviewId, queryKey: ["getInterview", interviewId], refetchInterval: false },
  });
  const respond        = useRespondToInterview();
  const complete       = useCompleteInterview();
  const startScheduled = useStartScheduledInterview();

  const answeredCount = localMessages.filter((m) => m.role === "user").length;
  const totalEstimated = localMessages.length > 0 ? Math.max(10, localMessages.filter((m) => m.role === "ai").length + 2) : 10;
  const phaseInfo = getPhaseInfo(answeredCount, totalEstimated);
  const progressPct = totalEstimated > 0 ? Math.min(100, Math.round((answeredCount / totalEstimated) * 100)) : 0;

  /* ── TTS ─────────────────────────────────────────────────────────────────── */
  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }, []);

  /* ── End interview (manual) ──────────────────────────────────────────────── */
  const handleEndInterview = useCallback(async () => {
    setIsEnding(true);
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    interviewActiveRef.current = false;
    setPhase("complete");
    try {
      await complete.mutateAsync({ id: interviewId });
      await queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInterviewStatsQueryKey() });
      document.exitFullscreen?.().catch(() => {});
      navigate(`/interviews/${interviewId}/results`);
    } catch {
      toast({ title: "Failed to generate evaluation", variant: "destructive" });
      setIsEnding(false);
      setShowEndModal(false);
    }
  }, [interviewId, complete, queryClient, navigate, toast]);

  /* ── Submit answer ───────────────────────────────────────────────────────── */
  const submitAnswer = useCallback(
    async (content: string) => {
      if (!content.trim()) { setPhase("waiting"); return; }
      setPhase("processing");
      setLocalMessages((prev) => [...prev, { role: "user", content }]);
      transcriptRef.current = "";
      interimRef.current = "";
      setTDisplay("");
      setIDisplay("");

      try {
        const result = await respond.mutateAsync({ id: interviewId, data: { content } });
        await queryClient.invalidateQueries({ queryKey: ["getInterview", interviewId] });

        const aiContent = result.content;
        lastAiContentRef.current = aiContent;
        setLocalMessages((prev) => [...prev, { role: "ai", content: aiContent }]);
        setPhase("ai-speaking");

        speak(aiContent, async () => {
          if (!interviewActiveRef.current) return;
          if (result.isComplete) {
            setPhase("complete");
            try {
              await complete.mutateAsync({ id: interviewId });
              await queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
              await queryClient.invalidateQueries({ queryKey: getGetInterviewStatsQueryKey() });
              interviewActiveRef.current = false;
              document.exitFullscreen?.().catch(() => {});
              navigate(`/interviews/${interviewId}/results`);
            } catch {
              toast({ title: "Failed to save evaluation", variant: "destructive" });
            }
          } else {
            setPhase("waiting");
          }
        });
      } catch {
        toast({ title: "Failed to process answer", variant: "destructive" });
        setPhase("waiting");
      }
    },
    [interviewId, respond, complete, speak, queryClient, navigate, toast]
  );

  /* ── STT stop ────────────────────────────────────────────────────────────── */
  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    setPhase("processing");
    setTDisplay("");

    mr.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
      mr.stream?.getTracks().forEach((t) => t.stop());

      try {
        const text = await transcribeAudio(blob);
        setTDisplay("");
        setIDisplay("");
        if (!text.trim()) {
          setPhase("waiting");
          toast({ title: "No speech detected", description: "Please speak clearly and try again.", variant: "destructive" });
          return;
        }
        submitAnswer(text);
      } catch (e) {
        setTDisplay("");
        setIDisplay("");
        toast({ title: "Transcription failed", description: String(e), variant: "destructive" });
        setPhase("waiting");
      }
    };

    mr.stop();
  }, [submitAnswer, toast]);

  /* ── STT start ───────────────────────────────────────────────────────────── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setPhase("user-speaking");
    } catch {
      toast({ title: "Microphone access denied", description: "Allow microphone access in browser settings.", variant: "destructive" });
    }
  }, [toast]);

  /* ── Fullscreen ──────────────────────────────────────────────────────────── */
  const enterFullscreen = useCallback(async () => {
    try {
      const el = containerRef.current!;
      await (el.requestFullscreen?.() ?? (el as Element & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.());
    } catch { /* ignored */ }
  }, []);

  const returnToFullscreen = useCallback(async () => {
    setShowWarning(false);
    await enterFullscreen();
    if (lastAiContentRef.current && phasePauseRef.current !== "user-speaking") {
      setPhase("ai-speaking");
      speak(lastAiContentRef.current, () => { if (interviewActiveRef.current) setPhase("waiting"); });
    } else {
      setPhase(phasePauseRef.current);
    }
  }, [enterFullscreen, speak]);

  /* ── Start interview ─────────────────────────────────────────────────────── */
  const startInterview = useCallback(async () => {
    const firstAiMsg = localMessages.find((m) => m.role === "ai");

    if (!firstAiMsg) {
      // Scheduled interview: no messages yet — generate first question server-side
      setPhase("processing");
      let firstContent: string;
      try {
        const result = await startScheduled.mutateAsync({ id: interviewId });
        firstContent = result.content;
        setLocalMessages([{ role: "ai", content: firstContent }]);
        lastAiContentRef.current = firstContent;
      } catch {
        setPhase("intro");
        toast({ title: "Failed to start interview. Please try again.", variant: "destructive" });
        return;
      }
      await enterFullscreen();
      interviewActiveRef.current = true;
      setPhase("ai-speaking");
      const doSpeak = () => speak(firstContent, () => { if (interviewActiveRef.current) setPhase("waiting"); });
      if (voicesReadyRef.current) doSpeak(); else setTimeout(doSpeak, 600);
      return;
    }

    await enterFullscreen();
    interviewActiveRef.current = true;
    lastAiContentRef.current = firstAiMsg.content;
    setPhase("ai-speaking");
    const doSpeak = () => speak(firstAiMsg.content, () => { if (interviewActiveRef.current) setPhase("waiting"); });
    if (voicesReadyRef.current) doSpeak(); else setTimeout(doSpeak, 600);
  }, [enterFullscreen, interviewId, localMessages, speak, startScheduled, toast]);

  /* ── Effects ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const ready = () => { voicesReadyRef.current = true; };
    if (window.speechSynthesis?.getVoices().length > 0) voicesReadyRef.current = true;
    window.speechSynthesis?.addEventListener("voiceschanged", ready);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", ready);
  }, []);

  useEffect(() => {
    if (!interview || phase !== "loading") return;
    if (interview.status === "completed") { navigate(`/interviews/${interviewId}/results`); return; }
    const msgs = interview.messages.map((m) => ({ role: m.role as "ai" | "user", content: m.content }));
    setLocalMessages(msgs);
    const lastAi = [...msgs].reverse().find((m) => m.role === "ai");
    if (lastAi) lastAiContentRef.current = lastAi.content;
    setPhase("intro");
  }, [interview, phase, interviewId, navigate]);

  useEffect(() => {
    const handleChange = () => {
      const inFs = !!document.fullscreenElement || !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      if (!inFs && interviewActiveRef.current) {
        const newCount = warningsRef.current + 1;
        warningsRef.current = newCount;
        setWarnings(newCount);
        window.speechSynthesis?.cancel();
        phasePauseRef.current = (phase as Phase) || "waiting";
        if (newCount >= 3) { interviewActiveRef.current = false; recognitionRef.current?.stop(); setPhase("cancelled"); }
        else setShowWarning(true);
      }
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => { document.removeEventListener("fullscreenchange", handleChange); document.removeEventListener("webkitfullscreenchange", handleChange); };
  }, [phase]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recStoppedRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      interviewActiveRef.current = false;
    };
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (isLoading || phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-screen h-screen bg-[#0a0f1a] flex flex-col overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Top bar */}
      {phase !== "intro" && phase !== "system-check" && phase !== "cancelled" && (
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[#0a0f1a]"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" /></svg>
            </div>
            <span className="text-white font-semibold text-sm">Synorlab</span>
            <span className="text-white/20">·</span>
            <span className="text-white/50 text-sm truncate max-w-[160px]">{interview?.role}</span>
            {interview?.company && (
              <>
                <span className="text-white/20">@</span>
                <span className="text-white/40 text-sm truncate max-w-[120px]">{interview.company}</span>
              </>
            )}
          </div>

          {/* Center: phase + progress */}
          <div className="flex items-center gap-3">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", phaseInfo.bg, phaseInfo.color)}>
              {phaseInfo.label}
            </span>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/70 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-white/30 font-mono">{answeredCount} / ~{totalEstimated}</span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {warnings > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full px-3 py-1 text-xs font-medium">
                <AlertTriangle size={11} /> {warnings}/3
              </div>
            )}
            {(phase === "waiting" || phase === "user-speaking" || phase === "ai-speaking") && (
              <button
                onClick={() => { window.speechSynthesis?.cancel(); setShowEndModal(true); }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 rounded-full px-3 py-1.5 transition-colors"
                title="End interview"
              >
                <XCircle size={12} /> End
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors"
              title="Go to homepage"
            >
              <Home size={12} /> Home
            </button>
          </div>
        </header>
      )}

      {/* Intro */}
      {phase === "intro" && (
        <>
          <header className="flex items-center justify-between px-8 py-5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[#0a0f1a]"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" /></svg>
              </div>
              <span className="text-white font-semibold text-sm">Synorlab</span>
            </div>
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Home size={13} /> Home
            </button>
          </header>
          <IntroScreen
            role={interview?.role ?? "Interview"}
            company={(interview as any)?.company ?? ""}
            onStart={() => setPhase("system-check")}
            warnings={warnings}
          />
        </>
      )}

      {/* System Check */}
      {phase === "system-check" && (
        <>
          <header className="flex items-center justify-between px-8 py-5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[#0a0f1a]"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" /></svg>
              </div>
              <span className="text-white font-semibold text-sm">Synorlab</span>
            </div>
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Home size={13} /> Home
            </button>
          </header>
          <SystemCheckScreen onPass={startInterview} onBack={() => setPhase("intro")} />
        </>
      )}

      {/* Cancelled */}
      {phase === "cancelled" && <CancelledScreen onGoHome={() => navigate("/")} />}

      {/* Active interview */}
      {phase !== "intro" && phase !== "system-check" && phase !== "cancelled" && (
        <div className="flex flex-1 min-h-0">
          {/* Center */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0 relative">
            <AIAvatar phase={phase} />

            <div className="h-10 flex items-center mt-6">
              {phase === "ai-speaking"  && <p className="text-white/50 text-sm tracking-wide animate-pulse">Interviewer is speaking…</p>}
              {phase === "waiting"      && <p className="text-cyan-400 text-sm font-medium">Your turn — press the mic to answer</p>}
              {phase === "user-speaking"&& <p className="text-emerald-400 text-sm font-medium animate-pulse">🔴 Recording your voice — press the red button when done speaking</p>}
              {phase === "processing"   && <p className="text-white/40 text-sm animate-pulse">Thinking…</p>}
              {phase === "complete"     && <p className="text-cyan-400 text-sm font-medium">Generating your evaluation…</p>}
            </div>

            {phase === "user-speaking" && (transcriptDisplay || interimDisplay) && (
              <div className="mt-3 max-w-sm text-center">
                <p className="text-sm text-white/70 leading-relaxed">
                  {transcriptDisplay}<span className="text-white/30">{interimDisplay}</span>
                </p>
              </div>
            )}

            <div className="mt-8">
              {phase === "waiting" && (
                <button onClick={startRecording} className="w-20 h-20 rounded-full bg-cyan-500 hover:bg-cyan-400 transition-all duration-200 flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95" title="Start speaking">
                  <Mic size={32} className="text-[#0a0f1a]" />
                </button>
              )}
              {phase === "user-speaking" && (
                <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-400 transition-all duration-200 flex items-center justify-center shadow-xl shadow-rose-500/30" title="Stop and submit">
                  <MicOff size={32} className="text-white" />
                </button>
              )}
              {phase === "processing" && (
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-50">
                  <div className="flex items-end gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ height: 14, animationDelay: `${i*0.15}s`, animationDuration:"0.8s" }} />
                    ))}
                  </div>
                </div>
              )}
              {phase === "ai-speaking" && (
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Volume2 size={28} className="text-cyan-400/60" />
                </div>
              )}
              {phase === "complete" && (
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-cyan-400" />
                </div>
              )}
            </div>

            {phase === "user-speaking" && (
              <p className="mt-4 text-xs text-white/25">Speak your answer, then press the red button to submit</p>
            )}
          </div>

          {/* Transcript sidebar */}
          <div className="w-72 xl:w-80 border-l border-white/[0.07] flex flex-col shrink-0">
            <div className="px-5 py-3.5 border-b border-white/[0.07] shrink-0">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Transcript</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-xs">
              {localMessages.map((msg, i) => (
                <div key={i}>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-widest mb-1.5", msg.role === "ai" ? "text-cyan-500/50" : "text-emerald-500/50")}>
                    {msg.role === "ai" ? "Interviewer" : "You"}
                  </p>
                  <p className={cn("leading-relaxed", msg.role === "ai" ? "text-white/65" : "text-white/50")}>
                    {msg.content}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen warning */}
      {showWarning && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#151e30] border border-amber-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={30} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Fullscreen Required</h2>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">You must stay in fullscreen mode for the duration of the interview.</p>
            <div className={cn("inline-block text-sm font-semibold rounded-full px-4 py-1.5 mb-6", warnings >= 2 ? "bg-rose-500/15 border border-rose-500/30 text-rose-400" : "bg-amber-500/10 border border-amber-500/25 text-amber-400")}>
              Warning {warnings} of 3{warnings >= 2 ? " — next exit cancels interview" : ""}
            </div>
            <button onClick={returnToFullscreen} className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1a] font-bold py-3 rounded-xl transition-colors text-sm">
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* End interview modal */}
      {showEndModal && (
        <EndInterviewModal
          onConfirm={handleEndInterview}
          onCancel={() => setShowEndModal(false)}
          isLoading={isEnding}
        />
      )}
    </div>
  );
}
