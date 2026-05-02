import { Link } from "wouter";
import { ArrowRight, FileText, Brain, BarChart3, Users, Download, RefreshCw, Shield, Zap } from "lucide-react";
import { MarketingNav, MarketingFooter, MarketingStyles, marketingFont, NAVY, ORANGE, BulletList, FeatureTag, featureH2Dark, featureH2Light, featureBodyDark, featureBodyLight } from "@/components/marketing-layout";

const FEATURES = [
  {
    icon: FileText,
    title: "Role-Specific Questions",
    desc: "Paste any job description and the AI builds a targeted interview in seconds — works for any industry, function, or seniority level.",
    color: ORANGE,
  },
  {
    icon: Brain,
    title: "Adaptive AI Engine",
    desc: "The AI listens, adapts, and follows up — just like a real interviewer. No two sessions are the same.",
    color: NAVY,
  },
  {
    icon: BarChart3,
    title: "Instant Scored Feedback",
    desc: "Every answer scored on clarity, depth, relevance, and communication. Students know exactly what to improve.",
    color: ORANGE,
  },
  {
    icon: Users,
    title: "Cohort Dashboard",
    desc: "See every student's readiness score, session count, and improvement trend in one placement-officer dashboard.",
    color: NAVY,
  },
  {
    icon: Download,
    title: "Exportable Reports",
    desc: "Download cohort-wide or per-student reports in CSV format — ready for your faculty meetings or TPO records.",
    color: ORANGE,
  },
  {
    icon: RefreshCw,
    title: "Unlimited Practice",
    desc: "Students can practise as many times as they like, at any time — 3 AM before a placement? No problem.",
    color: NAVY,
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Separate logins for students, placement officers, and admins. Everyone sees only what they need.",
    color: ORANGE,
  },
  {
    icon: Zap,
    title: "Bulk Onboarding",
    desc: "Invite your entire batch with one CSV upload. No manual setup. Students are practice-ready in minutes.",
    color: NAVY,
  },
];

