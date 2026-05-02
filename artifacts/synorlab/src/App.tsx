import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, RedirectToSignIn, useAuth } from "@clerk/react";
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
        variables: {
          colorPrimary: "hsl(189, 100%, 50%)",
          colorBackground: "hsl(216, 42%, 8%)",
          colorInputBackground: "hsl(218, 35%, 15%)",
          colorText: "hsl(210, 30%, 95%)",
          borderRadius: "0.5rem",
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
