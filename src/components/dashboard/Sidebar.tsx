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
      { title: "User Management",   url: "/admin/users",     icon: Users },
      { title: "Agent Management",  url: "/admin/agents",    icon: Handshake },
      { title: "Bus Owners",        url: "/admin/bus-owners",icon: Building2 },
      { title: "KYC Verification",  url: "/admin/kyc",       icon: ClipboardCheck },
      { title: "Push Notifications",url: "/admin/notifications", icon: Bell },
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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        open ? "w-64" : "w-[70px]"
      )}
    >
      {/* ── Logo header ── */}
      <SidebarHeader className={cn("h-16 border-b border-border/50 flex items-center gap-3", open ? "px-4 justify-start" : "justify-center")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Bus className="w-5 h-5 text-primary-foreground" />
        </div>
        {open && (
          <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="font-bold text-lg tracking-tight truncate">Shubha Margha</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
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
              <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
                {group.label}
              </SidebarGroupLabel>
            )}

            {/* Divider between groups (not before the first) */}
            {gi > 0 && (
              <div className="mx-3 mb-2 border-t border-border/30" />
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
                          "h-9 transition-all duration-200 rounded-lg group hover:bg-primary/5",
                          open ? "px-3" : "px-0 justify-center",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <NavLink to={item.url} className={cn("flex items-center gap-3", !open && "justify-center")}>
                          <item.icon
                            className={cn(
                              "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {open && (
                            <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                              {item.title}
                            </span>
                          )}
                          {isActive && open && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-in zoom-in duration-300 shrink-0" />
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
      <SidebarFooter className="p-3 border-t border-border/50 bg-muted/20">
        {open ? (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-background border border-border/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md shrink-0">
                SA
              </div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-semibold truncate">Super Admin</span>
                <span className="text-[10px] text-muted-foreground truncate font-medium">SUMA-ADM-001</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              SA
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
