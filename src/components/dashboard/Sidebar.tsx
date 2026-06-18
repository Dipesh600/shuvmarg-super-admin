import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  LayoutDashboard,
  Users,
  Handshake,
  Building2,
  ClipboardCheck,
  Bell,
  Bus,
  Route,
  Ticket,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  Percent,
  Banknote,
  Wallet,
  RotateCcw,
  Tag,
  BarChart3,
  Database,
  Sparkles,
  FileText,
  Shield,
  Sliders,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAgentDashboardData } from "@/api/agentApi";
import { useAuth } from "@/providers/AuthProvider";

// ── Sidebar groups (order matters visually) ───────────────────────────────────

const GROUPS = [
  {
    label: null, // no label for top-level single items
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "User Management",    url: "/admin/users",       icon: Users },
      { title: "Agent Management",   url: "/admin/agents",      icon: Handshake },
      { title: "Bus Owners",         url: "/admin/bus-owners",  icon: Building2 },
      { title: "KYC Verification",   url: "/admin/kyc",         icon: ClipboardCheck },
      { title: "Push Notifications", url: "/admin/notifications",icon: Bell },
    ],
  },
  {
    label: "Fleet & Trips",
    items: [
      { title: "Fleet Management",  url: "/admin/fleets",    icon: Bus },
      { title: "Trip Management",   url: "/admin/trips",     icon: Route },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Bookings",          url: "/admin/bookings",      icon: Ticket },
      { title: "Transactions",      url: "/admin/transactions",  icon: ArrowLeftRight },
      { title: "Disputes",          url: "/admin/disputes",      icon: AlertTriangle },
      { title: "Financial",         url: "/admin/financial",     icon: TrendingUp },
      { title: "Commissions",       url: "/admin/commissions",   icon: Percent },
      { title: "Settlements",       url: "/admin/settlements",   icon: Banknote },
      { title: "Shuvmarg Money",    url: "/admin/wallet",        icon: Wallet },
      { title: "Refunds",           url: "/admin/refunds",       icon: RotateCcw },
      { title: "Offers & Coupons",  url: "/admin/offers",        icon: Tag },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Analytics",         url: "/admin/analytics",     icon: BarChart3 },
      { title: "Platform Registry", url: "/admin/registry",      icon: Database },
      { title: "Amenities Catalog", url: "/admin/amenities",     icon: Sparkles },
      { title: "Reports",           url: "/admin/reports",       icon: FileText },
      { title: "Security",          url: "/admin/security",      icon: Shield },
      { title: "Gateway Fees",      url: "/admin/gateway-fees",  icon: Sliders },
      { title: "Settings",          url: "/admin/settings",      icon: Settings },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { open } = useSidebar();
  const { token } = useAuth();

  // Live pending agent count for badge
  const { data: dashData } = useQuery({
    queryKey: ["agentDashboard"],
    queryFn: getAgentDashboardData,
    enabled: !!token,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // refresh every minute
  });
  const pendingCount: number = dashData?.data?.pendingAgents ?? 0;

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-white/5 bg-[#121212]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#121212]/60 transition-all duration-300",
        open ? "w-64" : "w-[70px]"
      )}
    >
      {/* ── Logo header ── */}
      <SidebarHeader className={cn("h-16 border-b border-white/5 flex items-center gap-3", open ? "px-4 justify-start" : "justify-center")}>
        <div className="w-8 h-8 rounded-xl bg-[#00564E] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,86,78,0.35)]">
          <Bus className="w-5 h-5 text-[#D3D925]" />
        </div>
        {open && (
          <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="font-bold text-lg tracking-tight text-[#F5F7F6] truncate">Shubha Margha</span>
            <span className="text-[10px] text-[#B7C7C3] font-medium uppercase tracking-wider truncate">
              Admin Platform
            </span>
          </div>
        )}
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-2 py-4 overflow-y-auto scrollbar-hide">
        {GROUPS.map((group, gi) => (
          <SidebarGroup key={gi} className={gi > 0 ? "mt-1" : ""}>
            {/* Section label — only shown when sidebar is expanded */}
            {group.label && open && (
              <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#B7C7C3]/60">
                {group.label}
              </SidebarGroupLabel>
            )}

            {/* Divider between groups (not before the first) */}
            {gi > 0 && (
              <div className="mx-3 mb-2 border-t border-white/5" />
            )}

            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  // Exact match for dashboard, prefix match for the rest
                  const isActive =
                    item.url === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.url || pathname.startsWith(item.url + "/");

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={cn(
                          "h-10 transition-all duration-200 rounded-xl group hover:bg-white/5",
                          open ? "px-3" : "px-0 justify-center",
                          isActive
                            ? "bg-white/10 text-[#D3D925] font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                            : "text-[#B7C7C3] hover:text-[#F5F7F6]"
                        )}
                      >
                        <NavLink to={item.url} className={cn("flex items-center gap-3 w-full", !open && "justify-center")}>
                          <item.icon
                            className={cn(
                              "w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                              isActive
                                ? "text-[#D3D925]"
                                : "text-white/45 group-hover:text-white"
                            )}
                          />
                          {open && (
                            <span className="text-[13px] truncate animate-in fade-in slide-in-from-left-2 duration-300 flex-1">
                              {item.title}
                            </span>
                          )}
                          {/* Pending badge — on Agent Management when there are pending apps */}
                          {item.url === "/admin/agents" && pendingCount > 0 && (
                            open ? (
                              <span className="ml-auto flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D3D925] animate-pulse" />
                                <span className="text-[10px] font-bold bg-[#D3D925]/20 text-[#D3D925] px-1.5 py-0.5 rounded-full">
                                  {pendingCount}
                                </span>
                              </span>
                            ) : (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D3D925] border border-background" />
                            )
                          )}
                          {isActive && open && item.url !== "/admin/agents" && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D3D925] animate-in zoom-in duration-300 shrink-0 shadow-[0_0_8px_rgba(211,217,37,0.8)]" />
                          )}
                          {isActive && open && item.url === "/admin/agents" && pendingCount === 0 && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D3D925] animate-in zoom-in duration-300 shrink-0 shadow-[0_0_8px_rgba(211,217,37,0.8)]" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="p-3 border-t border-white/5 bg-white/5 backdrop-blur-md">
        {open ? (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#121212]/80 border border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00564E] to-[#003D38] flex items-center justify-center text-[#F5F7F6] font-bold text-xs shadow-[0_4px_14px_rgba(0,86,78,0.35)] shrink-0">
                SA
              </div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-semibold text-[#F5F7F6] truncate">Super Admin</span>
                <span className="text-[10px] text-[#B7C7C3] truncate font-medium">SUMA-ADM-001</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 h-10 rounded-xl"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-xs font-semibold">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00564E] to-[#003D38] flex items-center justify-center text-[#F5F7F6] font-bold text-xs shadow-[0_4px_14px_rgba(0,86,78,0.35)] shrink-0">
              SA
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
