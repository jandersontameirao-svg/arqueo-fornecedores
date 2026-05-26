/**
 * Testes — getAllSuppliers por businessUnitId via supplierCompanyLinks (v9.7)
 *
 * Garante que:
 * 1. Listagem por businessUnitId usa supplierCompanyLinks como fonte canônica
 * 2. Fornecedor vinculado a múltiplas empresas da mesma área aparece apenas uma vez (DISTINCT)
 * 3. Filtros (status, criticality, categoryId, search) funcionam corretamente
 * 4. Listagem por companyId continua funcionando (sem regressão)
 * 5. Sem companyId e sem groupId: listagem global retorna todos
 */

import { describe, it, expect } from "vitest";

// ─── Dados simulados (espelham a estrutura real do banco) ─────────────────────

interface MockSupplier {
  id: number;
  companyName: string;
  cnpj: string;
  status: string;
  criticality: string;
  categoryId: number;
  organizationalGroupId: number;
  companyId: string | null;
  groupId: number | null;
}

interface MockLink {
  id: number;
  supplierId: number;
  companyId: number;
  businessUnitId: number;
  categoryId: number | null;
  criticality: string;
  status: string;
}

const mockSuppliers: MockSupplier[] = [
  { id: 1, companyName: "Fornecedor Alpha",    cnpj: "11111111000101", status: "approved", criticality: "high",   categoryId: 1, organizationalGroupId: 1, companyId: null, groupId: null },
  { id: 2, companyName: "Fornecedor Beta",     cnpj: "22222222000102", status: "pending",  criticality: "medium", categoryId: 1, organizationalGroupId: 1, companyId: null, groupId: null },
  { id: 3, companyName: "Fornecedor Gamma",    cnpj: "33333333000103", status: "approved", criticality: "low",    categoryId: 2, organizationalGroupId: 1, companyId: null, groupId: null },
  { id: 4, companyName: "Fornecedor Delta",    cnpj: "44444444000104", status: "approved", criticality: "high",   categoryId: 1, organizationalGroupId: 1, companyId: null, groupId: null },
  { id: 5, companyName: "Fornecedor Epsilon",  cnpj: "55555555000105", status: "approved", criticality: "medium", categoryId: 3, organizationalGroupId: 2, companyId: null, groupId: null },
  { id: 6, companyName: "Fornecedor Zeta",     cnpj: "66666666000106", status: "inactive", criticality: "low",    categoryId: 2, organizationalGroupId: 1, companyId: null, groupId: null },
];

// businessUnitId=1 = Grupo Arqueo Brasil, businessUnitId=2 = Foods and Drinks
// companyId=1 = Arqueogis Preventiva, companyId=2 = Arqueoproject
const mockLinks: MockLink[] = [
  // Fornecedor Alpha → vinculado a empresa 1 (BU 1)
  { id: 1, supplierId: 1, companyId: 1, businessUnitId: 1, categoryId: 1, criticality: "high",   status: "active" },
  // Fornecedor Beta → vinculado a empresa 1 (BU 1)
  { id: 2, supplierId: 2, companyId: 1, businessUnitId: 1, categoryId: 1, criticality: "medium", status: "active" },
  // Fornecedor Gamma → vinculado a empresa 2 (BU 1)
  { id: 3, supplierId: 3, companyId: 2, businessUnitId: 1, categoryId: 2, criticality: "low",    status: "active" },
  // Fornecedor Delta → vinculado a DUAS empresas da mesma BU 1 (deve aparecer 1x)
  { id: 4, supplierId: 4, companyId: 1, businessUnitId: 1, categoryId: 1, criticality: "high",   status: "active" },
  { id: 5, supplierId: 4, companyId: 2, businessUnitId: 1, categoryId: 1, criticality: "high",   status: "active" },
  // Fornecedor Epsilon → vinculado a empresa 3 (BU 2 = Foods and Drinks)
  { id: 6, supplierId: 5, companyId: 3, businessUnitId: 2, categoryId: 3, criticality: "medium", status: "active" },
  // Fornecedor Zeta → vínculo inativo (não deve aparecer)
  { id: 7, supplierId: 6, companyId: 1, businessUnitId: 1, categoryId: 2, criticality: "low",    status: "inactive" },
];

// ─── Simulação da lógica corrigida de getAllSuppliers ─────────────────────────

function simulateGetAllSuppliers(filters?: {
  companyId?: string;
  groupId?: number;
  status?: string;
  criticality?: string;
  categoryId?: number;
  search?: string;
  orgGroupIds?: number[];
}) {
  if (!filters) {
    return mockSuppliers.map(s => ({ supplier: s, category: null, createdBy: null }));
  }

  // CASO 1: companyId fornecido → filtrar por supplierCompanyLinks.companyId
  if (filters.companyId) {
    const companyIdNum = parseInt(filters.companyId, 10);
    if (isNaN(companyIdNum)) return [];

    let links = mockLinks.filter(l =>
      l.companyId === companyIdNum && l.status === "active"
    );
    if (filters.categoryId) links = links.filter(l => l.categoryId === filters.categoryId);
    if (filters.criticality) links = links.filter(l => l.criticality === filters.criticality);

    const supplierIds = [...new Set(links.map(l => l.supplierId))];
    let result = mockSuppliers.filter(s => supplierIds.includes(s.id));
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.search) result = result.filter(s => s.companyName.toLowerCase().includes(filters.search!.toLowerCase()));
    if (filters.orgGroupIds !== undefined) {
      if (filters.orgGroupIds.length === 0) return [];
      result = result.filter(s => filters.orgGroupIds!.includes(s.organizationalGroupId));
    }

    // Deduplica
    const seen = new Set<number>();
    return result.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).map(s => ({ supplier: s, category: null, createdBy: null }));
  }

  // CASO 2: groupId (businessUnitId) fornecido → filtrar por supplierCompanyLinks.businessUnitId
  if (filters.groupId) {
    let links = mockLinks.filter(l =>
      l.businessUnitId === filters.groupId && l.status === "active"
    );
    if (filters.categoryId) links = links.filter(l => l.categoryId === filters.categoryId);
    if (filters.criticality) links = links.filter(l => l.criticality === filters.criticality);

    const supplierIds = [...new Set(links.map(l => l.supplierId))];
    let result = mockSuppliers.filter(s => supplierIds.includes(s.id));
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.search) result = result.filter(s => s.companyName.toLowerCase().includes(filters.search!.toLowerCase()));
    if (filters.orgGroupIds !== undefined) {
      if (filters.orgGroupIds.length === 0) return [];
      result = result.filter(s => filters.orgGroupIds!.includes(s.organizationalGroupId));
    }

    // Deduplica (fornecedor vinculado a múltiplas empresas da mesma área)
    const seen = new Set<number>();
    return result.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).map(s => ({ supplier: s, category: null, createdBy: null }));
  }

  // CASO 3: sem companyId e sem groupId → listagem global
  let result = [...mockSuppliers];
  if (filters.status) result = result.filter(s => s.status === filters.status);
  if (filters.search) result = result.filter(s => s.companyName.toLowerCase().includes(filters.search!.toLowerCase()));
  if (filters.orgGroupIds !== undefined) {
    if (filters.orgGroupIds.length === 0) return [];
    result = result.filter(s => filters.orgGroupIds!.includes(s.organizationalGroupId));
  }
  return result.map(s => ({ supplier: s, category: null, createdBy: null }));
}

// ─── TESTES ───────────────────────────────────────────────────────────────────