export default function Features() {
  return (
    <div style={{ fontFamily: marketingFont }} className="min-h-screen bg-white text-[#0D0D0D] overflow-x-hidden">
      <MarketingStyles />
      <MarketingNav />

      {/* ── HERO ── */}
      <section style={{ background: NAVY, padding: "80px 0 100px" }}>
        <div className="max-w-screen-xl mx-auto px-8">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div style={{ width: "36px", height: "2px", background: ORANGE }} />
            <span style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em" }}>PLATFORM FEATURES</span>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "white", lineHeight: 0.95, letterSpacing: "-0.04em", maxWidth: "760px", marginBottom: "1.5rem" }}>
            Everything your placement<br />team{" "}
            <span style={{ color: ORANGE }}>needs.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "clamp(0.95rem,1.5vw,1.1rem)", lineHeight: 1.75, maxWidth: "520px", marginBottom: "2.5rem" }}>
            From student onboarding to placement analytics — Synorlab covers the full cycle of interview readiness training, with zero manual effort from your team.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/sign-up">
              <button style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", padding: "0.85rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                START FREE TRIAL <ArrowRight size={13} />
              </button>
            </Link>
            <Link href="/pricing">
              <button style={{ background: "transparent", color: "white", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", padding: "0.85rem 2rem", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "100px", cursor: "pointer" }}>
                VIEW PRICING
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section style={{ background: "white", borderBottom: "1px solid #EBEBEB" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20">
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "1rem" }}>FULL FEATURE LIST</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#0D0D0D", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Built for placement <span style={{ color: NAVY }}>at scale.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="mk-card" style={{ border: "1px solid #EBEBEB", padding: "24px", borderTop: `3px solid ${color}` }}>
                <div style={{ width: "40px", height: "40px", background: color === ORANGE ? "#FFF3E8" : "#EEF0FA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Icon size={18} color={color} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0D0D0D", letterSpacing: "-0.01em", marginBottom: "8px" }}>{title}</h3>
                <p style={{ color: "#666", fontSize: "0.82rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT 1 — JD Parsing ── */}
      <section id="how" style={{ background: "#F5F4F2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "540px" }} className="hidden md:grid max-w-screen-2xl mx-auto">
          <div style={{ padding: "5rem 5rem 5rem max(5rem, calc((100vw - 1280px)/2 + 5rem))", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <FeatureTag n="01" label="ROLE-SPECIFIC TRAINING" />
            <h2 style={featureH2Dark}>
              Paste a JD.<br />Get a custom<br />
              <span style={{ color: NAVY }}>interview instantly.</span>
            </h2>
            <p style={featureBodyDark}>
              Students paste the real job description from their target company — whether it's a global bank or a local startup. Our AI extracts the role, required skills, and seniority in seconds, then generates a custom set of mock interview questions. No templates. No configuration.
            </p>
            <BulletList dark items={["Works for any industry or company size", "Extracts 10+ skill signals from every JD", "Questions refresh each session for variety"]} />
          </div>
          {/* Visual */}
          <div style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
            <div style={{ width: "min(400px, 90%)", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ background: ORANGE, padding: "12px 20px" }}>
                <div style={{ color: "white", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.06em" }}>JOB DESCRIPTION PASTE</div>
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ background: "#F5F4F2", borderRadius: "8px", padding: "12px", fontSize: "0.75rem", color: "#666", lineHeight: 1.6, marginBottom: "16px", border: "1px dashed #DDD" }}>
                  "We're looking for a Software Engineer with 2+ years experience in React and Node.js, strong problem-solving skills, and experience in agile environments..."
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#EBEBEB" }} />
                  <span style={{ color: "#AAA", fontSize: "0.65rem", fontWeight: 700 }}>AI EXTRACTED</span>
                  <div style={{ flex: 1, height: "1px", background: "#EBEBEB" }} />
                </div>
                {[["Role", "Software Engineer"], ["Level", "Junior–Mid"], ["Skills", "React, Node.js, Agile"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F4F2" }}>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>{k}</span>
                    <span style={{ color: "#0D0D0D", fontSize: "0.75rem", fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: "16px", background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.1em", padding: "10px", textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  GENERATE INTERVIEW →
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="md:hidden" style={{ padding: "3rem 2rem" }}>
          <FeatureTag n="01" label="ROLE-SPECIFIC TRAINING" />
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>Paste a JD.<br /><span style={{ color: NAVY }}>Instant interview.</span></h2>
          <p style={featureBodyDark}>AI extracts the role and skills, then builds a custom mock interview in seconds.</p>
        </div>
      </section>

      {/* ── SPOTLIGHT 2 — AI Engine ── */}
      <section style={{ background: NAVY }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "540px" }} className="hidden md:grid max-w-screen-2xl mx-auto">
          {/* Visual */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
            <div style={{ width: "min(380px, 90%)", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
              <div style={{ background: "#1E2D8E", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.65rem", color: "white" }}>AI</div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "0.8rem" }}>Synorlab Interviewer</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Software Engineer — Google</div>
                </div>
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { from: "ai", text: "Walk me through a project where you had to learn a new technology quickly." },
                  { from: "user", text: "During my internship, I had to pick up GraphQL in two weeks for a major feature..." },
                  { from: "ai", text: "Interesting. What specific challenges did you face and how did you overcome them?" },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: m.from === "ai" ? "#F0F2FC" : "#FFF3E8", border: m.from === "user" ? "1px solid rgba(237,108,0,0.2)" : "none", borderRadius: m.from === "ai" ? "0 10px 10px 10px" : "10px 0 10px 10px", padding: "10px 14px", fontSize: "0.75rem", lineHeight: 1.5, color: "#1A1A1A", maxWidth: "82%" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                  {[0, 160, 320].map(d => <span key={d} className="lp-dot" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <FeatureTag n="02" label="AI INTERVIEW ENGINE" />
            <h2 style={featureH2Light}>
              Realistic.<br />Adaptive.<br />
              <span style={{ color: ORANGE }}>Relentless.</span>
            </h2>
            <p style={featureBodyLight}>
              Our AI conducts a real interview — not a quiz. It listens to each answer, asks intelligent follow-ups, probes for depth, and applies pressure when needed. Students face the same rigour as a real placement interview.
            </p>
            <BulletList items={["Behavioural, technical & situational questions", "Real-time adaptive follow-up questions", "Covers any domain — IT, finance, marketing, ops"]} />
          </div>
        </div>
        <div className="md:hidden" style={{ padding: "3rem 2rem", background: NAVY }}>
          <FeatureTag n="02" label="AI INTERVIEW ENGINE" />
          <h2 style={{ ...featureH2Light, fontSize: "2rem" }}>Realistic.<br /><span style={{ color: ORANGE }}>Relentless.</span></h2>
          <p style={featureBodyLight}>Full adaptive AI mock interviews. Behavioural, technical, situational — any domain.</p>
        </div>
      </section>

      {/* ── SPOTLIGHT 3 — Analytics ── */}
      <section style={{ background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "540px" }} className="hidden md:grid max-w-screen-2xl mx-auto">
          <div style={{ padding: "5rem 5rem 5rem max(5rem, calc((100vw - 1280px)/2 + 5rem))", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <FeatureTag n="03" label="PLACEMENT ANALYTICS" />
            <h2 style={featureH2Dark}>
              Know who's ready<br />before interviews<br />
              <span style={{ color: ORANGE }}>even open.</span>
            </h2>
            <p style={featureBodyDark}>
              Your placement dashboard gives you a live view of every student's readiness: scores per session, improvement trends, and a cohort-wide ranking. Intervene early, coach the students who need it most.
            </p>
            <BulletList dark items={["Per-student readiness scores & trends", "Cohort ranking & at-risk flags", "One-click CSV export for TPO records"]} />
          </div>
          {/* Dashboard visual */}
          <div style={{ background: "#F5F4F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
            <div style={{ width: "min(420px, 90%)", background: "white", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <div style={{ background: NAVY, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.06em" }}>COHORT DASHBOARD</span>
                <span style={{ background: ORANGE, color: "white", fontWeight: 700, fontSize: "0.6rem", padding: "3px 8px", borderRadius: "100px", letterSpacing: "0.08em" }}>LIVE</span>
              </div>
              <div style={{ padding: "16px" }}>
                {/* Mini stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  {[["47", "Total Students"], ["38", "Active"], ["9", "At Risk"]].map(([n, l]) => (
                    <div key={l} style={{ background: "#F8F7F5", padding: "10px 8px", textAlign: "center", borderRadius: "6px" }}>
                      <div style={{ color: NAVY, fontWeight: 900, fontSize: "1.3rem" }}>{n}</div>
                      <div style={{ color: "#888", fontSize: "0.6rem", marginTop: "2px" }}>{l}</div>
                    </div>
                  ))}
                </div>
                {/* Student rows */}
                {[
                  { name: "Arjun S.", score: 91, sessions: 8, trend: "+12", ready: true },
                  { name: "Priya K.", score: 78, sessions: 5, trend: "+8", ready: true },
                  { name: "Rohit M.", score: 52, sessions: 2, trend: "+3", ready: false },
                ].map(({ name, score, sessions, trend, ready }) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #F5F4F2" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: ready ? "#EEF0FA" : "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.6rem", color: ready ? NAVY : ORANGE, flexShrink: 0 }}>
                      {name.split(" ")[0][0]}{name.split(" ")[1][0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#0D0D0D" }}>{name}</div>
                      <div style={{ color: "#AAA", fontSize: "0.65rem" }}>{sessions} sessions</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, fontSize: "0.9rem", color: score >= 75 ? NAVY : ORANGE }}>{score}</div>
                      <div style={{ fontSize: "0.6rem", color: "#4CAF50", fontWeight: 700 }}>{trend}</div>
                    </div>
                    <div style={{ background: ready ? "#EEF8F4" : "#FFF3E8", color: ready ? "#059669" : ORANGE, fontWeight: 700, fontSize: "0.6rem", padding: "3px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                      {ready ? "✓ Ready" : "Needs work"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="md:hidden" style={{ padding: "3rem 2rem" }}>
          <FeatureTag n="03" label="PLACEMENT ANALYTICS" />
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>Know who's ready<br /><span style={{ color: ORANGE }}>early.</span></h2>
          <p style={featureBodyDark}>Readiness scores, cohort rankings, and at-risk flags — all in one dashboard.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: NAVY }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div>
            <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "1rem" }}>GET STARTED</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem,4vw,3.5rem)", color: "white", lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: "500px" }}>
              Ready to see it in action?
            </h2>
          </div>
          <div style={{ display: "flex", gap: "12px", flexShrink: 0, flexWrap: "wrap" }}>
            <Link href="/sign-up">
              <button style={{ background: "white", color: NAVY, fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                START FREE TRIAL <ArrowRight size={13} />
              </button>
            </Link>
            <Link href="/contact">
              <button style={{ background: "transparent", color: "white", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "2px solid rgba(255,255,255,0.35)", borderRadius: "100px", cursor: "pointer", whiteSpace: "nowrap" }}>
                BOOK A DEMO
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
