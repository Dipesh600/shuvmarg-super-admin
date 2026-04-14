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
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Agent Management", url: "/admin/agents", icon: UserCog },
  { title: "Bus Owners", url: "/admin/bus-owners", icon: Bus },
  { title: "Fleet Management", url: "/admin/fleets", icon: MapPin },
  { title: "KYC Verification", url: "/admin/kyc", icon: ClipboardCheck },
  { title: "Financial", url: "/admin/financial", icon: DollarSign },
  { title: "Commissions",   url: "/admin/commissions",  icon: DollarSign },
  { title: "Settlements",   url: "/admin/settlements",  icon: Wallet },
  { title: "Refunds",       url: "/admin/refunds",      icon: AlertCircleIcon },
  { title: "Bookings", url: "/admin/bookings", icon: Ticket },
  { title: "Transactions", url: "/admin/transactions", icon: Ticket },
  { title: "Disputes", url: "/admin/disputes", icon: AlertCircle },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  {title:"Push Notifications",url:"/admin/notifications",icon:Bell},
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { open, isMobile } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border  bg-card transition-all sidebar  duration-300",
        open || isMobile ? "w-64" : "w-16"
      )}
    >
      {/* HEADER */}
      <SidebarHeader className=" flex items-center gap-2 border  border-b border-sidebar-border pl-3 py-3">
        <div className="flex items-center gap-3 py-0.5">
          <div className="h-9 w-9 rounded-full  bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>

          {/* Hidden on very small screens */}
          {open && (
            <div className="flex flex-col">
              <h1 className="text-md font-bold text-foreground">
                Shubha Margha Platform
              </h1>
              <p className="text-xs text-muted-foreground">
                Super Admin Portal v1.0
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="flex-1 px-2 overflow-y-scroll custom-scrollbar ">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg 
                          transition-all text-sm font-medium

                          ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {open && (
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs font-medium text-sidebar-accent-foreground">
              Need Help?
            </p>
            <p className="text-xs text-sidebar-foreground/70 mt-1">
              Check documentation
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
