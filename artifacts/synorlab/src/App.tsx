import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, RedirectToSignIn, useAuth } from "@clerk/react";
import { dark } from "@clerk/themes";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import JDNew from "@/pages/jd-new";
import InterviewsList from "@/pages/interviews";
import InterviewSession from "@/pages/interview-session";
import InterviewResults from "@/pages/interview-results";
import AdminPanel from "@/pages/admin";
import Settings from "@/pages/settings";
import { SignIn, SignUp } from "@clerk/react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      <Route path="/sign-in">
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <SignIn routing="path" path="/sign-in" />
        </div>
      </Route>

      <Route path="/sign-up">
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <SignUp routing="path" path="/sign-up" />
        </div>
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
        <ProtectedRoute><AdminPanel /></ProtectedRoute>
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
        baseTheme: dark,
        variables: {
          colorPrimary: "#00d4ff",
          colorBackground: "#111827",
          colorInputBackground: "#1e2a3d",
          colorText: "#f0f4f8",
          colorTextSecondary: "#94a3b8",
          colorNeutral: "#94a3b8",
          colorInputText: "#f0f4f8",
          colorShimmer: "#1e2a3d",
          borderRadius: "0.6rem",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
        elements: {
          card: {
            background: "#1a2234",
            border: "1px solid #2a3a55",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          },
          headerTitle: { color: "#f0f4f8", fontWeight: "600" },
          headerSubtitle: { color: "#94a3b8" },
          socialButtonsBlockButton: {
            background: "#1e2a3d",
            border: "1px solid #2a3a55",
            color: "#f0f4f8",
          },
          socialButtonsBlockButtonText: { color: "#f0f4f8" },
          dividerLine: { background: "#2a3a55" },
          dividerText: { color: "#64748b" },
          formFieldLabel: { color: "#94a3b8" },
          formFieldInput: {
            background: "#1e2a3d",
            border: "1px solid #2a3a55",
            color: "#f0f4f8",
          },
          formButtonPrimary: {
            background: "#00d4ff",
            color: "#0a1628",
            fontWeight: "600",
          },
          footerActionText: { color: "#64748b" },
          footerActionLink: { color: "#00d4ff" },
          identityPreviewText: { color: "#f0f4f8" },
          identityPreviewEditButton: { color: "#00d4ff" },
          formResendCodeLink: { color: "#00d4ff" },
          otpCodeFieldInput: {
            background: "#1e2a3d",
            border: "1px solid #2a3a55",
            color: "#f0f4f8",
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
