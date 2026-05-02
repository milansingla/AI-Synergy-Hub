import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, RedirectToSignIn, useAuth, SignIn, SignUp } from "@clerk/react";
import { useGetUserProfile } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import JDNew from "@/pages/jd-new";
import InterviewsList from "@/pages/interviews";
import InterviewSession from "@/pages/interview-session";
import InterviewResults from "@/pages/interview-results";
import AdminPanel from "@/pages/admin";
import FacilityPanel from "@/pages/facility";
import Settings from "@/pages/settings";
import ProfileSetup from "@/pages/profile-setup";

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const needsSetup = isSignedIn && profile != null && !profile.profileCompleted;

  useEffect(() => {
    if (needsSetup) navigate("/profile-setup", { replace: true });
  }, [needsSetup, navigate]);

  if (!isLoaded || (isSignedIn && profileLoading)) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
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
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const [, navigate] = useLocation();

  const alreadyDone = isSignedIn && profile?.profileCompleted;

  useEffect(() => {
    if (alreadyDone) navigate("/dashboard", { replace: true });
  }, [alreadyDone, navigate]);

  if (!isLoaded || (isSignedIn && profileLoading)) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;
  if (alreadyDone) return <Spinner />;

  return <ProfileSetup />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

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
  );
}

function ClerkWrappedApp() {
  const [, navigate] = useLocation();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ""}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      {...(import.meta.env.PROD ? { proxyUrl: "/api/__clerk" } : {})}
      appearance={{
        variables: {
          colorPrimary: "#00AC9A",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#F4F7F6",
          colorText: "#363535",
          colorTextSecondary: "#6b7280",
          colorNeutral: "#6b7280",
          colorInputText: "#363535",
          colorShimmer: "#F4F7F6",
          borderRadius: "0.375rem",
          fontFamily: "'Nunito', sans-serif",
        },
        elements: {
          card: {
            background: "#FFFFFF",
            border: "1px solid #E9E6E1",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          headerTitle: { color: "#363535", fontWeight: "700" },
          headerSubtitle: { color: "#6b7280" },
          socialButtonsBlockButton: {
            background: "#F4F7F6",
            border: "1px solid #E9E6E1",
            color: "#363535",
          },
          socialButtonsBlockButtonText: { color: "#363535" },
          dividerLine: { background: "#E9E6E1" },
          dividerText: { color: "#9ca3af" },
          formFieldLabel: { color: "#4b5563" },
          formFieldInput: {
            background: "#FFFFFF",
            border: "1px solid #E9E6E1",
            color: "#363535",
          },
          formButtonPrimary: {
            background: "#00AC9A",
            color: "#FFFFFF",
            fontWeight: "700",
          },
          footerActionText: { color: "#6b7280" },
          footerActionLink: { color: "#00AC9A" },
          identityPreviewText: { color: "#363535" },
          identityPreviewEditButton: { color: "#00AC9A" },
          formResendCodeLink: { color: "#00AC9A" },
          otpCodeFieldInput: {
            background: "#F4F7F6",
            border: "1px solid #E9E6E1",
            color: "#363535",
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
