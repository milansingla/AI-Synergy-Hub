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
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle2, Loader2, Home, XCircle, Building2 } from "lucide-react";
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
  return (
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
            <Loader2 size={40} className="text-white/40 animate-spin" />
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

function IntroScreen({ role, company, onStart, warnings }: { role: string; company: string; onStart: () => void; warnings: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8">
      <div>
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          AI Voice Interview
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{role}</h1>
        {company && (
          <div className="flex items-center justify-center gap-1.5 text-white/50 text-sm mb-4">
            <Building2 size={13} />
            <span>{company}</span>
          </div>
        )}
        <p className="text-white/50 text-base max-w-md leading-relaxed mt-2">
          A structured AI interview with phases covering technical, behavioural, and situational competencies — all specific to this job description.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-lg w-full text-sm">
        {[
          { icon: "🎙️", label: "Speak naturally",  sub: "The AI will listen and respond in real time" },
          { icon: "📋", label: "Structured phases", sub: "Opening → Technical → Behavioural → Closing" },
          { icon: "📊", label: "6-dimension score", sub: "Evaluated against top HR standards" },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-white font-medium text-xs mb-1">{item.label}</p>
            <p className="text-white/40 text-xs">{item.sub}</p>
          </div>
        ))}
      </div>

      {warnings > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm">
          <AlertTriangle size={16} />
          {warnings} warning{warnings > 1 ? "s" : ""} — {3 - warnings} exit{3 - warnings === 1 ? "" : "s"} remaining before cancellation
        </div>
      )}

      <button
        onClick={onStart}
        className="group relative inline-flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1a] font-bold text-base px-10 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.03] active:scale-95"
      >
        <Mic size={20} />
        Begin Interview
      </button>
      <p className="text-white/25 text-xs">Ensure your microphone and speakers are enabled before starting</p>
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
    utterance.pitch = 1.0;
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
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onend = () => {
      const final = (transcriptRef.current + " " + interimRef.current).trim();
      transcriptRef.current = "";
      interimRef.current = "";
      setTDisplay("");
      setIDisplay("");
      recognitionRef.current = null;
      submitAnswer(final);
    };
    rec.stop();
  }, [submitAnswer]);

  /* ── STT start ───────────────────────────────────────────────────────────── */
  const startRecording = useCallback(() => {
    const w = window as AnyWindow;
    const SpeechRec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast({ title: "Speech recognition is not supported in this browser", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) { transcriptRef.current += final; setTDisplay(transcriptRef.current); }
      interimRef.current = interim;
      setIDisplay(interim);
    };
    recognition.onerror = () => { recognitionRef.current = null; setPhase("waiting"); };
    recognitionRef.current = recognition;
    setPhase("user-speaking");
    recognition.start();
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
    return () => { window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); interviewActiveRef.current = false; };
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
      {phase !== "intro" && phase !== "cancelled" && (
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
            onStart={startInterview}
            warnings={warnings}
          />
        </>
      )}

      {/* Cancelled */}
      {phase === "cancelled" && <CancelledScreen onGoHome={() => navigate("/")} />}

      {/* Active interview */}
      {phase !== "intro" && phase !== "cancelled" && (
        <div className="flex flex-1 min-h-0">
          {/* Center */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0 relative">
            <AIAvatar phase={phase} />

            <div className="h-10 flex items-center mt-6">
              {phase === "ai-speaking"  && <p className="text-white/50 text-sm tracking-wide animate-pulse">Interviewer is speaking…</p>}
              {phase === "waiting"      && <p className="text-cyan-400 text-sm font-medium">Your turn — press the mic to answer</p>}
              {phase === "user-speaking"&& <p className="text-emerald-400 text-sm font-medium animate-pulse">Listening — press stop when done</p>}
              {phase === "processing"   && <p className="text-white/40 text-sm">Processing your answer…</p>}
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
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Loader2 size={28} className="text-white/30 animate-spin" />
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
