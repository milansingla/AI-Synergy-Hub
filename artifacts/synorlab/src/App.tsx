import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useGetUserProfile } from "@/hooks/api";
import Landing from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import { GraduationCap } from "lucide-react";

const NotFound = lazy(() => import("@/pages/not-found"));
const Features = lazy(() => import("@/pages/features"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Contact = lazy(() => import("@/pages/contact"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const JDNew = lazy(() => import("@/pages/jd-new"));
const InterviewsList = lazy(() => import("@/pages/interviews"));
const InterviewSession = lazy(() => import("@/pages/interview-session"));
const InterviewResults = lazy(() => import("@/pages/interview-results"));
const AdminPanel = lazy(() => import("@/pages/admin"));
const FacilityPanel = lazy(() => import("@/pages/facility"));
const Settings = lazy(() => import("@/pages/settings"));
const ProfileSetup = lazy(() => import("@/pages/profile-setup"));

const queryClient = new QueryClient();

const EDU_DOMAINS = [".edu", ".ac.in", ".edu.in", ".ac.uk", ".edu.au", ".ac.nz", ".ac.za"];
function isEducationalEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return EDU_DOMAINS.some((d) => lower.endsWith(d));
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function EduEmailRequired({ email }: { email: string }) {
  const { signOut } = useAuthContext();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 mb-6">
          <GraduationCap size={28} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">University email required</h1>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          The free plan is for individual students only and requires a university email address
          (<strong>.edu</strong>, <strong>.ac.in</strong>, <strong>.edu.in</strong>, etc.).
        </p>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 mb-4 text-sm">
          <span className="font-semibold text-foreground">{email}</span>
          <span className="ml-2 text-muted-foreground text-xs">is not a recognised university email</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          If your institution wants to onboard an entire placement cohort,{" "}
          <a href="/contact" className="underline text-primary font-medium">contact our team</a> for a Professional or Enterprise account — no .edu email needed.
        </p>
        <button
          onClick={() => signOut().then(() => window.location.href = "/sign-in")}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          Sign out and use a different email
        </button>
      </div>
    </div>
  );
}

function RedirectToSignIn() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/sign-in", { replace: true }); }, [navigate]);
  return <Spinner />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, user } = useAuthContext();
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetUserProfile();
  const [, navigate] = useLocation();

  const primaryEmail = user?.email ?? "";
  const needsSetup = isSignedIn && profile != null && !profile.profileCompleted;
  const eduBlocked =
    isSignedIn &&
    profile != null &&
    profile.role === "student" &&
    primaryEmail !== "" &&
    !isEducationalEmail(primaryEmail);

  useEffect(() => {
    if (needsSetup) navigate("/profile-setup", { replace: true });
  }, [needsSetup, navigate]);

  if (!isLoaded || (isSignedIn && profileLoading)) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (profileError) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-red-500 mb-2">Failed to load profile</p>
        <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 font-mono">{(profileError as Error).message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs text-primary underline">Retry</button>
      </div>
    </div>
  );
  if (eduBlocked) return <EduEmailRequired email={primaryEmail} />;
  if (needsSetup) return <Spinner />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const notAdmin = isSignedIn && profile != null && profile.role !== "admin";

  useEffect(() => {
    if (notAdmin) navigate("/dashboard", { replace: true });
  }, [notAdmin, navigate]);

  if (!isLoaded || profileLoading) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (notAdmin) return <Spinner />;

  return <>{children}</>;
}

function FacilityRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const notFacility =
    isSignedIn && profile != null && profile.role !== "facility" && profile.role !== "admin";

  useEffect(() => {
    if (notFacility) navigate("/dashboard", { replace: true });
  }, [notFacility, navigate]);

  if (!isLoaded || profileLoading) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (notFacility) return <Spinner />;

  return <>{children}</>;
}

function ProfileSetupRoute() {
  const { isSignedIn, isLoaded, user } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const primaryEmail = user?.email ?? "";
  const alreadyDone = isSignedIn && profile?.profileCompleted;
  const eduBlocked =
    isSignedIn &&
    profile != null &&
    profile.role === "student" &&
    primaryEmail !== "" &&
    !isEducationalEmail(primaryEmail);

  useEffect(() => {
    if (alreadyDone) navigate("/dashboard", { replace: true });
  }, [alreadyDone, navigate]);

  if (!isLoaded || (isSignedIn && profileLoading)) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (eduBlocked) return <EduEmailRequired email={primaryEmail} />;
  if (alreadyDone) return <Spinner />;

  return <ProfileSetup />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/features"><Features /></Route>
        <Route path="/pricing"><Pricing /></Route>
        <Route path="/contact"><Contact /></Route>

        <Route path="/sign-in"><SignInPage /></Route>
        <Route path="/sign-up"><SignUpPage /></Route>

        <Route path="/profile-setup">
          <ProfileSetupRoute />
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>

        <Route path="/jd/new">
          <ProtectedRoute><JDNew /></ProtectedRoute>
        </Route>

        <Route path="/interviews">
          <ProtectedRoute><InterviewsList /></ProtectedRoute>
        </Route>

        <Route path="/interviews/:id/results">
          <ProtectedRoute><InterviewResults /></ProtectedRoute>
        </Route>

        <Route path="/interviews/:id">
          <ProtectedRoute><InterviewSession /></ProtectedRoute>
        </Route>

        <Route path="/admin">
          <AdminRoute><AdminPanel /></AdminRoute>
        </Route>

        <Route path="/facility">
          <FacilityRoute><FacilityPanel /></FacilityRoute>
        </Route>

        <Route path="/facility/students">
          <FacilityRoute><FacilityPanel initialTab="students" /></FacilityRoute>
        </Route>

        <Route path="/settings">
          <ProtectedRoute><Settings /></ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
