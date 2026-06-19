import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setCsrfToken } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";

import Timeline from "@/pages/timeline";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

async function initCsrf() {
  try {
    const res = await fetch("/api/auth/csrf", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setCsrfToken(data.token);
    }
  } catch {
    // CSRF fetch failure is non-fatal during startup
  }
}

initCsrf();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Timeline} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile/:username" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initCsrf();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
