import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/admin/Index";
import NotFound from "./pages/admin/NotFound";
import Users from "./pages/admin/users/Users";
import Agents from "./pages/admin/agents/Agents";
import BusOwners from "./pages/admin/busowners/BusOwners";
import Fleet from "./pages/admin/fleets/Fleets";
import Transactions from "./pages/admin/transactions/Transcations";
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
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import AuthProvider from "./providers/AuthProvider";
import UserDetail from "./pages/admin/users/user_profile";
import AgentDetail from "./pages/admin/agents/agent_profile";
import BusOwnerDetail from "./pages/admin/busowners/busowner_profile";
import BusDetail from "./pages/admin/fleets/fleet_profile";
import Commissions from "./pages/admin/commissions/commission";
import Refunds from "./pages/admin/refunds/refunds";
import FleetTracking from "./pages/admin/fleets/live_tracking";
import BusMaintenance from "./pages/admin/fleets/fleet_maintenance";
import KYCVerification from "./pages/admin/kyc/KYCVerification";
import KYCBusOwnerDetail from "./pages/admin/kyc/KYCBusOwnerDetail";
import KYCAgentDetail from "./pages/admin/kyc/KYCAgentDetail";
import KYCFleetDetail from "./pages/admin/kyc/KYCFleetDetail";
import TransactionDetail from "./pages/admin/transactions/TransactionDetail";
import ReportView from "./pages/admin/reports/ReportView";
import ReportEdit from "./pages/admin/reports/ReportEdit";
import Bookings from "./pages/admin/bookings/Bookings";
import BookingDetail from "./pages/admin/bookings/BookingDetails";
import PushNotifications from "./pages/admin/push_notification/PushNotification";
import OperatorDetails from "./pages/admin/busowners/OperatorDetails";
import Settlements from "./pages/admin/settlements/Settlements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ModelProvider />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/login" element={<SuperAdminLogin />} />
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/" element={<Navigate to={"/admin"} />} />
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
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="agents" element={<Agents />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                <Route path="bus-owners" element={<BusOwners />} />
                <Route path="bus-owners/:id" element={<BusOwnerDetail />} />
                <Route path="bus-owners/operator/:id" element={<OperatorDetails />} />
                <Route path="fleets" element={<Fleet />} />
                <Route path="fleets/tracking" element={<FleetTracking />} />
                <Route path="fleets/:id" element={<BusDetail />} />
                <Route
                  path="fleets/:id/maintenance"
                  element={<BusMaintenance />}
                />
                <Route path="kyc" element={<KYCVerification />} />
                <Route
                  path="kyc/bus-owner/:id"
                  element={<KYCBusOwnerDetail />}
                />
                <Route path="kyc/agent/:id" element={<KYCAgentDetail />} />
                <Route path="kyc/fleet/:id" element={<KYCFleetDetail />} />
                <Route path="financial" element={<Financial />} />
                <Route path="notifications" element={<PushNotifications/>}/>
                <Route path="transactions" element={<Transactions />} />
                <Route
                  path="transactions/:id"
                  element={<TransactionDetail />}
                />
                <Route path="bookings" element={<Bookings />} />
                <Route path="bookings/:id" element={<BookingDetail />} />
                <Route path="reports/:id" element={<ReportView />} />
                <Route path="reports/:id/edit" element={<ReportEdit />} />
                <Route path="commissions" element={<Commissions />} />
                <Route path="refunds" element={<Refunds />} />
                <Route path="settlements" element={<Settlements />} />
                <Route path="disputes" element={<Disputes />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
                <Route path="security" element={<Security />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
