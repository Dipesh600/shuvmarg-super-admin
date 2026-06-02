import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
  UserCog,
  Bus,
  DollarSign,
  AlertCircle,
  BarChart3,
  Shield,
  MapPin,
  Ticket,
  FileText,
  Settings,
  AlertCircleIcon,
  ClipboardCheck,
  Bell,
  Wallet,
  Database,
  Zap,
  Tag,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Agent Management", url: "/admin/agents", icon: UserCog },
  { title: "Bus Owners", url: "/admin/bus-owners", icon: Bus },
  { title: "Fleet Management",  url: "/admin/fleets",       icon: MapPin },
  { title: "Trip Management",   url: "/admin/trips",        icon: Bus },
  { title: "KYC Verification",  url: "/admin/kyc",          icon: ClipboardCheck },
  { title: "Financial", url: "/admin/financial", icon: DollarSign },
  { title: "Commissions",   url: "/admin/commissions",  icon: DollarSign },
  { title: "Settlements",   url: "/admin/settlements",  icon: Wallet },
  { title: "Shuvmarg Money", url: "/admin/wallet",       icon: Wallet },
  { title: "Refunds",       url: "/admin/refunds",      icon: AlertCircleIcon },
  { title: "Bookings", url: "/admin/bookings", icon: Ticket },
  { title: "Offers & Coupons", url: "/admin/offers", icon: Tag },
  { title: "Transactions", url: "/admin/transactions", icon: Ticket },
  { title: "Disputes", url: "/admin/disputes", icon: AlertCircle },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Push Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Platform Registry", url: "/admin/registry", icon: Database },
  { title: "Amenities Catalog", url: "/admin/amenities", icon: Zap },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Gateway Fees", url: "/admin/gateway-fees", icon: Settings },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { open, isMobile } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        !open && "w-[70px]"
      )}
    >
      <SidebarHeader className="h-[70px] px-6 border-b border-border/50 flex items-center justify-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Bus className="w-5 h-5 text-primary-foreground" />
        </div>
        {open && (
          <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="font-bold text-lg tracking-tight truncate">Shubha Margha</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">Platform</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-11 px-3 transition-all duration-200 rounded-lg group hover:bg-primary/5",
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        {open && (
                          <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                            {item.title}
                          </span>
                        )}
                        {isActive && open && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-in zoom-in duration-300" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-muted/30">
        {open ? (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-background border border-border/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                SA
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">Super Admin</span>
                <span className="text-[10px] text-muted-foreground truncate font-medium">SUMA-ADM-001</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-10 rounded-lg">
              <AlertCircleIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Logout System</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                SA
              </div>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
               <AlertCircleIcon className="w-4 h-4" />
             </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
