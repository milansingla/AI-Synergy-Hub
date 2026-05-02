import { Link } from "wouter";
import { ArrowRight, Check, X } from "lucide-react";
import { MarketingNav, MarketingFooter, MarketingStyles, marketingFont, NAVY, ORANGE } from "@/components/marketing-layout";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    sub: "Forever",
    cta: "Sign up free",
    href: "/sign-up",
    highlight: false,
    students: "Up to 50 students",
    features: [
      { text: "Unlimited practice sessions", yes: true },
      { text: "AI interview engine", yes: true },
      { text: "Instant scored feedback", yes: true },
      { text: "Basic student dashboard", yes: true },
      { text: "Cohort analytics", yes: false },
      { text: "CSV exports", yes: false },
      { text: "Bulk student invite", yes: false },
      { text: "Priority support", yes: false },
    ],
  },
  {
    name: "Professional",
    price: "£199",
    sub: "per month",
    cta: "Start free trial",
    href: "/sign-up",
    highlight: true,
    badge: "MOST POPULAR",
    students: "Up to 500 students",
    features: [
      { text: "Unlimited practice sessions", yes: true },
      { text: "AI interview engine", yes: true },
      { text: "Instant scored feedback", yes: true },
      { text: "Basic student dashboard", yes: true },
      { text: "Cohort analytics dashboard", yes: true },
      { text: "CSV exports", yes: true },
      { text: "Bulk student invite (CSV)", yes: true },
      { text: "Priority email support", yes: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "Contact us",
    cta: "Book a demo",
    href: "/contact",
    highlight: false,
    students: "Unlimited students",
    features: [
      { text: "Everything in Professional", yes: true },
      { text: "Unlimited students", yes: true },
      { text: "Dedicated success manager", yes: true },
      { text: "Custom branding / white-label", yes: true },
      { text: "LMS / SIS integration", yes: true },
      { text: "SLA & uptime guarantees", yes: true },
      { text: "On-site training sessions", yes: true },
      { text: "Custom reporting", yes: true },
    ],
  },
];

const FAQS = [
  {
    q: "Can students use Synorlab on their own after we onboard them?",
    a: "Yes — once a student is in your cohort, they can practice anytime, on any device, with any job description. There's no session limit.",
  },
  {
    q: "What happens if we exceed the student limit on Starter?",
    a: "You'll be prompted to upgrade to Professional. Existing students won't lose access; new invites will be paused until you upgrade.",
  },
  {
    q: "Is there a long-term contract for Professional?",
    a: "No. Professional is billed monthly and can be cancelled anytime. Enterprise contracts are annual and negotiated directly with us.",
  },
  {
    q: "Do you offer discounts for government universities?",
    a: "Yes — we offer special pricing for public universities and government-funded institutions. Contact us to discuss.",
  },
];

export default function Pricing() {
  return (
    <div style={{ fontFamily: marketingFont }} className="min-h-screen bg-white text-[#0D0D0D] overflow-x-hidden">
      <MarketingStyles />
      <MarketingNav />

      {/* ── HERO ── */}
      <section style={{ background: "white", padding: "80px 0 60px", borderBottom: "1px solid #EBEBEB" }}>
        <div className="max-w-screen-xl mx-auto px-8 text-center">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div style={{ width: "36px", height: "2px", background: ORANGE }} />
            <span style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em" }}>TRANSPARENT PRICING</span>
            <div style={{ width: "36px", height: "2px", background: ORANGE }} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem,6vw,5rem)", color: "#0D0D0D", lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "1.25rem" }}>
            Simple, honest <span style={{ color: NAVY }}>pricing.</span>
          </h1>
          <p style={{ color: "#666", fontSize: "clamp(0.95rem,1.5vw,1.1rem)", lineHeight: 1.75, maxWidth: "500px", margin: "0 auto" }}>
            Start free for small cohorts. Scale up when you need analytics, exports, and more students.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section style={{ background: "#F5F4F2" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? NAVY : "white",
                  border: plan.highlight ? "none" : "1px solid #EBEBEB",
                  borderTop: plan.highlight ? `4px solid ${ORANGE}` : `4px solid ${plan.name === "Enterprise" ? ORANGE : "#EBEBEB"}`,
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-1px", right: "24px", background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.6rem", letterSpacing: "0.12em", padding: "4px 10px" }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#888", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.12em", marginBottom: "8px" }}>{plan.name.toUpperCase()}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontWeight: 900, fontSize: "2.75rem", color: plan.highlight ? ORANGE : "#0D0D0D", letterSpacing: "-0.04em", lineHeight: 1 }}>{plan.price}</span>
                    {plan.price !== "Custom" && <span style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "#AAA", fontSize: "0.8rem" }}>{plan.sub}</span>}
                  </div>
                  {plan.price === "Custom" && <div style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "#888", fontSize: "0.78rem", marginTop: "4px" }}>{plan.sub}</div>}
                  <div style={{ marginTop: "12px", display: "inline-block", background: plan.highlight ? "rgba(237,108,0,0.15)" : "#F5F4F2", color: plan.highlight ? ORANGE : "#555", fontWeight: 700, fontSize: "0.7rem", padding: "4px 10px", borderRadius: "100px" }}>
                    {plan.students}
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map(({ text, yes }) => (
                    <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: yes ? (plan.highlight ? "rgba(237,108,0,0.15)" : "#EEF8F4") : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                        {yes
                          ? <Check size={10} color={plan.highlight ? ORANGE : "#059669"} strokeWidth={3} />
                          : <X size={10} color="#CCC" strokeWidth={3} />
                        }
                      </div>
                      <span style={{ fontSize: "0.82rem", color: yes ? (plan.highlight ? "rgba(255,255,255,0.85)" : "#333") : "#BBB", fontWeight: yes ? 500 : 400 }}>{text}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <button style={{
                    background: plan.highlight ? ORANGE : "transparent",
                    color: plan.highlight ? "white" : NAVY,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    padding: "0.85rem 1.5rem",
                    border: plan.highlight ? "none" : `2px solid ${NAVY}`,
                    borderRadius: plan.highlight ? 0 : "100px",
                    cursor: "pointer",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}>
                    {plan.cta.toUpperCase()} <ArrowRight size={13} />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE CALLOUT ── */}
      <section style={{ background: ORANGE }}>
        <div className="max-w-screen-xl mx-auto px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>LARGE INSTITUTION?</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem,3vw,2.5rem)", color: "white", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Placing 500+ students a year? Let's talk.
            </h2>
          </div>
          <Link href="/contact">
            <button style={{ background: "white", color: ORANGE, fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", flexShrink: 0 }}>
              CONTACT ENTERPRISE TEAM <ArrowRight size={13} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "white" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20">
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em", marginBottom: "1rem" }}>FREQUENTLY ASKED</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(1.75rem,3.5vw,3rem)", color: "#0D0D0D", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Common <span style={{ color: NAVY }}>questions.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQS.map(({ q, a }) => (
              <div key={q} style={{ borderTop: `3px solid ${ORANGE}`, paddingTop: "1.25rem" }}>
                <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0D0D0D", marginBottom: "0.75rem", lineHeight: 1.4 }}>{q}</h3>
                <p style={{ color: "#666", fontSize: "0.88rem", lineHeight: 1.75 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: NAVY }}>
        <div className="max-w-screen-xl mx-auto px-8 py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem,4vw,3.25rem)", color: "white", lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: "480px" }}>
            Start free. Upgrade when you're ready.
          </h2>
          <div style={{ display: "flex", gap: "12px", flexShrink: 0, flexWrap: "wrap" }}>
            <Link href="/sign-up">
              <button style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                GET STARTED FREE <ArrowRight size={13} />
              </button>
            </Link>
            <Link href="/contact">
              <button style={{ background: "transparent", color: "white", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "2px solid rgba(255,255,255,0.35)", borderRadius: "100px", cursor: "pointer", whiteSpace: "nowrap" }}>
                TALK TO SALES
              </button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
