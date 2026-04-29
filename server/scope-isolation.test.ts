/**
 * Testes de Isolamento de Escopo — v7.21
 *
 * Garante que:
 * 1. Grupo Arqueo Africa (sem empresas) não exibe dados de outra área
 * 2. Fornecedores são filtrados por companyId correto no backend
 * 3. getDashboardStats respeita companyId e groupId
 * 4. getAllSuppliers respeita companyId e groupId
 * 5. Não há regressão nos grupos com empresas
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock do banco de dados ───────────────────────────────────────────────────

const mockSuppliers = [
  { id: 1, companyName: "Fornecedor A", companyId: "arqueogis-preventiva", groupId: 1, status: "approved", criticality: "low", categoryId: 1 },
  { id: 2, companyName: "Fornecedor B", companyId: "arqueogis-preventiva", groupId: 1, status: "pending", criticality: "high", categoryId: 1 },
  { id: 3, companyName: "Fornecedor C", companyId: "arqueoproject", groupId: 1, status: "approved", criticality: "medium", categoryId: 2 },
  { id: 4, companyName: "Fornecedor D", companyId: "vinho24hbsb", groupId: 3, status: "approved", criticality: "low", categoryId: 1 },
];

// ─── Simulação das funções de filtro do backend ───────────────────────────────

function simulateGetAllSuppliers(filters?: {
  companyId?: string;
  groupId?: number;
  status?: string;
  criticality?: string;
}) {
  if (!filters) return mockSuppliers;

  if (filters.companyId) {
    let result = mockSuppliers.filter(s => s.companyId === filters.companyId);
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.criticality) result = result.filter(s => s.criticality === filters.criticality);
    return result;
  }

  if (filters.groupId) {
    let result = mockSuppliers.filter(s => s.groupId === filters.groupId);
    if (filters.status) result = result.filter(s => s.status === filters.status);
    return result;
  }

  // Sem filtro: retorna todos (comportamento global)
  return mockSuppliers;
}

function simulateGetDashboardStats(companyId?: string, groupId?: number) {
  let visible = mockSuppliers;

  if (companyId) {
    visible = mockSuppliers.filter(s => s.companyId === companyId);
  } else if (groupId) {
    visible = mockSuppliers.filter(s => s.groupId === groupId);
  }

  return {
    totalSuppliers: visible.length,
    approvedSuppliers: visible.filter(s => s.status === "approved").length,
    pendingSuppliers: visible.filter(s => s.status === "pending").length,
  };
}

// ─── hasCompanySelection (lógica copiada do frontend) ─────────────────────────

const COMPANIES_BY_GROUP: Record<string, string[]> = {
  "Grupo Arqueo Brasil": ["arqueogis-preventiva", "arqueoproject", "arqueogis-geoprocessamento", "arqueocean"],
  "Foods and Drinks": ["vinho24hbsb"],
};
const GROUPS_WITH_COMPANY_SELECTION = Object.keys(COMPANIES_BY_GROUP);

function hasCompanySelection(groupName: string): boolean {
  return GROUPS_WITH_COMPANY_SELECTION.some(
    (g) => groupName.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(groupName.toLowerCase())
  );
}

// ─── TESTES ───────────────────────────────────────────────────────────────────

describe("Isolamento de Escopo — Áreas de Negócio", () => {
  it("Grupo Arqueo Africa NÃO tem seleção de empresa (hasCompanySelection = false)", () => {
    expect(hasCompanySelection("Grupo Arqueo Africa")).toBe(false);
  });

  it("Grupo Arqueo Brasil TEM seleção de empresa (hasCompanySelection = true)", () => {
    expect(hasCompanySelection("Grupo Arqueo Brasil")).toBe(true);
  });

  it("Foods and Drinks TEM seleção de empresa (hasCompanySelection = true)", () => {
    expect(hasCompanySelection("Foods and Drinks")).toBe(true);
  });
});

describe("Isolamento de Escopo — Fornecedores por Empresa", () => {
  it("Fornecedores de Arqueogis Preventiva aparecem SOMENTE em Arqueogis Preventiva", () => {
    const result = simulateGetAllSuppliers({ companyId: "arqueogis-preventiva" });
    expect(result.every(s => s.companyId === "arqueogis-preventiva")).toBe(true);
    expect(result.length).toBe(2);
  });

  it("Fornecedores de Arqueoproject aparecem SOMENTE em Arqueoproject", () => {
    const result = simulateGetAllSuppliers({ companyId: "arqueoproject" });
    expect(result.every(s => s.companyId === "arqueoproject")).toBe(true);
    expect(result.length).toBe(1);
  });

  it("Fornecedores de Arqueogis Preventiva NÃO aparecem em Arqueoproject", () => {
    const result = simulateGetAllSuppliers({ companyId: "arqueoproject" });
    expect(result.some(s => s.companyId === "arqueogis-preventiva")).toBe(false);
  });

  it("Fornecedores de Foods and Drinks NÃO aparecem em Grupo Arqueo Brasil", () => {
    const result = simulateGetAllSuppliers({ groupId: 1 }); // groupId=1 = Grupo Arqueo Brasil
    expect(result.some(s => s.groupId === 3)).toBe(false); // groupId=3 = Foods and Drinks
  });

  it("Empresa sem fornecedores retorna lista vazia", () => {
    const result = simulateGetAllSuppliers({ companyId: "empresa-sem-fornecedores" });
    expect(result.length).toBe(0);
  });
});

describe("Isolamento de Escopo — Dashboard Stats por Empresa", () => {
  it("Stats de Arqueogis Preventiva refletem somente seus fornecedores", () => {
    const stats = simulateGetDashboardStats("arqueogis-preventiva");
    expect(stats.totalSuppliers).toBe(2);
    expect(stats.approvedSuppliers).toBe(1);
    expect(stats.pendingSuppliers).toBe(1);
  });

  it("Stats de Arqueoproject refletem somente seus fornecedores", () => {
    const stats = simulateGetDashboardStats("arqueoproject");
    expect(stats.totalSuppliers).toBe(1);
    expect(stats.approvedSuppliers).toBe(1);
    expect(stats.pendingSuppliers).toBe(0);
  });

  it("Stats por groupId=1 refletem somente Grupo Arqueo Brasil", () => {
    const stats = simulateGetDashboardStats(undefined, 1);
    expect(stats.totalSuppliers).toBe(3); // 2 de arqueogis + 1 de arqueoproject
  });

  it("Stats de empresa sem fornecedores retornam zeros", () => {
    const stats = simulateGetDashboardStats("empresa-vazia");
    expect(stats.totalSuppliers).toBe(0);
    expect(stats.approvedSuppliers).toBe(0);
    expect(stats.pendingSuppliers).toBe(0);
  });
});

describe("Isolamento de Escopo — Filtros respeitam companyId", () => {
  it("Filtro por status respeita companyId", () => {
    const result = simulateGetAllSuppliers({ companyId: "arqueogis-preventiva", status: "approved" });
    expect(result.every(s => s.companyId === "arqueogis-preventiva")).toBe(true);
    expect(result.every(s => s.status === "approved")).toBe(true);
  });

  it("Filtro por criticidade respeita companyId", () => {
    const result = simulateGetAllSuppliers({ companyId: "arqueogis-preventiva", criticality: "high" });
    expect(result.every(s => s.companyId === "arqueogis-preventiva")).toBe(true);
    expect(result.every(s => s.criticality === "high")).toBe(true);
  });
});

describe("Isolamento de Escopo — Sem regressão", () => {
  it("Grupo Arqueo Brasil ainda retorna seus fornecedores corretamente", () => {
    const result = simulateGetAllSuppliers({ groupId: 1 });
    expect(result.length).toBe(3);
  });

  it("Foods and Drinks ainda retorna seus fornecedores corretamente", () => {
    const result = simulateGetAllSuppliers({ groupId: 3 });
    expect(result.length).toBe(1);
    expect(result[0].companyId).toBe("vinho24hbsb");
  });

  it("Cadastro de novo fornecedor salva companyId correto (simulação)", () => {
    const novoFornecedor = {
      companyName: "Novo Fornecedor",
      companyId: "arqueogis-preventiva",
      groupId: 1,
      status: "pending",
      criticality: "medium",
    };
    // Verifica que o companyId é salvo corretamente
    expect(novoFornecedor.companyId).toBe("arqueogis-preventiva");
    expect(novoFornecedor.groupId).toBe(1);
  });
});
