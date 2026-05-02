import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import {
  Zap,
  Brain,
  BarChart3,
  FileText,
  ArrowRight,
  CheckCircle2,
  Users,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Paste any job description",
    desc: "Our AI extracts the role, required skills, and experience level instantly — no setup needed.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Brain,
    title: "AI-powered interview engine",
    desc: "Conversational questions tailored to the exact role. No two sessions are ever the same.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart3,
    title: "Actionable evaluations",
    desc: "Scored feedback on every answer: strengths, improvements, and an honest overall verdict.",
    color: "bg-violet-50 text-violet-600",
  },
];

const stats = [
  { value: "500+", label: "Students onboarded" },
  { value: "12k+", label: "Practice sessions" },
  { value: "94%", label: "Satisfaction rate" },
];

const benefits = [
  "Tailored questions for every job description",
  "Instant, scored feedback after each session",
  "Track progress over multiple sessions",
  "Role-based access: student and faculty",
];

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Navigation ── */}
      <nav className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground shadow-sm">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-foreground">Synorlab</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-semibold text-foreground/70 hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-bold bg-primary hover:bg-primary/90 text-white shadow-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-14">
          {/* Left */}
          <div className="flex-1 text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mb-6">
              <Star size={10} fill="currentColor" /> AI Interview Practice for Universities
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground mb-5">
              Practice interviews<br />
              <span className="text-primary">like a pro.</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Paste a real job description. Synorlab's AI interviewer asks you the right questions,
              then scores your answers with honest, detailed feedback — instantly.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                  Start practising free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="font-semibold border-border">
                  Sign in
                </Button>
              </Link>
            </div>
            {/* Benefits list */}
            <div className="mt-8 flex flex-col gap-2">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock card */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-background border border-border rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Synorlab AI Interviewer</p>
                  <p className="text-xs text-muted-foreground">Product Manager — TechCorp</p>
                </div>
                <span className="ml-auto text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Live</span>
              </div>
              {[
                { role: "ai", msg: "Tell me about a time you led a cross-functional team through ambiguity. What was your approach?" },
                { role: "user", msg: "In my last role, I led a 6-person team building a new payments feature. I set up weekly syncs and clear OKRs..." },
                { role: "ai", msg: "Good structure. How did you handle disagreements between engineering and design?" },
              ].map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${m.role === "ai" ? "bg-primary text-white" : "bg-blue-100 text-blue-700"}`}>
                    {m.role === "ai" ? "AI" : "You"}
                  </div>
                  <div className={`text-xs leading-relaxed rounded-lg px-3 py-2 max-w-[80%] ${m.role === "ai" ? "bg-secondary text-foreground" : "bg-primary/10 text-foreground"}`}>
                    {m.msg}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border">
                <div className="flex-1 h-8 rounded-md bg-secondary border border-border text-xs px-3 flex items-center text-muted-foreground">
                  Type your answer…
                </div>
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <ArrowRight size={13} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 divide-x divide-white/20">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center px-6">
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-xs text-white/75 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-background border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-foreground mb-3">Built for real interview prep</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              From job description to scored feedback in minutes. No fluff, no generic questions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center mb-5`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-white border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">For universities</span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">
              Ready to ace your next interview?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Join students and educators already using Synorlab to prepare smarter, score higher, and land better roles.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-md w-full">
                Get started free <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="font-semibold w-full border-border">
                Sign in to your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-background border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Zap size={10} className="text-primary" />
            </div>
            <span className="text-xs font-bold text-foreground/60">Synorlab</span>
          </div>
          <p className="text-xs text-muted-foreground">Built for universities · AI interview practice</p>
        </div>
      </footer>
    </div>
  );
}
