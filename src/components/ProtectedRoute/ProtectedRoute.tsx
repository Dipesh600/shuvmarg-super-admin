import { useAuth } from "@/providers/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import FullscreenLoader from "../FullscreenLoader";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: any[] }) => {
  const { admin, isAuthenticated, loading } = useAuth();
  if (loading) {
    return <FullscreenLoader/>;
  }
  const isAllowedRole = allowedRoles.includes(admin?.role);
  if (!isAuthenticated && !isAllowedRole) {
    return <Navigate to={"/auth/login"} replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };
