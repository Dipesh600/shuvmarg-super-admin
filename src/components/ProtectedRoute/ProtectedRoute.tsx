import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: String[] }) => {
  const isAthentication = true;
  const role = "SUPER";
  const isAllowedRole = allowedRoles.includes(role);

  if (!isAthentication && !isAllowedRole) {
    return <Navigate to={"/"} replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };
