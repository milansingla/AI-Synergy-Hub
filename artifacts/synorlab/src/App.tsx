import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, RedirectToSignIn, useAuth, useUser, useClerk, SignIn, SignUp } from "@clerk/react";
import { useGetUserProfile } from "@/hooks/api";
import Landing from "@/pages/landing";
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
  const { signOut } = useClerk();
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
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          Sign out and use a different email
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
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
  if (eduBlocked) return <EduEmailRequired email={primaryEmail} />;
  if (needsSetup) return <Spinner />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
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
  const { isSignedIn, isLoaded } = useAuth();
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
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
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

        <Route path="/sign-in">
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/dashboard" />
          </div>
        </Route>
        <Route path="/sign-in/:rest*">
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/dashboard" />
          </div>
        </Route>

        <Route path="/sign-up">
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/dashboard" />
          </div>
        </Route>
        <Route path="/sign-up/:rest*">
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/dashboard" />
          </div>
        </Route>

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

function ClerkWrappedApp() {
  const [, navigate] = useLocation();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ""}
      proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL as string | undefined}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      appearance={{
        variables: {
          colorPrimary: "#ED6C00",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FAFAFA",
          colorText: "#1A1A1A",
          colorTextSecondary: "#6b7280",
          colorNeutral: "#6b7280",
          colorInputText: "#1A1A1A",
          colorShimmer: "#F5F4F2",
          borderRadius: "0.375rem",
          fontFamily: "'Nunito', sans-serif",
        },
        elements: {
          card: {
            background: "#FFFFFF",
            border: "1px solid #E8E6E3",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          headerTitle: { color: "#1A1A1A", fontWeight: "700" },
          headerSubtitle: { color: "#6b7280" },
          socialButtonsBlockButton: {
            background: "#FAFAFA",
            border: "1px solid #E8E6E3",
            color: "#1A1A1A",
          },
          socialButtonsBlockButtonText: { color: "#1A1A1A" },
          dividerLine: { background: "#E8E6E3" },
          dividerText: { color: "#9ca3af" },
          formFieldLabel: { color: "#4b5563" },
          formFieldInput: {
            background: "#FFFFFF",
            border: "1px solid #E8E6E3",
            color: "#1A1A1A",
          },
          formButtonPrimary: {
            background: "#ED6C00",
            color: "#FFFFFF",
            fontWeight: "700",
          },
          footerActionText: { color: "#6b7280" },
          footerActionLink: { color: "#ED6C00" },
          identityPreviewText: { color: "#1A1A1A" },
          identityPreviewEditButton: { color: "#ED6C00" },
          formResendCodeLink: { color: "#ED6C00" },
          otpCodeFieldInput: {
            background: "#FAFAFA",
            border: "1px solid #E8E6E3",
            color: "#1A1A1A",
          },
        },
      }}
    >
      <AppRoutes />
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ClerkWrappedApp />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
