import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Admin } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/providers/auth-context";

// ─── Constants ────────────────────────────────────────────────────────────────
/** Session token key in sessionStorage (tab-scoped, wiped on tab close) */
const SESSION_TOKEN_KEY = "sumarg_admin_token";
const SESSION_USER_KEY = "sumarg_admin_data";

/** Inactivity logout threshold: one hour, aligned with the backend access token. */
const INACTIVITY_MS = 60 * 60 * 1000;

/** Events that count as "activity" */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "mousedown",
  "touchstart",
  "scroll",
  "click",
];

// ─── Provider ─────────────────────────────────────────────────────────────────
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from sessionStorage (tab-scoped only)
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_TOKEN_KEY)
  );
  const [admin, setAdmin] = useState<Admin | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_USER_KEY);
      return raw ? (JSON.parse(raw) as Admin) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback((reason = "manual") => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setToken(null);
    setAdmin(null);
    qc.clear();
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    console.info(`[Auth] Session ended — reason: ${reason}`);
    navigate("/auth/login", { replace: true });
  }, [navigate, qc]);

  // ── Inactivity timer ────────────────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout("inactivity");
    }, INACTIVITY_MS);
  }, [logout]);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, data: Admin) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, newToken);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(data));
    setToken(newToken);
    setAdmin(data);
    qc.invalidateQueries({ queryKey: ["admin"] });
    resetInactivityTimer();
    navigate("/admin", { replace: true });
  }, [navigate, qc, resetInactivityTimer]);

  // ── Activity listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return; // don't track activity when logged out

    const handleActivity = () => resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    // Start the timer immediately on mount (handles page refresh)
    resetInactivityTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer, token]);

  // ── Tab visibility: pause/resume inactivity on tab switch ───────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (!token) return;
      if (document.visibilityState === "visible") {
        resetInactivityTimer();
      } else {
        // Tab hidden — freeze the countdown (it will restart when visible again)
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [resetInactivityTimer, token]);

  // ── Initial guard: redirect if not authenticated ─────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isPublicAuthPage = window.location.pathname.startsWith("/auth/");
    if (!loading && !token && !isPublicAuthPage) {
      navigate("/auth/login", { replace: true });
    }
  }, [loading, navigate, token]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
