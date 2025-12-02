import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "../mode-toggle";
import { SidebarTrigger } from "../ui/sidebar";

export function DashboardHeader() {
  return (
    <header
      className="
        sticky top-0 z-50 
        border-b 
        bg-card/90 backdrop-blur-sm
        transition-colors
      "
    >
      <div className="h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="cursor-pointer" />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Status Badge (hidden on mobile) */}
          <Badge
            variant="outline"
            className="gap-1 border-muted-foreground/30 text-foreground hidden md:flex"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            System Healthy
          </Badge>

          {/* Active Sessions (hidden on mobile) */}
          <Badge
            variant="secondary"
            className="
              text-white bg-green-600 hover:bg-green-700 cursor-pointer
              hidden md:flex
            "
          >
            127 Active Sessions
          </Badge>

          {/* Notification */}
          <Button variant="ghost" className="cursor-pointer" size="icon">
            <Bell className="h-4 w-4 text-foreground" />
          </Button>

          {/* Settings */}
          {/* <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4 text-foreground" />
          </Button> */}

          <ModeToggle />

          {/* User Info */}
          <div className="flex items-center gap-2 pl-3 border-l border-muted">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                SA
              </AvatarFallback>
            </Avatar>

            {/* Hide User Text on small screens */}
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">Super Admin</p>
              <p className="text-xs text-muted-foreground">SUMA-ADM-001</p>
            </div>
          </div>

          {/* Logout */}
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
