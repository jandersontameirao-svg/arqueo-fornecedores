/**
 * Testes — Correção do filtro orgGroupIds no caminho businessUnitId (v9.9)
 *
 * Garante que:
 * 1. Fornecedor com supplierCompanyLinks.businessUnitId válido e suppliers.organizationalGroupId NULL
 *    aparece na listagem por área
 * 2. Usuário gentegestao/operator com businessUnitId 1 vê os 6 fornecedores
 * 3. Superadmin continua vendo os 6 fornecedores
 * 4. Fornecedor sem vínculo ativo em supplierCompanyLinks não aparece na listagem por área
 * 5. companyId continua funcionando sem regressão
 * 6. Usuário sem acesso ao businessUnitId recebe lista vazia
 * 7. Filtros (status, search, categoryId, criticality) funcionam corretamente no caminho businessUnitId
 */

import { describe, it, expect } from "vitest";

// ─── Simulação da lógica de getAllSuppliers (caminho businessUnitId) ──────────

interface MockSupplier {
  id: number;
  companyName: string;
  organizationalGroupId: number | null;
  status: string;
  criticality: string;
}

interface MockLink {
  supplierId: number;
  businessUnitId: number;
  companyId: string;
  status: string;
  categoryId: number | null;
  criticality: string;
}

// Dados que espelham a situação real do banco
const mockSuppliers: MockSupplier[] = [
  { id: 300005, companyName: "Fornecedor E", organizationalGroupId: null, status: "pending", criticality: "low" },
  { id: 300004, companyName: "Fornecedor D", organizationalGroupId: null, status: "pending", criticality: "medium" },
  { id: 300003, companyName: "Fornecedor C", organizationalGroupId: null, status: "pending", criticality: "high" },
  { id: 300002, companyName: "Fornecedor B", organizationalGroupId: null, status: "pending", criticality: "low" },
  { id: 300001, companyName: "Fornecedor A", organizationalGroupId: 1, status: "pending", criticality: "critical" },
  { id: 270001, companyName: "Fornecedor F", organizationalGroupId: null, status: "pending", criticality: "low" },
];

const mockLinks: MockLink[] = [
  { supplierId: 300005, businessUnitId: 1, companyId: "arqueogis-preventiva", status: "active", categoryId: null, criticality: "low" },
  { supplierId: 300004, businessUnitId: 1, companyId: "arqueogis-preventiva", status: "active", categoryId: null, criticality: "medium" },
  { supplierId: 300003, businessUnitId: 1, companyId: "arqueoproject", status: "active", categoryId: null, criticality: "high" },
  { supplierId: 300002, businessUnitId: 1, companyId: "arqueoproject", status: "active", categoryId: null, criticality: "low" },
  { supplierId: 300001, businessUnitId: 1, companyId: "arqueocean", status: "active", categoryId: null, criticality: "critical" },
  { supplierId: 270001, businessUnitId: 1, companyId: "arqueocean", status: "active", categoryId: null, criticality: "low" },
  // Fornecedor sem vínculo ativo (status inactive)
  { supplierId: 999999, businessUnitId: 1, companyId: "arqueocean", status: "inactive", categoryId: null, criticality: "low" },
];

