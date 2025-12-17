import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import AppSideBar from "@/components/dashboard/Sidebar";
import { useSidebar } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  const { open, isMobile } = useSidebar();

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Sidebar */}
      <AppSideBar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-screen transition-all duration-300",

          // Desktop: Push content when sidebar open
          !isMobile && open ? "ml-64" : "ml-16",

          // Mobile: Sidebar overlays, so content should never shift
          isMobile && "ml-0"
        )}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="pt-6 w-full overflow-y-auto">
          <div className="w-full  px-4 sm:px-6 py-6 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
