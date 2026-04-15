import { createContext, useContext, useState, type ReactNode } from "react";

export interface SelectedCompany {
  id: string;          // identificador único (slug)
  name: string;        // nome da empresa
  color: string;       // cor hex da empresa
  groupName: string;   // nome do grupo pai
  groupId: number;     // id da unidade de negócio pai
}

interface SelectedCompanyContextType {
  selectedCompany: SelectedCompany | null;
  setSelectedCompany: (company: SelectedCompany | null) => void;
  clearSelectedCompany: () => void;
}

const SelectedCompanyContext = createContext<SelectedCompanyContextType>({
  selectedCompany: null,
  setSelectedCompany: () => {},
  clearSelectedCompany: () => {},
});

const STORAGE_KEY = "arqueo_selected_company";

export function SelectedCompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<SelectedCompany | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSelectedCompany = (company: SelectedCompany | null) => {
    setSelectedCompanyState(company);
    if (company) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSelectedCompany = () => {
    setSelectedCompanyState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SelectedCompanyContext.Provider
      value={{ selectedCompany, setSelectedCompany, clearSelectedCompany }}
    >
      {children}
    </SelectedCompanyContext.Provider>
  );
}

export function useSelectedCompany() {
  return useContext(SelectedCompanyContext);
}
