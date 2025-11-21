import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { initializePushNotifications } from "@/lib/notifications";
import { StripeProvider } from "@/components/StripeProvider";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CheckEmail from "./pages/CheckEmail";
import RequestStandIn from "./pages/RequestStandIn";
import EventDetails from "./pages/EventDetails";
import SelectStandIn from "./pages/SelectStandIn";
import PresenceMode from "./pages/PresenceMode";
import ProxyFeed from "./pages/ProxyFeed";
import RequestFeed from "./pages/RequestFeed";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import NotFound from "./pages/NotFound";
import { Navigation } from "./components/Navigation";

const queryClient = new QueryClient();

const AppContent = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    // Initialize push notifications after auth is ready
    initialize().then(() => {
      initializePushNotifications().catch((error) =>
        console.error("Failed to initialize push notifications:", error)
      );
    });
  }, [initialize]);

  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/request" element={<RequestStandIn />} />
        <Route path="/event-details/:eventType" element={<EventDetails />} />
        <Route path="/select-standin" element={<SelectStandIn />} />
        <Route path="/presence/:standInId" element={<PresenceMode />} />
        <Route path="/proxy-feed" element={<ProxyFeed />} />
        <Route path="/request-feed" element={<RequestFeed />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Conversation />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StripeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </StripeProvider>
  </QueryClientProvider>
);

export default App;
