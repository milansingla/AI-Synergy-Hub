import { Link } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

const PHOTOS = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
];

const MARQUEE = [
  "AI-POWERED INTERVIEWS",
  "JOB-SPECIFIC QUESTIONS",
  "INSTANT SCORED FEEDBACK",
  "CAMPUS-WIDE DEPLOYMENT",
  "FACULTY DASHBOARDS",
  "PROGRESS TRACKING",
  "ZERO SETUP REQUIRED",
  "UNLIMITED PRACTICE",
];

const SynorLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" fill="#2639A6" />
    <rect x="6" y="8" width="4" height="13" fill="#ED6C00" />
    <rect x="12" y="5" width="4" height="16" fill="white" />
    <rect x="18" y="10" width="4" height="11" fill="white" opacity="0.6" />
  </svg>
);

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
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
      {/* ── Fonts & animations ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;600;700;800;900&display=swap');
        @keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .lp-marquee { animation: lp-marquee 26s linear infinite; display: flex; width: max-content; }
        .lp-marquee:hover { animation-play-state: paused; }
        .lp-photo { overflow: hidden; position: relative; }
        .lp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.65s ease; }
        .lp-photo:hover img { transform: scale(1.05); }
        .lp-ol { position: absolute; inset: 0; pointer-events: none; }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav
        className="bg-white sticky top-0 z-50"
        style={{ borderBottom: "1px solid #EBEBEB" }}
      >
        <div
          className="max-w-screen-xl mx-auto flex items-center justify-between px-8"
          style={{ height: "64px" }}
        >
          <div className="flex items-center gap-2">
            <SynorLogo size={26} />
            <span
              style={{
                color: "#2639A6",
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "0.06em",
              }}
            >
              SYNORLAB
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              ["#features", "FEATURES"],
              ["#how", "HOW IT WORKS"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  color: "#555",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  letterSpacing: "0.1em",
                }}
              >
                {label}
              </a>
            ))}
            <Link href="/sign-in">
              <span
                style={{
                  color: "#2639A6",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                SIGN IN
              </span>
            </Link>
          </div>

          <Link href="/sign-up">
            <button
              style={{
                background: "#ED6C00",
                color: "white",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                padding: "0.6rem 1.4rem",
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              BOOK DEMO ↗
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="bg-white"
        style={{ minHeight: "calc(100vh - 64px)", display: "flex" }}
      >
        <div
          className="max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row"
          style={{ minHeight: "calc(100vh - 64px)" }}
        >
          {/* Left — copy */}
          <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-16">
            {/* Eyebrow */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}
            >
              <div style={{ width: "36px", height: "2px", background: "#ED6C00", flexShrink: 0 }} />
              <span
                style={{
                  color: "#ED6C00",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                }}
              >
                FOR HR & UNIVERSITY TALENT TEAMS
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
                marginBottom: "2rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(3.25rem,8.5vw,8.5rem)",
                  color: "#0D0D0D",
                }}
              >
                HIRE
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(3.25rem,8.5vw,8.5rem)",
                  color: "#ED6C00",
                }}
              >
                INTERVIEW-
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(3.25rem,8.5vw,8.5rem)",
                  color: "#2639A6",
                }}
              >
                READY
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(3.25rem,8.5vw,8.5rem)",
                  color: "#0D0D0D",
                }}
              >
                GRADUATES.
              </span>
            </h1>

            {/* Sub */}
            <p
              style={{
                color: "#555",
                fontSize: "clamp(0.9rem,1.4vw,1.05rem)",
                lineHeight: 1.75,
                maxWidth: "430px",
                marginBottom: "2.25rem",
              }}
            >
              Deploy AI-powered mock interviews across your entire student cohort
              — instant feedback, data-driven progress tracking, zero extra
              headcount.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sign-up">
                <button
                  style={{
                    background: "#ED6C00",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    padding: "0.85rem 2rem",
                    border: "none",
                    borderRadius: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  START FREE TRIAL <ArrowRight size={13} />
                </button>
              </Link>
              <Link href="/sign-in">
                <button
                  style={{
                    background: "transparent",
                    color: "#2639A6",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    padding: "0.85rem 2rem",
                    border: "2px solid #2639A6",
                    borderRadius: "100px",
                    cursor: "pointer",
                  }}
                >
                  SIGN IN
                </button>
              </Link>
            </div>

            {/* Social proof */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "2.5rem",
              }}
            >
              <div style={{ display: "flex" }}>
                {PHOTOS.slice(0, 4).map((src, i) => (
                  <div
                    key={i}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      border: "2.5px solid white",
                      overflow: "hidden",
                      marginLeft: i > 0 ? "-10px" : 0,
                      zIndex: 4 - i,
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <div
                  style={{ color: "#ED6C00", fontWeight: 900, fontSize: "0.8rem" }}
                >
                  ★★★★★
                </div>
                <div
                  style={{
                    color: "#888",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    marginTop: "2px",
                  }}
                >
                  TRUSTED BY 200+ UNIVERSITIES
                </div>
              </div>
            </div>
          </div>

          {/* Right — photo grid */}
          <div
            className="hidden lg:grid"
            style={{
              width: "45%",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "4px",
              padding: "4px 4px 4px 0",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            {/* Photo A – orange overlay */}
            <div className="lp-photo">
              <img src={PHOTOS[0]} alt="Student 1" />
              <div
                className="lp-ol"
                style={{ background: "#ED6C00", mixBlendMode: "multiply", opacity: 0.5 }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                }}
              >
                CONFIDENT.
              </div>
            </div>

            {/* Photo B – gradient */}
            <div className="lp-photo">
              <img src={PHOTOS[1]} alt="Student 2" />
              <div
                className="lp-ol"
                style={{
                  background:
                    "linear-gradient(to top, rgba(38,57,166,0.55) 0%, transparent 55%)",
                }}
              />
            </div>

            {/* Photo C – subtle dark */}
            <div className="lp-photo">
              <img src={PHOTOS[2]} alt="Student 3" />
              <div
                className="lp-ol"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,13,13,0.4) 0%, transparent 60%)",
                }}
              />
            </div>

            {/* Photo D – navy card with big stat */}
            <div
              className="lp-photo"
              style={{ background: "#2639A6" }}
            >
              <img
                src={PHOTOS[3]}
                alt="Student 4"
                style={{ opacity: 0.25, position: "absolute", inset: 0 }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    color: "#ED6C00",
                    fontWeight: 900,
                    fontSize: "clamp(2.75rem,5vw,5rem)",
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                  }}
                >
                  94%
                </div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    letterSpacing: "0.14em",
                    textAlign: "center",
                    padding: "0 12px",
                  }}
                >
                  STUDENT SATISFACTION
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ED6C00",
          overflow: "hidden",
          padding: "13px 0",
          borderTop: "3px solid #c45c00",
          borderBottom: "3px solid #c45c00",
        }}
      >
        <div className="lp-marquee">
          {doubled.map((item, i) => (
            <span
              key={i}
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                whiteSpace: "nowrap",
                paddingRight: "40px",
              }}
            >
              {item}
              <span
                style={{
                  color: "rgba(255,255,255,0.35)",
                  marginLeft: "40px",
                }}
              >
                ◆
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ background: "#2639A6" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3">
          {[
            { val: "2,000+", label: "Students Onboarded", sub: "Across partner universities" },
            { val: "94%", label: "Satisfaction Rate", sub: "From post-session surveys" },
            { val: "8 min", label: "Average Session", sub: "Concise, focused practice" },
          ].map(({ val, label, sub }, i) => (
            <div
              key={i}
              style={{
                padding: "2rem 3rem",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#ED6C00",
                  fontWeight: 900,
                  fontSize: "clamp(2.75rem,6vw,5.5rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {val}
              </div>
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.02em",
                  marginTop: "8px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 500,
                  fontSize: "0.72rem",
                  marginTop: "4px",
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features">
        {/* Feature 1 – white, photo left */}
        <div
          style={{ background: "white", minHeight: "520px" }}
          className="hidden md:grid"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div className="lp-photo">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80"
                alt="Students learning"
              />
              <div
                className="lp-ol"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(237,108,0,0.35) 0%, transparent 55%)",
                }}
              />
            </div>
            <div
              style={{
                padding: "4rem 5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <FeatureTag n="01" label="JD PARSING" />
              <h2 style={featureH2Dark}>
                Any role.<br />Any company.<br />
                <span style={{ color: "#2639A6" }}>Instant questions.</span>
              </h2>
              <p style={featureBodyDark}>
                Paste any job description and our AI extracts the role, required
                skills, and seniority level — then generates hyper-relevant mock
                interview questions in seconds. No configuration. No templates.
              </p>
              <FeatureList
                dark
                items={[
                  "Supports any industry or function",
                  "Extracts skills, responsibilities & level",
                  "Unique questions every session",
                ]}
              />
            </div>
          </div>
        </div>
        {/* Mobile F1 */}
        <MobileFeature n="01" label="JD PARSING" dark>
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>
            Any role.<br />
            <span style={{ color: "#2639A6" }}>Instant questions.</span>
          </h2>
          <p style={featureBodyDark}>
            Paste any job description. AI generates hyper-relevant questions instantly.
          </p>
        </MobileFeature>

        {/* Feature 2 – navy, text left */}
        <div
          style={{ background: "#2639A6", minHeight: "520px" }}
          className="hidden md:grid"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div
              style={{
                padding: "4rem 5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <FeatureTag n="02" label="AI INTERVIEW ENGINE" />
              <h2 style={featureH2Light}>
                Conversational.<br />Adaptive.<br />
                <span style={{ color: "#ED6C00" }}>Relentless.</span>
              </h2>
              <p style={featureBodyLight}>
                Students engage in full mock interviews that adapt to their
                answers in real time — follow-up questions, pressure tests, and
                clarifications, all handled automatically. No two sessions are
                the same.
              </p>
              <FeatureList
                items={[
                  "Unlimited practice sessions",
                  "Real-time adaptive follow-ups",
                  "Covers behavioural & technical rounds",
                ]}
              />
            </div>
            <div className="lp-photo">
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80"
                alt="Student at laptop"
              />
              <div
                className="lp-ol"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(38,57,166,0.5) 0%, transparent 55%)",
                }}
              />
            </div>
          </div>
        </div>
        {/* Mobile F2 */}
        <MobileFeature n="02" label="AI INTERVIEW ENGINE" light>
          <h2 style={{ ...featureH2Light, fontSize: "2rem" }}>
            Conversational.<br />
            <span style={{ color: "#ED6C00" }}>Adaptive.</span>
          </h2>
          <p style={featureBodyLight}>
            Realistic AI mock interviews that adapt in real time. No two sessions
            are ever the same.
          </p>
        </MobileFeature>

        {/* Feature 3 – light, photo left */}
        <div
          style={{ background: "#F5F4F2", minHeight: "520px" }}
          className="hidden md:grid"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "520px" }}>
            <div className="lp-photo">
              <img
                src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=900&q=80"
                alt="Professional woman"
              />
              <div
                className="lp-ol"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(237,108,0,0.25) 0%, transparent 65%)",
                }}
              />
            </div>
            <div
              style={{
                padding: "4rem 5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <FeatureTag n="03" label="SCORED EVALUATIONS" />
              <h2 style={featureH2Dark}>
                Data-driven<br />feedback.<br />
                <span style={{ color: "#ED6C00" }}>Every time.</span>
              </h2>
              <p style={featureBodyDark}>
                After every session students receive an honest AI evaluation —
                strengths, specific improvements, score breakdown, and a hiring
                verdict. Faculty get aggregated dashboards to monitor cohort
                readiness.
              </p>
              <FeatureList
                dark
                items={[
                  "Per-answer scoring & detailed feedback",
                  "Faculty cohort dashboards",
                  "Exportable progress reports",
                ]}
              />
            </div>
          </div>
        </div>
        {/* Mobile F3 */}
        <MobileFeature n="03" label="SCORED EVALUATIONS" dark bg="#F5F4F2">
          <h2 style={{ ...featureH2Dark, fontSize: "2rem" }}>
            Data-driven<br />
            <span style={{ color: "#ED6C00" }}>feedback.</span>
          </h2>
          <p style={featureBodyDark}>
            Honest scored feedback for students. Cohort dashboards for faculty.
          </p>
        </MobileFeature>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section
        id="how"
        style={{ background: "white", borderTop: "1px solid #EBEBEB" }}
      >
        <div className="max-w-screen-xl mx-auto px-8 py-20">
          <div style={{ marginBottom: "3.5rem" }}>
            <div
              style={{
                color: "#ED6C00",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                marginBottom: "1rem",
              }}
            >
              THE PROCESS
            </div>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                color: "#0D0D0D",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Live in{" "}
              <span style={{ color: "#2639A6" }}>3 steps.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Onboard your cohort",
                body: "Share an access code or bulk-invite via CSV. Students sign up, complete a quick profile, and they're ready to practise.",
              },
              {
                n: "02",
                title: "Students practise with AI",
                body: "Upload any job description. The AI conducts a full mock interview, adapting questions to each answer in real time.",
              },
              {
                n: "03",
                title: "Track & improve",
                body: "Review per-student scores and cohort trends on your faculty dashboard. Identify who needs support before placement season.",
              },
            ].map(({ n, title, body }) => (
              <div
                key={n}
                style={{ borderTop: "3px solid #ED6C00", paddingTop: "1.5rem" }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "3.5rem",
                    color: "#EBEBEB",
                    lineHeight: 1,
                    letterSpacing: "-0.05em",
                    marginBottom: "0.75rem",
                  }}
                >
                  {n}
                </div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "#0D0D0D",
                    letterSpacing: "-0.01em",
                    marginBottom: "0.65rem",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{ color: "#777", fontSize: "0.88rem", lineHeight: 1.75 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────────────── */}
      <section style={{ background: "#ED6C00" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center gap-12">
          <div
            style={{
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: "4px solid rgba(255,255,255,0.3)",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=260&q=80"
              alt="HR Director"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "5rem",
                lineHeight: 0.65,
                fontWeight: 900,
                marginBottom: "0.5rem",
                fontFamily: "Georgia, serif",
              }}
            >
              "
            </div>
            <blockquote
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "clamp(1.05rem,2.2vw,1.45rem)",
                lineHeight: 1.55,
                letterSpacing: "-0.01em",
                margin: 0,
                maxWidth: "660px",
              }}
            >
              Synorlab gave our students 10× more interview practice than we
              could ever provide manually. Placement rates improved by 28% in
              one semester.
            </blockquote>
            <div style={{ marginTop: "1.25rem" }}>
              <div
                style={{ color: "white", fontWeight: 800, fontSize: "0.88rem" }}
              >
                Dr. Sarah Mitchell
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  marginTop: "2px",
                }}
              >
                DIRECTOR OF CAREER SERVICES, BOSTON UNIVERSITY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ background: "#2639A6" }}>
        <div
          className="max-w-screen-xl mx-auto px-8 py-24 flex flex-col lg:flex-row items-center justify-between gap-10"
        >
          <div>
            <div
              style={{
                color: "#ED6C00",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                marginBottom: "1.25rem",
              }}
            >
              GET STARTED TODAY
            </div>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                color: "white",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                maxWidth: "560px",
              }}
            >
              Ready to modernise your career centre?
            </h2>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px", flexShrink: 0 }}
          >
            <Link href="/sign-up">
              <button
                style={{
                  background: "white",
                  color: "#2639A6",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  letterSpacing: "0.1em",
                  padding: "1rem 2.5rem",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                DEPLOY FOR FREE <ArrowRight size={13} />
              </button>
            </Link>
            <a
              href="mailto:hello@synorlab.com"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              OR EMAIL US FOR A DEMO
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: "white", borderTop: "1px solid #EBEBEB" }}>
        <div
          className="max-w-screen-xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SynorLogo size={20} />
            <span
              style={{
                color: "#2639A6",
                fontWeight: 800,
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
              }}
            >
              SYNORLAB
            </span>
          </div>
          <p
            style={{ color: "#aaa", fontSize: "0.72rem", fontWeight: 500 }}
          >
            AI interview practice for universities — © 2025 Synorlab
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/sign-in">
              <span
                style={{
                  color: "#666",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                SIGN IN
              </span>
            </Link>
            <Link href="/sign-up">
              <span
                style={{
                  color: "#ED6C00",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                GET STARTED
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────────────────── */

function FeatureTag({ n, label }: { n: string; label: string }) {
  return (
    <div
      style={{
        color: "#ED6C00",
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.18em",
        marginBottom: "1.25rem",
      }}
    >
      {n} — {label}
    </div>
  );
}

function FeatureList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: dark ? "#444" : "rgba(255,255,255,0.8)",
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: "block",
              width: "6px",
              height: "6px",
              background: "#ED6C00",
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function MobileFeature({
  n,
  label,
  children,
  dark,
  light,
  bg,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
  dark?: boolean;
  light?: boolean;
  bg?: string;
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
