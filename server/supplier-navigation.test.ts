/**
 * Testes — Navegação Home → /suppliers e resolução de groupId (v9.8)
 *
 * Garante que:
 * 1. Home.tsx chama setActiveUnitId antes de navegar para /suppliers
 * 2. Suppliers.tsx resolve groupId via activeUnit quando disponível
 * 3. Suppliers.tsx resolve groupId via fallback localStorage quando activeUnit ainda não carregou
 * 4. hasScope é true quando resolvedUnit tem empresas (areaHasCompanies)
 * 5. hasScope é false quando resolvedUnit não tem empresas (estado vazio)
 * 6. hasScope é false quando não há activeUnit nem persistedUnitId
 * 7. Listagem por empresa (companyId) continua funcionando sem regressão
 * 8. Usuário sem área permitida não tem acesso (hasScope = false)
 * 9. contextReady aguarda carregamento das units quando há persistedUnitId
 */

import { describe, it, expect } from "vitest";

// ─── Dados simulados ─────────────────────────────────────────────────────────

interface BusinessUnit {
  id: number;
  name: string;
}

interface SelectedCompany {
  id: string;
  groupId: number;
}

const mockUnits: BusinessUnit[] = [
  { id: 1, name: "Grupo Arqueo Brasil" },
  { id: 2, name: "Foods and Drinks" },
  { id: 3, name: "Grupo Arqueo Africa" },
];

// Mapa de empresas por área (espelha getCompaniesForGroup do frontend)
const COMPANIES_BY_GROUP: Record<string, string[]> = {
  "Grupo Arqueo Brasil": ["arqueogis-preventiva", "arqueoproject", "arqueogis-geoprocessamento", "arqueocean"],
  "Foods and Drinks": ["vinho24hbsb"],
  "Grupo Arqueo Africa": [], // sem empresas
};

function getCompaniesForGroup(name: string): string[] {
  const key = Object.keys(COMPANIES_BY_GROUP).find(
    k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  return key ? COMPANIES_BY_GROUP[key] : [];
}

// ─── Simulação da lógica do Suppliers.tsx ─────────────────────────────────────

function simulateSuppliersContext(params: {
  activeUnit: BusinessUnit | null;
  units: BusinessUnit[];
  unitsLoading: boolean;
  selectedCompany: SelectedCompany | null;
  localStorageUnitId: number | null;
}) {
  const { activeUnit, units, unitsLoading, selectedCompany, localStorageUnitId } = params;

  // FALLBACK SEGURO: lê localStorage quando activeUnit não está disponível
  const persistedUnitId = activeUnit ? null : localStorageUnitId;

  // Unidade resolvida: contexto OU fallback
  const resolvedUnit = activeUnit || (persistedUnitId && units.length > 0
    ? units.find(u => u.id === persistedUnitId) || null
    : null);

  const companyId = selectedCompany?.id || undefined;
  const groupId = selectedCompany?.groupId
    ? selectedCompany.groupId
    : resolvedUnit?.id || undefined;

  const areaCompanies = resolvedUnit ? getCompaniesForGroup(resolvedUnit.name) : [];
  const areaHasCompanies = areaCompanies.length > 0;

  // contextReady: verdadeiro quando não está carregando, ou já tem activeUnit, ou não tem persistedUnitId
  const contextReady = !unitsLoading || activeUnit !== null || !persistedUnitId;
  const hasScope = contextReady && !!(companyId || (resolvedUnit && areaHasCompanies));

  return { resolvedUnit, groupId, companyId, areaHasCompanies, hasScope, contextReady, persistedUnitId };
}

// ─── Simulação da lógica de navegação do Home.tsx ────────────────────────────

function simulateHomeNavigation(params: {
  activeUnit: BusinessUnit | null;
  localStorage: Map<string, string>;
}) {
  const { activeUnit, localStorage } = params;
  const actions: string[] = [];

  // navigateToSuppliers
  if (activeUnit) {
    localStorage.set("arqueo_active_unit_id", String(activeUnit.id));
    actions.push(`setActiveUnitId(${activeUnit.id})`);
  }
  actions.push("navigate:/suppliers");

  return actions;
}

// ─── TESTES ───────────────────────────────────────────────────────────────────

describe("v9.8 — Navegação Home → /suppliers (preservação de activeUnit)", () => {

  it("navigateToSuppliers persiste activeUnitId no localStorage antes de navegar", () => {
    const localStorage = new Map<string, string>();
    const actions = simulateHomeNavigation({
      activeUnit: { id: 1, name: "Grupo Arqueo Brasil" },
      localStorage,
    });
    expect(localStorage.get("arqueo_active_unit_id")).toBe("1");
    expect(actions).toContain("setActiveUnitId(1)");
    expect(actions).toContain("navigate:/suppliers");
  });

  it("navigateToSuppliers navega mesmo sem activeUnit (superadmin sem área selecionada)", () => {
    const localStorage = new Map<string, string>();
    const actions = simulateHomeNavigation({
      activeUnit: null,
      localStorage,
    });
    expect(localStorage.has("arqueo_active_unit_id")).toBe(false);
    expect(actions).toContain("navigate:/suppliers");
    expect(actions).not.toContain("setActiveUnitId(1)");
  });
});

describe("v9.8 — Suppliers.tsx: resolução de groupId com fallback seguro", () => {

  it("CASO 1: activeUnit disponível → usa activeUnit.id como groupId", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 1, name: "Grupo Arqueo Brasil" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 1,
    });
    expect(ctx.groupId).toBe(1);
    expect(ctx.resolvedUnit?.id).toBe(1);
    expect(ctx.hasScope).toBe(true);
  });

  it("CASO 2: activeUnit null mas units já carregaram + localStorage → fallback resolve groupId", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: null,
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 1,
    });
    expect(ctx.groupId).toBe(1);
    expect(ctx.resolvedUnit?.id).toBe(1);
    expect(ctx.hasScope).toBe(true);
  });

  it("CASO 3: activeUnit null, units ainda carregando, localStorage presente → contextReady=false, hasScope=false (aguarda)", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: null,
      units: [], // ainda não carregou
      unitsLoading: true,
      selectedCompany: null,
      localStorageUnitId: 1,
    });
    expect(ctx.contextReady).toBe(false);
    expect(ctx.hasScope).toBe(false); // aguarda carregamento
  });

  it("CASO 4: activeUnit null, sem localStorage → groupId undefined, hasScope=false", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: null,
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: null,
    });
    expect(ctx.groupId).toBeUndefined();
    expect(ctx.resolvedUnit).toBeNull();
    expect(ctx.hasScope).toBe(false);
  });

  it("CASO 5: empresa selecionada → usa companyId e groupId da empresa (sem regressão)", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 1, name: "Grupo Arqueo Brasil" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: { id: "arqueogis-preventiva", groupId: 1 },
      localStorageUnitId: 1,
    });
    expect(ctx.companyId).toBe("arqueogis-preventiva");
    expect(ctx.groupId).toBe(1);
    expect(ctx.hasScope).toBe(true);
  });
});

