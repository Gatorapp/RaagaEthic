import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface AdminContextValue {
  adminKey: string | null;
  isReady: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem("raaga_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
    }
    setIsReady(true);
  }, []);

  const login = async (password: string) => {
    try {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      if (res.ok) {
        setAdminKey(password);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("raaga_admin_key", password);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setAdminKey(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("raaga_admin_key");
    }
  };

  return <AdminContext.Provider value={{ adminKey, isReady, login, logout }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
