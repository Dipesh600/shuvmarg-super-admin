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
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Agent Management", url: "/agents", icon: UserCog },
  { title: "Bus Owners", url: "/bus-owners", icon: Bus },
  { title: "Fleet Management", url: "/fleet", icon: MapPin },
  { title: "Financial", url: "/financial", icon: DollarSign },
  { title: "Transactions", url: "/transactions", icon: Ticket },
  { title: "Disputes", url: "/disputes", icon: AlertCircle },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
const { open, isMobile } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-sidebar-border bg-card transition-all  duration-300",open  || isMobile ? "w-64" : "w-16") }
    >
      {/* HEADER */}
       <SidebarHeader className=" flex items-center gap-2 border  border-b border-sidebar-border pl-3 py-3">
        <div className="flex items-center gap-3 py-0.5">
          <div className="h-9 w-9 rounded-full  bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>

          {/* Hidden on very small screens */}
          { open &&<div className="flex flex-col">
            <h1 className="text-md font-bold text-foreground">Shubha Margha Platform</h1>
            <p className="text-xs text-muted-foreground">
              Super Admin Portal v1.0
            </p>
          </div>}
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="flex-1 px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/"
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
       {open && <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">
            Need Help?
          </p>
          <p className="text-xs text-sidebar-foreground/70 mt-1">
            Check documentation
          </p>
        </div>}
      </SidebarFooter>
    </Sidebar>
  );
}