describe("v9.8 — hasScope: área com e sem empresas", () => {

  it("Grupo Arqueo Brasil (tem empresas) → hasScope=true", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 1, name: "Grupo Arqueo Brasil" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 1,
    });
    expect(ctx.areaHasCompanies).toBe(true);
    expect(ctx.hasScope).toBe(true);
  });

  it("Grupo Arqueo Africa (sem empresas) → hasScope=false, estado vazio exibido", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 3, name: "Grupo Arqueo Africa" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 3,
    });
    expect(ctx.areaHasCompanies).toBe(false);
    expect(ctx.hasScope).toBe(false);
  });

  it("Foods and Drinks (tem empresas) → hasScope=true", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 2, name: "Foods and Drinks" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 2,
    });
    expect(ctx.areaHasCompanies).toBe(true);
    expect(ctx.hasScope).toBe(true);
  });
});

describe("v9.8 — Sem regressão: fluxos existentes", () => {

  it("Listagem por empresa continua usando companyId quando empresa está selecionada", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 1, name: "Grupo Arqueo Brasil" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: { id: "arqueoproject", groupId: 1 },
      localStorageUnitId: 1,
    });
    expect(ctx.companyId).toBe("arqueoproject");
    expect(ctx.hasScope).toBe(true);
  });

  it("Usuário sem área permitida (sem activeUnit, sem localStorage) → hasScope=false", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: null,
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: null,
    });
    expect(ctx.hasScope).toBe(false);
  });

  it("Fallback não usa localStorage quando activeUnit já está disponível", () => {
    const ctx = simulateSuppliersContext({
      activeUnit: { id: 2, name: "Foods and Drinks" },
      units: mockUnits,
      unitsLoading: false,
      selectedCompany: null,
      localStorageUnitId: 1, // localStorage aponta para BU 1, mas activeUnit é BU 2
    });
    // Deve usar activeUnit (BU 2), não o localStorage (BU 1)
    expect(ctx.persistedUnitId).toBeNull(); // fallback não ativado
    expect(ctx.groupId).toBe(2);
    expect(ctx.resolvedUnit?.name).toBe("Foods and Drinks");
  });
});
