import { Link } from "wouter";
import { Zap, Brain, BarChart3, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "Paste any job description",
    desc: "Our AI extracts the role, required skills, and experience level instantly.",
  },
  {
    icon: Brain,
    title: "AI-powered interview engine",
    desc: "Conversational questions tailored to the exact role — no two sessions are the same.",
  },
  {
    icon: BarChart3,
    title: "Actionable evaluations",
    desc: "Scored feedback on every answer: strengths, improvements, and an overall score.",
  },
];

const benefits = [
  "Tailored questions for every job description",
  "Instant, scored feedback after each session",
  "Track your progress over multiple sessions",
  "Role-based: student and admin access",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground">
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight">Synorlab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" data-testid="btn-sign-in">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" data-testid="btn-get-started">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-28 pb-24 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-3xl" />
        </div>

        <Badge variant="secondary" className="mb-6 font-mono text-xs text-primary border-primary/20 bg-primary/10">
          AI Interview Practice for Universities
        </Badge>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight mb-6">
          Practice interviews like a pro.{" "}
          <span className="text-primary">Get scored feedback</span>{" "}
          every time.
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
          Paste a real job description. Synorlab's AI interviewer asks you the right questions,
          then scores your answers with honest, detailed feedback.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 font-semibold" data-testid="btn-hero-cta">
              Start practicing <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" data-testid="btn-hero-signin">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Benefits */}
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 justify-center">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Built for real interview prep</h2>
          <p className="text-center text-muted-foreground mb-14 text-sm">
            From job description to scored feedback in minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                data-testid={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to ace your next interview?</h2>
          <p className="text-muted-foreground mb-8">
            Join students already using Synorlab to prepare smarter.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 font-semibold" data-testid="btn-footer-cta">
              Get started free <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="px-8 py-6 border-t border-border/40 text-center text-xs text-muted-foreground">
        Synorlab Interviewer — built for universities
      </footer>
    </div>
  );
}
