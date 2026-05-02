import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

export const ORANGE = "#ED6C00";
export const NAVY = "#2639A6";

export const SynorLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" fill={NAVY} />
    <rect x="6" y="8" width="4" height="13" fill={ORANGE} />
    <rect x="12" y="5" width="4" height="16" fill="white" />
    <rect x="18" y="10" width="4" height="11" fill="white" opacity="0.6" />
  </svg>
);

export const marketingFont = "'Alexandria','Helvetica Neue',Arial,sans-serif";

export function MarketingStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;600;700;800;900&display=swap');
      @keyframes lp-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      .lp-marquee { animation: lp-marquee 28s linear infinite; display:flex; width:max-content; }
      .lp-marquee:hover { animation-play-state:paused; }
      @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      .lp-float { animation: lp-float 4.5s ease-in-out infinite; }
      @keyframes lp-float-r { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
      .lp-float-r { animation: lp-float-r 5s ease-in-out infinite; }
      @keyframes lp-rot { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      .lp-rot-slow { animation: lp-rot 18s linear infinite; transform-origin:center; }
      .lp-rot-slow-r { animation: lp-rot 22s linear infinite reverse; transform-origin:center; }
      @keyframes lp-dot-bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      .lp-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#ED6C00; animation: lp-dot-bounce 1.2s ease-in-out infinite; }
      @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      .lp-cursor { display:inline-block; width:2px; height:12px; background:#ED6C00; margin-left:4px; vertical-align:middle; animation: lp-blink 1s step-end infinite; }
      @keyframes lp-fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      .lp-fade-up { animation: lp-fade-up 0.4s ease forwards; }
      .lp-photo { overflow:hidden; position:relative; }
      .lp-photo img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.65s ease; }
      .lp-photo:hover img { transform:scale(1.05); }
      .lp-ol { position:absolute; inset:0; pointer-events:none; }
      .mk-nav-link { transition: color 0.15s; }
      .mk-nav-link:hover { color: #ED6C00 !important; }
      .mk-card { transition: transform 0.2s, box-shadow 0.2s; }
      .mk-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
      @keyframes lp-fade-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      .lp-fade-in { animation: lp-fade-in 0.5s ease forwards; }
    `}</style>
  );
}

const NAV_LINKS = [
  { href: "/features", label: "FEATURES" },
  { href: "/pricing", label: "PRICING" },
  { href: "/contact", label: "CONTACT" },
];

export function MarketingNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-white sticky top-0 z-50" style={{ borderBottom: "1px solid #EBEBEB" }}>
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-8" style={{ height: "64px" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <SynorLogo size={26} />
            <span style={{ color: NAVY, fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.06em" }}>
              SYNORLAB
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <span
                className="mk-nav-link"
                style={{
                  color: location === href ? ORANGE : "#555",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderBottom: location === href ? `2px solid ${ORANGE}` : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {label}
              </span>
            </Link>
          ))}
          <Link href="/sign-in">
            <span className="mk-nav-link" style={{ color: NAVY, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
              SIGN IN
            </span>
          </Link>
        </div>

        <Link href="/sign-up">
          <button style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", padding: "0.6rem 1.4rem", border: "none", borderRadius: 0, cursor: "pointer" }}>
            BOOK DEMO ↗
          </button>
        </Link>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer style={{ background: "white", borderTop: "1px solid #EBEBEB" }}>
      <div className="max-w-screen-xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SynorLogo size={22} />
              <span style={{ color: NAVY, fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.08em" }}>SYNORLAB</span>
            </div>
            <p style={{ color: "#888", fontSize: "0.78rem", lineHeight: 1.7 }}>
              AI-powered interview training for university placement departments.
            </p>
          </div>
          {/* Product */}
          <div>
            <div style={{ color: "#0D0D0D", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: "12px" }}>PRODUCT</div>
            {[["Features", "/features"], ["Pricing", "/pricing"], ["How It Works", "/features#how"]].map(([label, href]) => (
              <Link key={href} href={href}>
                <div style={{ color: "#666", fontSize: "0.8rem", fontWeight: 500, marginBottom: "8px", cursor: "pointer" }}>{label}</div>
              </Link>
            ))}
          </div>
          {/* Company */}
          <div>
            <div style={{ color: "#0D0D0D", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: "12px" }}>COMPANY</div>
            {[["Contact", "/contact"], ["Book a Demo", "/contact"], ["Sign In", "/sign-in"]].map(([label, href]) => (
              <Link key={`${label}-${href}`} href={href}>
                <div style={{ color: "#666", fontSize: "0.8rem", fontWeight: 500, marginBottom: "8px", cursor: "pointer" }}>{label}</div>
              </Link>
            ))}
          </div>
          {/* CTA */}
          <div>
            <div style={{ color: "#0D0D0D", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: "12px" }}>GET STARTED</div>
            <p style={{ color: "#888", fontSize: "0.78rem", lineHeight: 1.7, marginBottom: "12px" }}>
              Ready to improve your placement rates?
            </p>
            <Link href="/sign-up">
              <button style={{ background: ORANGE, color: "white", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", padding: "0.6rem 1.2rem", border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                START FREE <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #EBEBEB", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ color: "#bbb", fontSize: "0.7rem" }}>© 2025 Synorlab. AI interview training for university placement departments.</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {[["Privacy", "#"], ["Terms", "#"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: "#bbb", fontSize: "0.7rem", textDecoration: "none" }}>{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Shared design tokens ── */
export const featureH2Dark: React.CSSProperties = {
  fontWeight: 900, fontSize: "clamp(1.75rem,3vw,2.65rem)", color: "#0D0D0D",
  lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem",
};
export const featureH2Light: React.CSSProperties = {
  fontWeight: 900, fontSize: "clamp(1.75rem,3vw,2.65rem)", color: "white",
  lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem",
};
export const featureBodyDark: React.CSSProperties = {
  color: "#666", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1.75rem",
};
export const featureBodyLight: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1.75rem",
};

export function FeatureTag({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ color: ORANGE, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", marginBottom: "1.25rem" }}>
      {n} — {label}
    </div>
  );
}

export function BulletList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: dark ? "#444" : "rgba(255,255,255,0.8)", fontSize: "0.88rem", fontWeight: 600 }}>
          <span style={{ display: "block", width: "6px", height: "6px", background: ORANGE, borderRadius: "50%", flexShrink: 0 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}
