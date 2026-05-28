import { createContext, useContext, useState, type ReactNode } from "react";
import { inferCompanyId } from "@/lib/companies";

export interface SelectedCompany {
  id: string;           // identificador único (slug) — preservado para uso visual
  companyId?: number;   // ID numérico real na tabela companies — usar nas chamadas ao backend
  name: string;         // nome da empresa
  color: string;        // cor hex da empresa
  groupName: string;    // nome do grupo pai
  groupId: number;      // id da unidade de negócio pai
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
      if (!saved) return null;
      const parsed: SelectedCompany = JSON.parse(saved);
      // Migração segura: se companyId não existe no objeto salvo, inferir pelo slug
      if (parsed && parsed.companyId === undefined) {
        const inferred = inferCompanyId(parsed.id);
        if (inferred !== undefined) {
          // Atualiza o localStorage com o companyId inferido
          const migrated = { ...parsed, companyId: inferred };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
        // Slug desconhecido: limpar seleção para forçar nova escolha
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
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