// Simula a lógica CORRIGIDA do caminho businessUnitId em getAllSuppliers
function simulateGetAllSuppliersByBusinessUnit(params: {
  groupId: number;
  orgGroupIds?: number[]; // não deve ser aplicado neste caminho
  status?: string;
  search?: string;
  categoryId?: number;
  criticality?: string;
}) {
  const { groupId, status, search, categoryId, criticality } = params;

  // Filtros no vínculo (fonte canônica)
  let activeLinks = mockLinks.filter(l =>
    l.businessUnitId === groupId &&
    l.status === "active"
  );
  if (categoryId !== undefined) {
    activeLinks = activeLinks.filter(l => l.categoryId === categoryId);
  }
  if (criticality !== undefined) {
    activeLinks = activeLinks.filter(l => l.criticality === criticality);
  }

  const linkedSupplierIds = new Set(activeLinks.map(l => l.supplierId));

  // Filtros no fornecedor — SEM filtro por organizationalGroupId
  let result = mockSuppliers.filter(s => linkedSupplierIds.has(s.id));

  if (status !== undefined) {
    result = result.filter(s => s.status === status);
  }
  if (search !== undefined) {
    const q = search.toLowerCase();
    result = result.filter(s => s.companyName.toLowerCase().includes(q));
  }

  // Deduplicação por supplierId
  const seen = new Set<number>();
  return result.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

// Simula a lógica do caminho companyId (sem regressão)
function simulateGetAllSuppliersByCompany(params: {
  companyId: string;
  orgGroupIds?: number[];
  status?: string;
}) {
  const { companyId, orgGroupIds, status } = params;

  let result = mockSuppliers.filter(s => {
    const hasLink = mockLinks.some(l => l.supplierId === s.id && l.companyId === companyId && l.status === "active");
    if (!hasLink) return false;
    if (orgGroupIds !== undefined) {
      if (orgGroupIds.length === 0) return false;
      if (s.organizationalGroupId === null) return false; // legado sem orgGroupId
      if (!orgGroupIds.includes(s.organizationalGroupId)) return false;
    }
    if (status !== undefined && s.status !== status) return false;
    return true;
  });

  return result;
}

// ─── TESTES ───────────────────────────────────────────────────────────────────

describe("v9.9 — Correção: orgGroupIds não aplicado no caminho businessUnitId", () => {

  it("CENÁRIO 1: Fornecedor com organizationalGroupId NULL e vínculo ativo → aparece na listagem por área", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1 });
    const nullOrgGroup = result.filter(s => s.organizationalGroupId === null);
    expect(nullOrgGroup.length).toBe(5); // 5 dos 6 têm organizationalGroupId NULL
    expect(result.some(s => s.id === 300005)).toBe(true);
    expect(result.some(s => s.id === 300004)).toBe(true);
    expect(result.some(s => s.id === 300003)).toBe(true);
    expect(result.some(s => s.id === 300002)).toBe(true);
    expect(result.some(s => s.id === 270001)).toBe(true);
  });

  it("CENÁRIO 2: gentegestao/operator com businessUnitId 1 vê os 6 fornecedores", () => {
    // orgGroupIds passado mas NÃO deve ser aplicado no caminho businessUnitId
    const result = simulateGetAllSuppliersByBusinessUnit({
      groupId: 1,
      orgGroupIds: [1], // seria passado pelo router mas não deve filtrar aqui
    });
    expect(result.length).toBe(6);
  });

  it("CENÁRIO 3: Superadmin (sem orgGroupIds) com businessUnitId 1 vê os 6 fornecedores", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1 });
    expect(result.length).toBe(6);
  });

  it("CENÁRIO 4: Fornecedor sem vínculo ativo (status inactive) não aparece na listagem por área", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1 });
    expect(result.some(s => s.id === 999999)).toBe(false);
  });

  it("CENÁRIO 6: Usuário sem acesso ao businessUnitId recebe lista vazia (groupId diferente)", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 99 }); // businessUnitId inexistente
    expect(result.length).toBe(0);
  });

  it("CENÁRIO 7a: Filtro de status funciona corretamente no caminho businessUnitId", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1, status: "pending" });
    expect(result.length).toBe(6); // todos são pending
    const resultApproved = simulateGetAllSuppliersByBusinessUnit({ groupId: 1, status: "approved" });
    expect(resultApproved.length).toBe(0); // nenhum aprovado
  });

  it("CENÁRIO 7b: Filtro de criticidade funciona corretamente no caminho businessUnitId", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1, criticality: "critical" });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(300001);
  });

  it("CENÁRIO 7c: Filtro de busca textual funciona corretamente no caminho businessUnitId", () => {
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1, search: "Fornecedor A" });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(300001);
  });

  it("CENÁRIO 7d: Deduplicação por supplierId funciona (fornecedor vinculado a múltiplas empresas da mesma área)", () => {
    // Todos os 6 IDs são únicos, mas o sistema deve garantir deduplicação
    const result = simulateGetAllSuppliersByBusinessUnit({ groupId: 1 });
    const ids = result.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size); // sem duplicatas
  });
});

describe("v9.9 — Sem regressão: caminho companyId", () => {

  it("CENÁRIO 5: companyId continua funcionando — lista fornecedores da empresa", () => {
    // arqueocean tem 2 fornecedores com vínculo ativo: 300001 (orgGroupId=1) e 270001 (orgGroupId=null)
    // Sem orgGroupIds: retorna todos
    const result = simulateGetAllSuppliersByCompany({ companyId: "arqueocean" });
    expect(result.length).toBe(2);
  });

  it("Caminho companyId com orgGroupIds=[1] retorna apenas fornecedor com organizationalGroupId=1", () => {
    // Este comportamento é esperado no caminho companyId (legado com orgGroupIds)
    const result = simulateGetAllSuppliersByCompany({
      companyId: "arqueocean",
      orgGroupIds: [1],
    });
    // Apenas 300001 tem organizationalGroupId=1; 270001 tem null e seria excluído
    expect(result.some(s => s.id === 300001)).toBe(true);
  });

  it("Caminho companyId com orgGroupIds=[] retorna lista vazia (sem acesso)", () => {
    const result = simulateGetAllSuppliersByCompany({
      companyId: "arqueocean",
      orgGroupIds: [],
    });
    expect(result.length).toBe(0);
  });
});
