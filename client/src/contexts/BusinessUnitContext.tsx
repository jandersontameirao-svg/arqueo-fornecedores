import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface BusinessUnit {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
}

interface BusinessUnitContextType {
  units: BusinessUnit[];
  isLoading: boolean;
  activeUnitId: number | null;
  activeUnit: BusinessUnit | null;
  setActiveUnitId: (id: number | null) => void;
}

const BusinessUnitContext = createContext<BusinessUnitContextType>({
  units: [],
  isLoading: false,
  activeUnitId: null,
  activeUnit: null,
  setActiveUnitId: () => {},
});

export function BusinessUnitProvider({ children }: { children: ReactNode }) {
  const [activeUnitId, setActiveUnitIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("arqueo_active_unit_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const { data: units = [], isLoading } = trpc.businessUnits.list.useQuery();

  const setActiveUnitId = (id: number | null) => {
    setActiveUnitIdState(id);
    if (id !== null) {
      localStorage.setItem("arqueo_active_unit_id", String(id));
    } else {
      localStorage.removeItem("arqueo_active_unit_id");
    }
  };

  const activeUnit = units.find((u) => u.id === activeUnitId) || null;

  return (
    <BusinessUnitContext.Provider
      value={{ units, isLoading, activeUnitId, activeUnit, setActiveUnitId }}
    >
      {children}
    </BusinessUnitContext.Provider>
  );
}

export function useBusinessUnitContext() {
  return useContext(BusinessUnitContext);
}
