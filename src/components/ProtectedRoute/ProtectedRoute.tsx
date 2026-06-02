import { useAuth } from "@/providers/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import FullscreenLoader from "../FullscreenLoader";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { admin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullscreenLoader />;
  }

  // Not authenticated at all → redirect to login
  if (!isAuthenticated || !admin) {
    return <Navigate to="/auth/login" replace />;
  }

  // Authenticated but wrong role → redirect to login
  const isAllowedRole = allowedRoles.some(
    (role) => role.toUpperCase() === admin.role?.toUpperCase()
  );

  if (!isAllowedRole) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };
