import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {  useQueryClient } from "@tanstack/react-query";
import { type Admin } from "../api/authApi";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, data: Admin) => void;
  logout: () => void;
  token:string | null

  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
const [isLoading, setLoading] = useState(true);
  const qc = useQueryClient();
  const token = localStorage.getItem("token");
  const adminData = JSON.parse(localStorage.getItem("adminData")!) as Admin | null;
  const navigate = useNavigate();
  // const { data, isLoading } = useQuery({
  //   queryKey: ["admin"],
  //   queryFn: getAdmin,
  //   enabled: !!token,
  //   staleTime: 5 * 60 * 1000,
  // });
 useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 1000);

  return () => clearTimeout(timer); // cleanup on unmount
}, []);
  const login = (token: string, data: Admin) => {
    
    localStorage.setItem("token", token);
    localStorage.setItem("adminData", JSON.stringify(data));
    qc.invalidateQueries({ queryKey: ["admin"]});
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminData")
    qc.clear();
    navigate("/auth/login", { replace: true });
  };
  useEffect(() => {
    if (adminData && token) {
      navigate(`${window.location.pathname === "/auth/login"? "/admin":window.location.pathname}`,{replace:true});
    }
  }, [token]);
  return (
    <AuthContext.Provider
      value={{
        admin: adminData,
        isAuthenticated: !!token,
        login,
        token,
        logout,
        loading: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
