import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Pages
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import PlaybookDetail from "@/pages/PlaybookDetail";
import CreatePlaybook from "@/pages/CreatePlaybook";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <Navbar />
      <main className="flex-1 w-full">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/playbook/:slug" component={PlaybookDetail} />
          <Route path="/create" component={CreatePlaybook} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
