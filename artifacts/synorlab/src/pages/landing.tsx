import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { MarketingNav, MarketingFooter, MarketingStyles } from "@/components/marketing-layout";
import { usePageMeta } from "@/hooks/use-page-meta";

const MARQUEE = [
  "AI-POWERED MOCK INTERVIEWS",
  "JOB-SPECIFIC QUESTIONS",
  "INSTANT SCORED FEEDBACK",
  "PLACEMENT TRACKING",
  "COHORT DASHBOARDS",
  "UNLIMITED PRACTICE",
  "ZERO SETUP REQUIRED",
  "ADAPTIVE FOLLOW-UPS",
];

const QUESTIONS = [
  "Tell me about a time you led a team through a difficult challenge.",
  "How do you prioritise tasks when everything feels urgent?",
  "Walk me through a project where you had to learn quickly.",
  "Describe a situation where you disagreed with your manager.",
  "What makes you the right candidate for this role?",
];

function HeroAnimation() {
  const [qIdx, setQIdx] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setShowAnswer(false);
      setShowTyping(false);
      setTimeout(() => {
        setQIdx((i) => (i + 1) % QUESTIONS.length);
        setShowTyping(true);
      }, 600);
      setTimeout(() => {
        setShowTyping(false);
        setShowAnswer(true);
      }, 2400);
    };
    const id = setInterval(cycle, 6000);
    setShowTyping(true);
    setTimeout(() => { setShowTyping(false); setShowAnswer(true); }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "540px",
        background: "linear-gradient(135deg, #F8F7F5 0%, #EEF0FA 100%)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── Geometric background decorations ── */}
      <div className="lp-geo-sq lp-rot-slow" style={{
        position: "absolute", width: "220px", height: "220px",
        border: "2px solid rgba(38,57,166,0.12)", top: "-40px", right: "-40px",
      }} />
      <div className="lp-geo-sq lp-rot-slow-r" style={{
        position: "absolute", width: "140px", height: "140px",
        border: "2px solid rgba(237,108,0,0.18)", bottom: "30px", left: "20px",
      }} />
      <div className="lp-geo-sq" style={{
        position: "absolute", width: "80px", height: "80px",
        background: "rgba(237,108,0,0.08)", top: "60px", left: "40px",
      }} />
      <div className="lp-geo-sq lp-rot-slow" style={{
        position: "absolute", width: "50px", height: "50px",
        background: "#2639A6", opacity: 0.07, bottom: "80px", right: "60px",
      }} />
      {/* Dot grid */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: "4px", height: "4px",
          borderRadius: "50%",
          background: "#2639A6",
          opacity: 0.12,
          left: `${(i % 5) * 22 + 8}%`,
          top: `${Math.floor(i / 5) * 24 + 6}%`,
        }} />
      ))}
      {/* Orange diagonal stripe */}
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: "180px", height: "4px",
        background: "#ED6C00", opacity: 0.35,
        transform: "rotate(-35deg) translateY(40px) translateX(30px)",
      }} />
      <div style={{
        position: "absolute", bottom: "12px", right: 0,
        width: "120px", height: "2px",
        background: "#ED6C00", opacity: 0.2,
        transform: "rotate(-35deg) translateY(40px) translateX(30px)",
      }} />

      {/* ── Main interview card ── */}
      <div
        className="lp-float"
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(38,57,166,0.15), 0 4px 16px rgba(0,0,0,0.06)",
          width: "min(380px, 88%)",
          padding: "0",
          overflow: "hidden",
          zIndex: 10,
          position: "relative",
        }}
      >
        {/* Card header */}
        <div style={{
          background: "#2639A6",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <div style={{
            width: "34px", height: "34px",
            borderRadius: "50%",
            background: "#ED6C00",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "0.7rem", color: "white",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}>
            AI
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.82rem" }}>
              Synorlab Interviewer
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.67rem", marginTop: "1px" }}>
              Software Engineer — Google
            </div>
          </div>
          <div style={{
            background: "#ED6C00",
            color: "white",
            fontWeight: 800,
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            padding: "3px 8px",
            borderRadius: "100px",
          }}>
            LIVE
          </div>
        </div>

        {/* Chat area */}
        <div style={{ padding: "20px", minHeight: "180px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* AI message */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div style={{
              width: "24px", height: "24px",
              borderRadius: "50%",
              background: "#2639A6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "0.55rem", color: "white",
              flexShrink: 0, marginTop: "2px",
            }}>AI</div>
            <div style={{
              background: "#F0F2FC",
              borderRadius: "0 10px 10px 10px",
              padding: "10px 14px",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              color: "#1A1A1A",
              maxWidth: "86%",
              transition: "opacity 0.4s",
            }}>
              {QUESTIONS[qIdx]}
            </div>
          </div>

          {/* Student typing / answer */}
          {showTyping && (
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <div style={{
                background: "#FFF3E8",
                border: "1px solid rgba(237,108,0,0.2)",
                borderRadius: "10px 0 10px 10px",
                padding: "10px 16px",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                <span className="lp-dot" style={{ animationDelay: "0ms" }} />
                <span className="lp-dot" style={{ animationDelay: "160ms" }} />
                <span className="lp-dot" style={{ animationDelay: "320ms" }} />
              </div>
            </div>
          )}
          {showAnswer && (
            <div
              className="lp-fade-up"
              style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
            >
              <div style={{
                background: "#FFF3E8",
                border: "1px solid rgba(237,108,0,0.2)",
                borderRadius: "10px 0 10px 10px",
                padding: "10px 14px",
                fontSize: "0.78rem",
                lineHeight: 1.5,
                color: "#333",
                maxWidth: "86%",
              }}>
                In my last internship, I identified a bottleneck in our onboarding flow and worked cross-functionally to reduce drop-off by 40%...
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{
          borderTop: "1px solid #F0F0F0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#FAFAFA",
        }}>
          <div style={{
            flex: 1,
            height: "34px",
            borderRadius: "6px",
            background: "white",
            border: "1px solid #E8E8E8",
            display: "flex", alignItems: "center",
            paddingLeft: "12px",
            fontSize: "0.75rem",
            color: "#AAA",
          }}>
            Type your answer…
            <span className="lp-cursor" />
          </div>
          <div style={{
            width: "34px", height: "34px",
            background: "#ED6C00",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <ArrowRight size={14} color="white" />
          </div>
        </div>
      </div>

      {/* ── Floating badge: Score ── */}
      <div
        className="lp-float-r"
        style={{
          position: "absolute",
          top: "18%",
          right: "6%",
          background: "#ED6C00",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(237,108,0,0.3)",
          zIndex: 12,
        }}
      >
        <div style={{ color: "white", fontWeight: 900, fontSize: "1.2rem", lineHeight: 1 }}>92<span style={{ fontSize: "0.7rem" }}>/100</span></div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", marginTop: "3px" }}>YOUR SCORE</div>
      </div>

      {/* ── Floating badge: Placement ready ── */}
      <div
        className="lp-float"
        style={{
          position: "absolute",
          bottom: "16%",
          right: "5%",
          background: "white",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          border: "1px solid #EBEBEB",
          zIndex: 12,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animationDelay: "1s",
        }}
      >
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "50%",
          background: "#2639A6",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem",
          flexShrink: 0,
        }}>✓</div>
        <div>
          <div style={{ color: "#2639A6", fontWeight: 800, fontSize: "0.75rem" }}>Placement Ready</div>
          <div style={{ color: "#AAA", fontSize: "0.62rem", marginTop: "1px" }}>Assessment complete</div>
        </div>
      </div>

      {/* ── Floating badge: Sessions ── */}
      <div
        className="lp-float-r"
        style={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          background: "#2639A6",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(38,57,166,0.25)",
          zIndex: 12,
          animationDelay: "0.5s",
        }}
      >
        <div style={{ color: "#ED6C00", fontWeight: 900, fontSize: "1.1rem", lineHeight: 1 }}>2,000+</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", marginTop: "3px" }}>STUDENTS TRAINED</div>
      </div>
    </div>
  );
}

export default function Landing() {
  usePageMeta(
    "AI Mock Interview Platform for Indian Universities",
    "AI-powered mock interviews tailored to any job description. Instant scored feedback. Cohort dashboards for placement departments. Free for students with university email."
  );
  const { isSignedIn, isLoaded } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/dashboard");
  }, [isLoaded, isSignedIn, navigate]);

  const doubled = [...MARQUEE, ...MARQUEE];

  return (
    <div
      style={{ fontFamily: "'Alexandria','Helvetica Neue',Arial,sans-serif" }}
      className="min-h-screen bg-white text-[#0D0D0D] overflow-x-hidden"
    >
      <MarketingStyles />
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-white" style={{ minHeight: "calc(100vh - 64px)", display: "flex" }}>
        <div className="max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 64px)" }}>

          {/* Left — copy */}
          <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-8 lg:py-10">
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "2px", background: "#ED6C00", flexShrink: 0 }} />
              <span style={{ color: "#ED6C00", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em" }}>
                FOR PLACEMENT DEPARTMENTS
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.04em", marginBottom: "1.25rem" }}>
              <span style={{ display: "block", fontSize: "clamp(2.6rem,6vw,6.5rem)", color: "#0D0D0D" }}>PLACE</span>
              <span style={{ display: "block", fontSize: "clamp(2.6rem,6vw,6.5rem)", color: "#ED6C00" }}>MORE</span>
              <span style={{ display: "block", fontSize: "clamp(2.6rem,6vw,6.5rem)", color: "#2639A6" }}>STUDENTS.</span>
              <span style={{ display: "block", fontSize: "clamp(2.6rem,6vw,6.5rem)", color: "#0D0D0D" }}>FASTER.</span>
            </h1>

            {/* Sub */}
            <p style={{ color: "#555", fontSize: "clamp(0.85rem,1.2vw,1rem)", lineHeight: 1.7, maxWidth: "430px", marginBottom: "1.5rem" }}>
              Give every student unlimited AI-powered mock interview practice —
              tailored to their target role, scored instantly, with data your
              placement team can actually act on.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sign-up">
                <button style={{ background: "#ED6C00", color: "white", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", padding: "0.85rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  START FREE TRIAL <ArrowRight size={13} />
                </button>
              </Link>
              <Link href="/sign-in">
                <button style={{ background: "transparent", color: "#2639A6", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", padding: "0.85rem 2rem", border: "2px solid #2639A6", borderRadius: "100px", cursor: "pointer" }}>
                  SIGN IN
                </button>
              </Link>
            </div>

            {/* Social proof — initials avatars, no photos */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "1.5rem" }}>
              <div style={{ display: "flex" }}>
                {[
                  { initials: "AS", bg: "#ED6C00" },
                  { initials: "PK", bg: "#2639A6" },
                  { initials: "RJ", bg: "#4B5563" },
                  { initials: "MN", bg: "#059669" },
                ].map(({ initials, bg }, i) => (
                  <div key={i} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2.5px solid white", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.02em", marginLeft: i > 0 ? "-10px" : 0, zIndex: 4 - i, boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}>
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ color: "#ED6C00", fontWeight: 900, fontSize: "0.8rem" }}>★★★★★</div>
                <div style={{ color: "#888", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", marginTop: "2px" }}>
                  USED BY 200+ PLACEMENT TEAMS
                </div>
              </div>
            </div>
          </div>

          {/* Right — animated hero panel */}
          <div className="hidden lg:flex" style={{ width: "48%", minHeight: "calc(100vh - 64px)" }}>
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      <div style={{ background: "#ED6C00", overflow: "hidden", padding: "13px 0", borderTop: "3px solid #c45c00", borderBottom: "3px solid #c45c00" }}>
        <div className="lp-marquee">
          {doubled.map((item, i) => (
            <span key={i} style={{ color: "white", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.18em", whiteSpace: "nowrap", paddingRight: "40px" }}>
              {item}
              <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "40px" }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ background: "#2639A6" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3">
          {[
            { val: "2,000+", label: "Students Trained", sub: "Across partner institutions" },
            { val: "94%", label: "Satisfaction Rate", sub: "From post-session surveys" },
            { val: "3×", label: "More Practice Sessions", sub: "Than traditional coaching" },
          ].map(({ val, label, sub }, i) => (
            <div key={i} style={{ padding: "2rem 3rem", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.12)" : "none", textAlign: "center" }}>
              <div style={{ color: "#ED6C00", fontWeight: 900, fontSize: "clamp(2.75rem,6vw,5.5rem)", lineHeight: 1, letterSpacing: "-0.04em" }}>{val}</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em", marginTop: "8px" }}>{label}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500, fontSize: "0.72rem", marginTop: "4px" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features">
        {/* Feature 1 – white */}
        <div style={{ background: "white", minHeight: "520px" }} className="hidden md:grid">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div className="lp-photo">
              <img src="https://media.gettyimages.com/id/94146744/photo/new-delhi-india-delhi-university-students-wait-for-their-interviews-during-a-job-placement.jpg?s=612x612&w=0&k=20&c=NBrjw_YXGc9qnUxv6_3uuSuJK7GD8FqdMP6xZRbjrUI=" alt="Students at placement drive" />
              <div className="lp-ol" style={{ background: "linear-gradient(135deg, rgba(237,108,0,0.35) 0%, transparent 55%)" }} />
            </div>
            <div style={{ padding: "4rem 5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <FeatureTag n="01" label="ROLE-SPECIFIC TRAINING" />
              <h2 style={featureH2Dark}>
                Match practice to<br />every job.<br />
                <span style={{ color: "#2639A6" }}>Automatically.</span>
              </h2>
              <p style={featureBodyDark}>
                Students paste any job description from any company — our AI reads the role, required skills, and experience level, then builds a custom interview in seconds. No placement officer needed.
              </p>
              <FeatureList dark items={["Works for any industry or function", "Extracts skills, responsibilities & level", "New unique questions every session"]} />
            </div>
          </div>
        </div>
        <MobileFeature n="01" label="ROLE-SPECIFIC TRAINING" dark>
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>Match practice to<br /><span style={{ color: "#2639A6" }}>every job.</span></h2>
          <p style={featureBodyDark}>Paste any JD. AI builds a custom mock interview in seconds.</p>
        </MobileFeature>

        {/* Feature 2 – navy */}
        <div style={{ background: "#2639A6", minHeight: "520px" }} className="hidden md:grid">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div style={{ padding: "4rem 5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <FeatureTag n="02" label="AI INTERVIEW ENGINE" />
              <h2 style={featureH2Light}>
                Realistic.<br />Adaptive.<br />
                <span style={{ color: "#ED6C00" }}>Challenging.</span>
              </h2>
              <p style={featureBodyLight}>
                The AI conducts a full interview, asking follow-up questions and pressure-testing answers in real time — just like a real recruiter. Every student gets a genuinely challenging session.
              </p>
              <FeatureList items={["Unlimited practice, any time", "Adaptive follow-up questions", "Covers behavioural & technical rounds"]} />
            </div>
            <div className="lp-photo">
              <img src="https://media.gettyimages.com/id/1630774517/photo/a-confident-college-student-with-an-interviewer-giving-a-job-interview-discussing.jpg?s=612x612&w=0&k=20&c=lsIfQQ0US3SkkXAP7LQ0mrXPqToxnXu0X4X9PdFCPFE=" alt="Indian student in job interview" />
              <div className="lp-ol" style={{ background: "linear-gradient(135deg, rgba(38,57,166,0.5) 0%, transparent 55%)" }} />
            </div>
          </div>
        </div>
        <MobileFeature n="02" label="AI INTERVIEW ENGINE" light>
          <h2 style={{ ...featureH2Light, fontSize: "2rem" }}>Realistic.<br /><span style={{ color: "#ED6C00" }}>Challenging.</span></h2>
          <p style={featureBodyLight}>Full AI mock interviews that adapt in real time. Every session is genuinely challenging.</p>
        </MobileFeature>

        {/* Feature 3 – light */}
        <div style={{ background: "#F5F4F2", minHeight: "520px" }} className="hidden md:grid">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div className="lp-photo">
              <img src="https://media.gettyimages.com/id/1604037096/photo/three-indian-computer-engineering-college-students-from-the-odisha-region-study-together.jpg?s=612x612&w=0&k=20&c=zPY_tMfb3xUK2JFjvWTnkitwMQ5cYveSWCTd7q7J3fA=" alt="Indian engineering college students" />
              <div className="lp-ol" style={{ background: "linear-gradient(135deg, rgba(237,108,0,0.25) 0%, transparent 65%)" }} />
            </div>
            <div style={{ padding: "4rem 5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <FeatureTag n="03" label="PLACEMENT ANALYTICS" />
              <h2 style={featureH2Dark}>
                Know who's ready<br />before<br />
                <span style={{ color: "#ED6C00" }}>placements open.</span>
              </h2>
              <p style={featureBodyDark}>
                Your placement dashboard shows every student's readiness score, session history, and improvement trend — so you can coach those who need it most, before it's too late.
              </p>
              <FeatureList dark items={["Per-student readiness scores", "Cohort-wide placement dashboard", "Exportable progress reports"]} />
            </div>
          </div>
        </div>
        <MobileFeature n="03" label="PLACEMENT ANALYTICS" dark bg="#F5F4F2">
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>Know who's ready<br /><span style={{ color: "#ED6C00" }}>early.</span></h2>
          <p style={featureBodyDark}>Readiness scores and cohort dashboards so you can act before placements open.</p>
        </MobileFeature>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how" style={{ background: "white", borderTop: "1px solid #EBEBEB" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20">
          <div style={{ marginBottom: "3.5rem" }}>
            <div style={{ color: "#ED6C00", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "1rem" }}>THE PROCESS</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem,4.5vw,3.75rem)", color: "#0D0D0D", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Live in <span style={{ color: "#2639A6" }}>3 steps.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Onboard your students",
                body: "Share an access code or bulk-invite via CSV. Students sign up, complete a quick profile, and can start practising immediately — no IT setup needed.",
              },
              {
                n: "02",
                title: "AI coaches each student",
                body: "Students paste a job description from their target company. The AI runs a full personalised mock interview, adapting questions to every answer in real time.",
              },
              {
                n: "03",
                title: "You track & intervene",
                body: "Your placement dashboard surfaces who's improving, who's struggling, and who's placement-ready — so you can focus your time where it matters most.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ borderTop: "3px solid #ED6C00", paddingTop: "1.5rem" }}>
                <div style={{ fontWeight: 900, fontSize: "3.5rem", color: "#EBEBEB", lineHeight: 1, letterSpacing: "-0.05em", marginBottom: "0.75rem" }}>{n}</div>
                <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0D0D0D", letterSpacing: "-0.01em", marginBottom: "0.65rem" }}>{title}</h3>
                <p style={{ color: "#777", fontSize: "0.88rem", lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────────────── */}
      <section style={{ background: "#ED6C00" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center gap-12">
          <div style={{ width: "110px", height: "110px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "4px solid rgba(255,255,255,0.3)" }}>
            <img src="https://media.istockphoto.com/id/493250111/photo/young-indian-college-professor-sitting-with-books.jpg?s=612x612&w=0&k=20&c=NQ0_EZIMzQwTZc7CykD1jUai8d3HiLADATbl0DhA3rM=" alt="Dr. Priya Sharma" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "5rem", lineHeight: 0.65, fontWeight: 900, marginBottom: "0.5rem", fontFamily: "Georgia, serif" }}>"</div>
            <blockquote style={{ color: "white", fontWeight: 700, fontSize: "clamp(1.05rem,2.2vw,1.45rem)", lineHeight: 1.55, letterSpacing: "-0.01em", margin: 0, maxWidth: "660px" }}>
              Our placement rate jumped 28% in one semester. Students walk into interviews confident — they've already done it a dozen times with Synorlab.
            </blockquote>
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ color: "white", fontWeight: 800, fontSize: "0.88rem" }}>Dr. Priya Sharma</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", letterSpacing: "0.1em", marginTop: "2px" }}>
                HEAD OF PLACEMENTS, MUMBAI INSTITUTE OF TECHNOLOGY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ background: "#2639A6" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-24 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div>
            <div style={{ color: "#ED6C00", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "1.25rem" }}>GET STARTED TODAY</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem,4.5vw,3.75rem)", color: "white", lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: "560px" }}>
              Ready to transform your placement outcomes?
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", flexShrink: 0 }}>
            <Link href="/sign-up">
              <button style={{ background: "white", color: "#2639A6", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2.5rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                START FOR FREE <ArrowRight size={13} />
              </button>
            </Link>
            <a href="mailto:hello@synorlab.com" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", textAlign: "center" }}>
              OR EMAIL US FOR A DEMO
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────────────────── */

function FeatureTag({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ color: "#ED6C00", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "1.25rem" }}>
      {n} — {label}
    </div>
  );
}

function FeatureList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: dark ? "#444" : "rgba(255,255,255,0.8)", fontSize: "0.88rem", fontWeight: 600 }}>
          <span style={{ display: "block", width: "6px", height: "6px", background: "#ED6C00", borderRadius: "50%", flexShrink: 0 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function MobileFeature({ n, label, children, dark, light, bg }: {
  n: string; label: string; children: React.ReactNode;
  dark?: boolean; light?: boolean; bg?: string;
}) {
  const background = bg ?? (light ? "#2639A6" : "white");
  void dark; void light;
  return (
    <div className="md:hidden" style={{ padding: "3rem 2rem", background }}>
      <FeatureTag n={n} label={label} />
      {children}
    </div>
  );
}

/* ── Style constants ────────────────────────────────────────────────────── */

const featureH2Dark: React.CSSProperties = {
  fontWeight: 900,
  fontSize: "clamp(1.75rem,3vw,2.65rem)",
  color: "#0D0D0D",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  marginBottom: "1.25rem",
};

const featureH2Light: React.CSSProperties = {
  fontWeight: 900,
  fontSize: "clamp(1.75rem,3vw,2.65rem)",
  color: "white",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  marginBottom: "1.25rem",
};

const featureBodyDark: React.CSSProperties = {
  color: "#666",
  fontSize: "0.95rem",
  lineHeight: 1.8,
  marginBottom: "1.75rem",
};

const featureBodyLight: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  fontSize: "0.95rem",
  lineHeight: 1.8,
  marginBottom: "1.75rem",
};
