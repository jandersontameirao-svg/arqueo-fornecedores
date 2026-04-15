import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

interface CompanyContextType {
  activeCompanyId: number | null;
  setActiveCompanyId: (id: number | null) => void;
  isAdmin: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  activeCompanyId: null,
  setActiveCompanyId: () => {},
  isAdmin: false,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("arqueo_active_company_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const setActiveCompanyId = (id: number | null) => {
    setActiveCompanyIdState(id);
    if (id !== null) {
      localStorage.setItem("arqueo_active_company_id", String(id));
    } else {
      localStorage.removeItem("arqueo_active_company_id");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <CompanyContext.Provider
      value={{ activeCompanyId, setActiveCompanyId, isAdmin }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  return useContext(CompanyContext);
}
