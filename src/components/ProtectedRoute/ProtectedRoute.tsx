import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: String[] }) => {
  const isAthentication = false;
  const role = "SUPER";
  const isAllowedRole = allowedRoles.includes(role);

  if (!isAthentication && !isAllowedRole) {
    return <Navigate to={"/superAdmin/login"} replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };
