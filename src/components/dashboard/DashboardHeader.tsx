import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "../mode-toggle";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
// import { useMutation } from "@tanstack/react-query";
// import { logoutAdmin } from "@/api/authApi";
// import { toast } from "sonner";
// import type { MouseEvent } from "react";

export function DashboardHeader() {
  const { logout,admin } = useAuth();
  // const {isPending,mutate} = useMutation({
  //   mutationFn: logoutAdmin,
  //   mutationKey: ["logout"],
  //   onSuccess: () => {
  //     toast.success("Logout Successfull!");
  //     logout();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.response.data.message || "Logout Failed");
  //   },
  // });
  // const handleLogout = (e:MouseEvent<HTMLButtonElement>)=>{
  //   e.preventDefault();
  //   mutate();
  // }
  return (
    <header
      className="
        sticky top-0 z-50 
        border-b border-white/5
        bg-[#121212]/80 backdrop-blur-xl
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
            className="gap-1 border-white/5 bg-white/5 text-[#B7C7C3] hidden md:flex rounded-xl"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D3D925] animate-pulse shadow-[0_0_8px_rgba(211,217,37,0.8)]" />
            System Healthy
          </Badge>



          {/* Notification */}
          <Button variant="ghost" className="cursor-pointer hover:bg-white/5 rounded-xl h-9 w-9" size="icon">
            <Bell className="h-4 w-4 text-[#B7C7C3]" />
          </Button>

          {/* Settings */}
          {/* <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4 text-foreground" />
          </Button> */}

          <ModeToggle />

          {/* User Info */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/5">
            <Avatar className="h-9 w-9 border border-white/5 shadow-[0_4px_14px_rgba(0,86,78,0.35)]">
              <AvatarFallback className="bg-gradient-to-br from-[#00564E] to-[#003D38] text-[#F5F7F6] font-bold">
                {admin?.adminId?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>

            {/* Hide User Text on small screens */}
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-[#F5F7F6]">Super Admin</p>
              <p className="text-[10px] text-[#B7C7C3] font-medium">{admin?.adminId}</p>
            </div>
          </div>

          {/* Logout */}
          <Button className="cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 rounded-xl h-9 w-9 text-[#B7C7C3]"  onClick={()=>logout()} variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
