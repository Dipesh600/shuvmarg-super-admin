import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Agents from "./pages/Agents";
import BusOwners from "./pages/BusOwners";
import Fleet from "./pages/Fleets";
import Transactions from "./pages/Transcations";
import Disputes from "./pages/Disputes";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Financial from "./pages/Financial";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/users" element={<Users />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/bus-owners" element={<BusOwners />} />

          <Route path="/fleet" element={<Fleet />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
