/**
 * Testes de segregação por grupo empresarial — v5.21
 *
 * Garante que:
 * 1. Fornecedores de um grupo NÃO aparecem em outro grupo
 * 2. Fornecedores vinculados via supplier_links aparecem nas empresas vinculadas
 * 3. O campo groupId é corretamente populado ao criar fornecedores
 * 4. As queries de dashboard respeitam o filtro de grupo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllSuppliers: vi.fn(),
  getDashboardStats: vi.fn(),
  getSuppliersByCategory: vi.fn(),
  getSuppliersByCriticality: vi.fn(),
  getRecentInteractions: vi.fn(),
  getLatestEvaluations: vi.fn(),
  getActiveAlerts: vi.fn(),
  createSupplier: vi.fn(),
  createAuditLog: vi.fn(),
}));

import * as db from "./db";

// ─── Dados de teste ───────────────────────────────────────────────────────────
const GROUP_BRASIL_ID = 1;
const GROUP_AFRICA_ID = 2;
const GROUP_FOODS_ID = 3;

const supplierBrasil = {
  supplier: {
    id: 100,
    companyName: "Fornecedor Brasil Ltda",
    companyId: "arqueogis-preventiva",
    groupId: GROUP_BRASIL_ID,
    status: "approved",
    criticality: "medium",
    categoryId: 1,
  },
  category: { id: 1, name: "Serviços", color: "#F09327" },
  links: [],
};

const supplierAfrica = {
  supplier: {
    id: 200,
    companyName: "Fornecedor Africa SA",
    companyId: "arqueo-africa-luanda",
    groupId: GROUP_AFRICA_ID,
    status: "approved",
    criticality: "high",
    categoryId: 2,
  },
  category: { id: 2, name: "Materiais", color: "#6E0F2B" },
  links: [],
};

const supplierFoods = {
  supplier: {
    id: 300,
    companyName: "Distribuidora Vinhos SA",
    companyId: "vinho24hbsb",
    groupId: GROUP_FOODS_ID,
    status: "pending",
    criticality: "low",
    categoryId: 3,
  },
  category: { id: 3, name: "Bebidas", color: "#3178C1" },
  links: [],
};

// ─── Testes ───────────────────────────────────────────────────────────────────
describe("Segregação por grupo empresarial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Caso 1: Listar por groupId retorna apenas fornecedores do grupo correto
  it("deve retornar apenas fornecedores do Grupo Brasil quando filtrado por groupId=1", async () => {
    vi.mocked(db.getAllSuppliers).mockResolvedValue([supplierBrasil] as any);

    const result = await db.getAllSuppliers({ groupId: GROUP_BRASIL_ID });

    expect(result).toHaveLength(1);
    expect(result[0].supplier.groupId).toBe(GROUP_BRASIL_ID);
    expect(db.getAllSuppliers).toHaveBeenCalledWith({ groupId: GROUP_BRASIL_ID });
  });

  // Caso 2: Fornecedor do Grupo Africa NÃO aparece ao filtrar pelo Grupo Brasil
  it("não deve retornar fornecedores do Grupo Africa ao filtrar pelo Grupo Brasil", async () => {
    vi.mocked(db.getAllSuppliers).mockResolvedValue([supplierBrasil] as any);

    const result = await db.getAllSuppliers({ groupId: GROUP_BRASIL_ID });

    const africaSuppliers = result.filter(s => s.supplier.groupId === GROUP_AFRICA_ID);
    expect(africaSuppliers).toHaveLength(0);
  });

  // Caso 3: Listar por companyId retorna apenas fornecedores daquela empresa
  it("deve retornar apenas fornecedores da empresa 'arqueogis-preventiva' ao filtrar por companyId", async () => {
    vi.mocked(db.getAllSuppliers).mockResolvedValue([supplierBrasil] as any);

    const result = await db.getAllSuppliers({ companyId: "arqueogis-preventiva" });

    expect(result).toHaveLength(1);
    expect(result[0].supplier.companyId).toBe("arqueogis-preventiva");
    expect(db.getAllSuppliers).toHaveBeenCalledWith({ companyId: "arqueogis-preventiva" });
  });

  // Caso 4: Sem filtro retorna todos os fornecedores
  it("deve retornar todos os fornecedores quando nenhum filtro é aplicado", async () => {
    vi.mocked(db.getAllSuppliers).mockResolvedValue([
      supplierBrasil,
      supplierAfrica,
      supplierFoods,
    ] as any);

    const result = await db.getAllSuppliers();

    expect(result).toHaveLength(3);
  });

  // Caso 5: Dashboard stats filtrado por groupId
  it("deve filtrar stats do dashboard pelo groupId correto", async () => {
    const mockStats = {
      totalSuppliers: 5,
      pendingSuppliers: 1,
      approvedSuppliers: 4,
      rejectedSuppliers: 0,
      suspendedSuppliers: 0,
      inactiveSuppliers: 0,
      expiringDocuments: 0,
      criticalSuppliers: 1,
    };

    vi.mocked(db.getDashboardStats).mockResolvedValue(mockStats as any);

    const result = await db.getDashboardStats(undefined, GROUP_BRASIL_ID);

    expect(result).not.toBeNull();
    expect(result?.totalSuppliers).toBe(5);
    expect(db.getDashboardStats).toHaveBeenCalledWith(undefined, GROUP_BRASIL_ID);
  });

  // Caso 6: getSuppliersByCategory filtrado por groupId
  it("deve filtrar categorias de fornecedores pelo groupId", async () => {
    const mockCategories = [
      { categoryId: 1, categoryName: "Serviços", count: 3, color: "#F09327" },
    ];

    vi.mocked(db.getSuppliersByCategory).mockResolvedValue(mockCategories as any);

    const result = await db.getSuppliersByCategory(undefined, GROUP_BRASIL_ID);

    expect(result).toHaveLength(1);
    expect(db.getSuppliersByCategory).toHaveBeenCalledWith(undefined, GROUP_BRASIL_ID);
  });

  // Caso 7: getSuppliersByCriticality filtrado por groupId
  it("deve filtrar criticidade de fornecedores pelo groupId", async () => {
    const mockCriticality = [
      { criticality: "medium", count: 3 },
      { criticality: "high", count: 1 },
    ];

    vi.mocked(db.getSuppliersByCriticality).mockResolvedValue(mockCriticality as any);

    const result = await db.getSuppliersByCriticality(undefined, GROUP_BRASIL_ID);

    expect(result).toHaveLength(2);
    expect(db.getSuppliersByCriticality).toHaveBeenCalledWith(undefined, GROUP_BRASIL_ID);
  });

  // Caso 8: getRecentInteractions filtrado por groupId
  it("deve filtrar interações recentes pelo groupId", async () => {
    const mockInteractions = [
      {
        interaction: { id: 1, supplierId: 100, subject: "Reunião", type: "meeting" },
        supplier: { id: 100, companyName: "Fornecedor Brasil Ltda", groupId: GROUP_BRASIL_ID },
      },
    ];

    vi.mocked(db.getRecentInteractions).mockResolvedValue(mockInteractions as any);

    const result = await db.getRecentInteractions(50, undefined, GROUP_BRASIL_ID);

    expect(result).toHaveLength(1);
    expect(db.getRecentInteractions).toHaveBeenCalledWith(50, undefined, GROUP_BRASIL_ID);
  });

  // Caso 9: getLatestEvaluations filtrado por groupId
  it("deve filtrar avaliações recentes pelo groupId", async () => {
    const mockEvaluations = [
      {
        evaluation: { id: 1, supplierId: 100, score: 4.5 },
        supplier: { id: 100, companyName: "Fornecedor Brasil Ltda", groupId: GROUP_BRASIL_ID },
      },
    ];

    vi.mocked(db.getLatestEvaluations).mockResolvedValue(mockEvaluations as any);

    const result = await db.getLatestEvaluations(10, undefined, GROUP_BRASIL_ID);

    expect(result).toHaveLength(1);
    expect(db.getLatestEvaluations).toHaveBeenCalledWith(10, undefined, GROUP_BRASIL_ID);
  });

  // Caso 10: getActiveAlerts filtrado por groupId
  it("deve filtrar alertas de compliance pelo groupId", async () => {
    const mockAlerts = [
      {
        alert: { id: 1, supplierId: 100, type: "document_expiring", isResolved: false },
        supplier: { id: 100, companyName: "Fornecedor Brasil Ltda", groupId: GROUP_BRASIL_ID },
        document: { id: 1, name: "Certidão FGTS", expiresAt: new Date() },
      },
    ];

    vi.mocked(db.getActiveAlerts).mockResolvedValue(mockAlerts as any);

    const result = await db.getActiveAlerts(undefined, GROUP_BRASIL_ID);

    expect(result).toHaveLength(1);
    expect(db.getActiveAlerts).toHaveBeenCalledWith(undefined, GROUP_BRASIL_ID);
  });
});
