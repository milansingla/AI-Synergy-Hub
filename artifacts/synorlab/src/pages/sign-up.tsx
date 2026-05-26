import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Zap, MailCheck } from "lucide-react";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    // If session is null, email confirmation is required
    if (!data.session) { setNeedsConfirm(true); return; }
    navigate("/dashboard");
  }

  if (needsConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <MailCheck size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then sign in.
          </p>
          <Link href="/sign-in">
            <button className="w-full rounded-md bg-primary text-primary-foreground font-semibold py-2 text-sm hover:bg-primary/90 transition-colors">
              Go to sign in
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">Synorlab</span>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <h1 className="text-xl font-bold text-center mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Start practising interviews today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 rounded-md bg-red-50 border border-red-200 px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary text-primary-foreground font-semibold py-2 text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