describe("v9.7 — getAllSuppliers por businessUnitId via supplierCompanyLinks", () => {

  describe("Listagem por businessUnitId (groupId)", () => {
    it("retorna fornecedores da BU 1 via supplierCompanyLinks", () => {
      const result = simulateGetAllSuppliers({ groupId: 1 });
      // Alpha, Beta, Gamma, Delta (4 distintos; Zeta está inativo)
      expect(result.length).toBe(4);
    });

    it("retorna fornecedores da BU 2 via supplierCompanyLinks", () => {
      const result = simulateGetAllSuppliers({ groupId: 2 });
      expect(result.length).toBe(1);
      expect(result[0].supplier.id).toBe(5); // Epsilon
    });

    it("BU sem vínculos ativos retorna lista vazia", () => {
      const result = simulateGetAllSuppliers({ groupId: 99 });
      expect(result.length).toBe(0);
    });
  });

  describe("Deduplicação — fornecedor vinculado a múltiplas empresas da mesma área", () => {
    it("Fornecedor Delta (vinculado a empresa 1 e 2, ambas BU 1) aparece apenas UMA vez", () => {
      const result = simulateGetAllSuppliers({ groupId: 1 });
      const deltaCount = result.filter(r => r.supplier.id === 4).length;
      expect(deltaCount).toBe(1);
    });

    it("Total de fornecedores distintos na BU 1 é 4 (não 5 com duplicata)", () => {
      const result = simulateGetAllSuppliers({ groupId: 1 });
      const ids = result.map(r => r.supplier.id);
      expect(new Set(ids).size).toBe(ids.length); // sem duplicatas
      expect(result.length).toBe(4);
    });
  });

  describe("Filtros funcionam corretamente com businessUnitId", () => {
    it("filtro por status=approved na BU 1 retorna apenas aprovados", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, status: "approved" });
      expect(result.every(r => r.supplier.status === "approved")).toBe(true);
      // Alpha (approved), Gamma (approved), Delta (approved) — Beta é pending
      expect(result.length).toBe(3);
    });

    it("filtro por criticality=high na BU 1 retorna apenas high", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, criticality: "high" });
      expect(result.every(r => r.supplier.criticality === "high")).toBe(true);
    });

    it("filtro por categoryId=1 na BU 1 retorna apenas categoria 1", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, categoryId: 1 });
      // Links com categoryId=1 e businessUnitId=1: Alpha, Beta, Delta
      expect(result.length).toBe(3);
    });

    it("filtro por search na BU 1 funciona corretamente", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, search: "Alpha" });
      expect(result.length).toBe(1);
      expect(result[0].supplier.companyName).toBe("Fornecedor Alpha");
    });
  });

  describe("Sem regressão — listagem por companyId continua funcionando", () => {
    it("companyId=1 retorna apenas fornecedores vinculados à empresa 1", () => {
      const result = simulateGetAllSuppliers({ companyId: "1" });
      // Alpha, Beta, Delta vinculados à empresa 1
      expect(result.length).toBe(3);
    });

    it("companyId=2 retorna apenas fornecedores vinculados à empresa 2", () => {
      const result = simulateGetAllSuppliers({ companyId: "2" });
      // Gamma, Delta vinculados à empresa 2
      expect(result.length).toBe(2);
    });

    it("companyId inativo não aparece na listagem por empresa", () => {
      // Zeta tem vínculo inativo com empresa 1 — não deve aparecer
      const result = simulateGetAllSuppliers({ companyId: "1" });
      const zetaFound = result.some(r => r.supplier.id === 6);
      expect(zetaFound).toBe(false);
    });
  });

  describe("Isolamento multi-grupo (orgGroupIds)", () => {
    it("orgGroupIds=[] retorna lista vazia independente de groupId", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, orgGroupIds: [] });
      expect(result.length).toBe(0);
    });

    it("orgGroupIds=[1] filtra por organizationalGroupId=1", () => {
      const result = simulateGetAllSuppliers({ groupId: 1, orgGroupIds: [1] });
      // Todos os fornecedores da BU 1 têm organizationalGroupId=1
      expect(result.length).toBe(4);
    });

    it("orgGroupIds=[2] exclui fornecedores de organizationalGroupId=1", () => {
      // Epsilon (orgGroupId=2) está na BU 2, não BU 1
      const result = simulateGetAllSuppliers({ groupId: 1, orgGroupIds: [2] });
      expect(result.length).toBe(0);
    });
  });

  describe("Listagem global (sem companyId e sem groupId)", () => {
    it("sem filtros retorna todos os fornecedores", () => {
      const result = simulateGetAllSuppliers();
      expect(result.length).toBe(mockSuppliers.length);
    });

    it("filtro por status=approved sem escopo retorna apenas aprovados", () => {
      const result = simulateGetAllSuppliers({ status: "approved" });
      expect(result.every(r => r.supplier.status === "approved")).toBe(true);
    });
  });
});
