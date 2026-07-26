import { createContext, useContext, useState, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface AdminContextValue {
  adminKey: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKey] = useState<string | null>(null);

  const login = async (password: string) => {
    try {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      if (res.ok) {
        setAdminKey(password);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => setAdminKey(null);

  return <AdminContext.Provider value={{ adminKey, login, logout }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
