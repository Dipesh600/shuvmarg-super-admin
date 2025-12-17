import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/admin/Index";
import NotFound from "./pages/admin/NotFound";
import Users from "./pages/admin/Users";
import Agents from "./pages/admin/Agents";
import BusOwners from "./pages/admin/BusOwners";
import Fleet from "./pages/admin/Fleets";
import Transactions from "./pages/admin/Transcations";
import Disputes from "./pages/admin/Disputes";
import Analytics from "./pages/admin/Analytics";
import Reports from "./pages/admin/Reports";
import Security from "./pages/admin/Security";
import Settings from "./pages/admin/Settings";
import Financial from "./pages/admin/Financial";
import ModelProvider from "./providers/ModelProvider";
import SuperAdminLogin from "./pages/auth/login";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { SidebarProvider } from "./components/ui/sidebar";
// import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ModelProvider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SuperAdminLogin />} />
          {/* <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}> */}
            <Route
              path="/admin"
              
              element={
                <SidebarProvider>
                  <DashboardLayout />
                </SidebarProvider>
              }
            >
              <Route index element={<Index />} />
              <Route path="users" element={<Users />} />
              <Route path="agents" element={<Agents />} />
              <Route path="bus-owners" element={<BusOwners />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="financial" element={<Financial />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="security" element={<Security />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          {/* </Route> */}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
