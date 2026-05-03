import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Clock, Users, BarChart3 } from "lucide-react";
import { MarketingNav, MarketingFooter, MarketingStyles, marketingFont, NAVY, ORANGE } from "@/components/marketing-layout";

const STUDENT_RANGES = ["< 100 students", "100–500 students", "500–1,000 students", "1,000–5,000 students", "5,000+ students"];
const ROLES = ["Placement Officer / TPO", "Head of Placements", "Dean / Director", "IT Administrator", "Other"];

type FormState = {
  name: string;
  institution: string;
  email: string;
  role: string;
  students: string;
  message: string;
};

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "", institution: "", email: "", role: "", students: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: marketingFont }} className="min-h-screen bg-white text-[#0D0D0D] overflow-x-hidden">
      <MarketingStyles />
      <style>{`
        .mk-input { width:100%; padding:12px 14px; border:1.5px solid #E0E0E0; outline:none; font-family:${marketingFont}; font-size:0.85rem; background:white; transition:border-color 0.15s; border-radius:0; }
        .mk-input:focus { border-color:${NAVY}; }
        .mk-input::placeholder { color:#BBB; }
        .mk-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; }
      `}</style>
      <MarketingNav />

      {/* ── HERO ── */}
      <section style={{ position: "relative", background: NAVY, padding: "64px 0 80px", overflow: "hidden" }}>
        {/* Background campus photo */}
        <img
          src="https://media.gettyimages.com/id/90559316/photo/india-students-at-indian-institute-of-management-campus-in-bannerghatta-road-bangalore.jpg?s=612x612&w=0&k=20&c=5s3ZdxCsqkv5q7o2LVjBkoveSUpvtPHi4OEqSW2Cn2U="
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: 0.18 }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${NAVY} 45%, transparent 100%)` }} />
        <div className="max-w-screen-xl mx-auto px-8" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div style={{ width: "36px", height: "2px", background: ORANGE }} />
            <span style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.2em" }}>GET IN TOUCH</span>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem,6vw,5rem)", color: "white", lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "1.25rem" }}>
            Let's talk <span style={{ color: ORANGE }}>placements.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(0.9rem,1.4vw,1.05rem)", lineHeight: 1.75, maxWidth: "480px" }}>
            Book a live demo, ask about pricing, or tell us about your institution. We typically respond within one business day.
          </p>
        </div>
      </section>

      {/* ── FORM + INFO ── */}
      <section style={{ background: "#F5F4F2" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Form column */}
            <div className="lg:col-span-2">
              <div style={{ background: "white", padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                {submitted ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ width: "64px", height: "64px", background: "#EEF8F4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.5rem" }}>✓</div>
                    <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#0D0D0D", letterSpacing: "-0.03em", marginBottom: "12px" }}>Message sent!</h2>
                    <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.75, maxWidth: "380px", margin: "0 auto 24px" }}>
                      Thank you, {form.name.split(" ")[0]}. We'll be in touch within one business day to set up your demo.
                    </p>
                    <Link href="/">
                      <button style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", padding: "0.75rem 1.75rem", border: "none", borderRadius: 0, cursor: "pointer" }}>
                        BACK TO HOME
                      </button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "28px" }}>
                      <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "8px" }}>BOOK A DEMO</div>
                      <h2 style={{ fontWeight: 900, fontSize: "1.75rem", color: "#0D0D0D", letterSpacing: "-0.03em" }}>Tell us about your institution</h2>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label style={labelStyle}>Your name *</label>
                          <input className="mk-input" required placeholder="Dr. Priya Sharma" value={form.name} onChange={set("name")} />
                        </div>
                        <div>
                          <label style={labelStyle}>Institution *</label>
                          <input className="mk-input" required placeholder="Mumbai Institute of Technology" value={form.institution} onChange={set("institution")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label style={labelStyle}>Work email *</label>
                          <input className="mk-input" type="email" required placeholder="priya@mit.ac.in" value={form.email} onChange={set("email")} />
                        </div>
                        <div>
                          <label style={labelStyle}>Your role *</label>
                          <select className="mk-input mk-select" required value={form.role} onChange={set("role") as React.ChangeEventHandler<HTMLSelectElement>}>
                            <option value="">Select a role</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Number of students to train</label>
                        <select className="mk-input mk-select" value={form.students} onChange={set("students") as React.ChangeEventHandler<HTMLSelectElement>}>
                          <option value="">Select a range</option>
                          {STUDENT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Message</label>
                        <textarea
                          className="mk-input"
                          rows={4}
                          placeholder="Tell us about your placement challenges, timeline, or any questions you have..."
                          style={{ resize: "vertical" }}
                          value={form.message}
                          onChange={set("message")}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.1em", padding: "1rem 2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
                      >
                        SEND MESSAGE <ArrowRight size={14} />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Info column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Contact info */}
              <div style={{ background: NAVY, padding: "28px", color: "white" }}>
                <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "20px" }}>CONTACT INFO</div>
                {[
                  { icon: Mail, label: "Email us", value: "hello@synorlab.com" },
                  { icon: Clock, label: "Response time", value: "Within 1 business day" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(237,108,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color={ORANGE} />
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "2px" }}>{label.toUpperCase()}</div>
                      <div style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick stats */}
              <div style={{ background: ORANGE, padding: "28px" }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "20px" }}>WHY SYNORLAB</div>
                {[
                  { icon: Users, stat: "2,000+", label: "Students trained" },
                  { icon: BarChart3, stat: "28%", label: "Avg. placement rate increase" },
                ].map(({ icon: Icon, stat, label }) => (
                  <div key={label} style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color="white" />
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: 900, fontSize: "1.3rem", lineHeight: 1 }}>{stat}</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", marginTop: "2px" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Already have an account */}
              <div style={{ background: "white", padding: "24px", border: "1px solid #EBEBEB" }}>
                <p style={{ color: "#555", fontSize: "0.82rem", lineHeight: 1.7, marginBottom: "14px" }}>
                  Already have an account? Sign in to your placement dashboard.
                </p>
                <Link href="/sign-in">
                  <button style={{ background: "transparent", color: NAVY, fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em", padding: "0.65rem 1.25rem", border: `2px solid ${NAVY}`, borderRadius: "100px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    SIGN IN <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO + TESTIMONIAL STRIP ── */}
      <section style={{ background: "#0D0D0D", overflow: "hidden" }}>
        {/* 2-photo row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "280px" }} className="hidden md:grid">
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src="https://media.gettyimages.com/id/1630774516/photo/a-confident-college-student-with-an-interviewer-giving-a-job-interview-discussing.jpg?s=612x612&w=0&k=20&c=T1CwvWtqWqErF4GFQwxEGJTzOuDmQhin3-zu7-lJ8CI="
              alt="Indian student in interview discussion"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(38,57,166,0.75) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", top: "50%", left: "2rem", transform: "translateY(-50%)" }}>
              <div style={{ color: ORANGE, fontWeight: 800, fontSize: "0.6rem", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>STUDENT SUCCESS</div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1.2 }}>Interview<br />confident.</div>
            </div>
          </div>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src="https://media.gettyimages.com/id/2028994471/photo/happy-female-business-professionals-enjoying-during-team-meeting-at-office.jpg?s=612x612&w=0&k=20&c=UnYNrrM5s1uSzPs6J60MddiBfUV56DJAHVaTRizhrbw="
              alt="Indian female professionals at office"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(237,108,0,0.7) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", top: "50%", left: "2rem", transform: "translateY(-50%)" }}>
              <div style={{ color: "rgba(255,255,255,0.8)", fontWeight: 800, fontSize: "0.6rem", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>CAREER READY</div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1.2 }}>Placed at<br />top companies.</div>
            </div>
          </div>
        </div>
        {/* Institution names bar */}
        <div style={{ padding: "32px 0" }}>
          <div className="max-w-screen-xl mx-auto px-8 text-center">
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "16px" }}>TRUSTED BY PLACEMENT DEPARTMENTS AT</p>
            <div style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Mumbai Institute of Technology", "Delhi College of Engineering", "VIT University", "BITS Pilani", "SRM Institute", "NIT Trichy"].map(name => (
                <span key={name} style={{ color: "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.04em" }}>{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#444",
  fontWeight: 700,
  fontSize: "0.72rem",
  letterSpacing: "0.08em",
  marginBottom: "6px",
};
