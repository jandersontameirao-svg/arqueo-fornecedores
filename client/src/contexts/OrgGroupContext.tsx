import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface OrgGroup {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  status: string;
}

interface OrgContextData {
  globalRole: string;
  defaultOrgGroupId: number | null;
  accessibleGroupIds: number[];
  accessibleCompanyIds: number[];
  accessibleBusinessUnitIds: number[];
  effectiveLevel: string;
  isSuperAdmin: boolean;
}

interface OrgGroupContextType {
  /** All groups the user can access */
  groups: OrgGroup[];
  /** The currently selected group */
  activeGroupId: number | null;
  activeGroup: OrgGroup | null;
  /** Set the active group (persisted in localStorage) */
  setActiveGroupId: (id: number | null) => void;
  /** Full organizational context from backend */
  orgContext: OrgContextData | null;
  /** Loading state */
  isLoading: boolean;
  /** Whether user is super admin */
  isSuperAdmin: boolean;
}

const OrgGroupContext = createContext<OrgGroupContextType>({
  groups: [],
  activeGroupId: null,
  activeGroup: null,
  setActiveGroupId: () => {},
  orgContext: null,
  isLoading: false,
  isSuperAdmin: false,
});

const STORAGE_KEY = "arqueo_active_org_group_id";

export function OrgGroupProvider({ children }: { children: ReactNode }) {
  const [activeGroupId, setActiveGroupIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  // Fetch org context from backend
  const { data: orgContext, isLoading: ctxLoading } = trpc.org.context.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  // Fetch accessible groups
  const { data: groups = [], isLoading: groupsLoading } = trpc.org.groups.list.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const isLoading = ctxLoading || groupsLoading;

  // Auto-select default group if none selected
  useEffect(() => {
    if (!activeGroupId && orgContext?.defaultOrgGroupId) {
      setActiveGroupIdState(orgContext.defaultOrgGroupId);
      localStorage.setItem(STORAGE_KEY, String(orgContext.defaultOrgGroupId));
    } else if (!activeGroupId && groups.length === 1) {
      setActiveGroupIdState(groups[0].id);
      localStorage.setItem(STORAGE_KEY, String(groups[0].id));
    }
  }, [orgContext, groups, activeGroupId]);

  const setActiveGroupId = (id: number | null) => {
    setActiveGroupIdState(id);
    if (id !== null) {
      localStorage.setItem(STORAGE_KEY, String(id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Clear downstream selections when group changes
    localStorage.removeItem("arqueo_active_company_id");
    localStorage.removeItem("arqueo_active_unit_id");
    localStorage.removeItem("arqueo_selected_company");
  };

  const activeGroup = groups.find((g: OrgGroup) => g.id === activeGroupId) || null;
  const isSuperAdmin = orgContext?.isSuperAdmin ?? false;

  return (
    <OrgGroupContext.Provider
      value={{
        groups,
        activeGroupId,
        activeGroup,
        setActiveGroupId,
        orgContext: orgContext ?? null,
        isLoading,
        isSuperAdmin,
      }}
    >
      {children}
    </OrgGroupContext.Provider>
  );
}

export function useOrgGroupContext() {
  return useContext(OrgGroupContext);
}
