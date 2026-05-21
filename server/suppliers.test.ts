import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock orgContext to avoid real DB calls from resolveOrgContext
vi.mock("./orgContext", () => ({
  resolveOrgContext: vi.fn().mockResolvedValue({
    globalRole: "superadmin_global",
    defaultOrgGroupId: null,
    accessibleGroupIds: [1, 2, 3],
    accessibleCompanyIds: [1, 2, 3, 4],
    accessibleBusinessUnitIds: [1, 2, 3],
    effectiveLevel: "global",
    isSuperAdmin: true,
  }),
  buildScopeFilter: vi.fn().mockReturnValue({
    groupIds: [1, 2, 3],
    companyIds: [1, 2, 3, 4],
    buIds: [1, 2, 3],
  }),
  canAccessGroup: vi.fn().mockReturnValue(true),
  canAccessCompany: vi.fn().mockReturnValue(true),
  canAccessBusinessUnit: vi.fn().mockReturnValue(true),
  canAdmin: vi.fn().mockReturnValue(true),
  canManage: vi.fn().mockReturnValue(true),
  isRoleAtLeast: vi.fn().mockReturnValue(true),
  listOrganizationalGroups: vi.fn().mockResolvedValue([]),
  getOrganizationalGroupById: vi.fn().mockResolvedValue(null),
  getUserGroupRoles: vi.fn().mockResolvedValue([]),
  getUserCompanyRoles: vi.fn().mockResolvedValue([]),
  getUserBusinessUnitRoles: vi.fn().mockResolvedValue([]),
}));

// Mock the database module with all required functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  // Supplier functions
  getSuppliers: vi.fn().mockResolvedValue([
    {
      id: 1,
      companyName: "Fornecedor Teste",
      tradeName: "Teste LTDA",
      cnpj: "12.345.678/0001-90",
      status: "active",
      criticality: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAllSuppliers: vi.fn().mockResolvedValue([
    {
      id: 1,
      companyName: "Fornecedor Teste",
      tradeName: "Teste LTDA",
      cnpj: "12.345.678/0001-90",
      status: "active",
      criticality: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getSupplierById: vi.fn().mockResolvedValue({
    id: 1,
    companyName: "Fornecedor Teste",
    tradeName: "Teste LTDA",
    cnpj: "12.345.678/0001-90",
    status: "active",
    criticality: "medium",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createSupplier: vi.fn().mockResolvedValue(1),
  updateSupplier: vi.fn().mockResolvedValue(undefined),
  deleteSupplier: vi.fn().mockResolvedValue(undefined),
  
  // Business Unit access functions
  getUserBusinessUnitIds: vi.fn().mockResolvedValue([1]),

  // Workflow functions
  createWorkflow: vi.fn().mockResolvedValue(1),
  createWorkflowStep: vi.fn().mockResolvedValue(1),
  getSupplierWorkflows: vi.fn().mockResolvedValue([]),
  getWorkflowSteps: vi.fn().mockResolvedValue([]),
  getPendingWorkflows: vi.fn().mockResolvedValue([]),
  updateWorkflow: vi.fn().mockResolvedValue(undefined),
  updateWorkflowStep: vi.fn().mockResolvedValue(undefined),
  
  // Audit functions
  createAuditLog: vi.fn().mockResolvedValue(1),
  getAuditLogs: vi.fn().mockResolvedValue([]),
  
  // Dashboard functions
  getDashboardStats: vi.fn().mockResolvedValue({
    totalSuppliers: 10,
    approvedSuppliers: 8,
    pendingApproval: 2,
    totalDocuments: 25,
    expiringDocuments: 3,
    activeAlerts: 1,
  }),
  getSuppliersByCategory: vi.fn().mockResolvedValue([
    { categoryName: "Serviços", count: 5 },
    { categoryName: "Tecnologia", count: 3 },
  ]),
  getSuppliersByCriticality: vi.fn().mockResolvedValue([
    { criticality: "high", count: 2 },
    { criticality: "medium", count: 5 },
    { criticality: "low", count: 3 },
  ]),
  
  // Category functions
  getCategories: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn().mockResolvedValue(1),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  
  // Document functions
  getSupplierDocuments: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(1),
  updateDocument: vi.fn().mockResolvedValue(undefined),
  deleteDocument: vi.fn().mockResolvedValue(undefined),
  getAllDocuments: vi.fn().mockResolvedValue([]),
  getExpiringDocuments: vi.fn().mockResolvedValue([]),
  
  // Contact functions
  getSupplierContacts: vi.fn().mockResolvedValue([]),
  createContact: vi.fn().mockResolvedValue(1),
  updateContact: vi.fn().mockResolvedValue(undefined),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  
  // Interaction functions
  getSupplierInteractions: vi.fn().mockResolvedValue([]),
  getRecentInteractions: vi.fn().mockResolvedValue([]),
  createInteraction: vi.fn().mockResolvedValue(1),
  updateInteraction: vi.fn().mockResolvedValue(undefined),
  deleteInteraction: vi.fn().mockResolvedValue(undefined),
  
  // Evaluation functions
  getSupplierEvaluations: vi.fn().mockResolvedValue([]),
  getLatestEvaluations: vi.fn().mockResolvedValue([]),
  createEvaluation: vi.fn().mockResolvedValue(1),
  
  // Compliance functions
  getComplianceAlerts: vi.fn().mockResolvedValue([]),
  createAlert: vi.fn().mockResolvedValue(1),
  resolveAlert: vi.fn().mockResolvedValue(undefined),
  
  // User functions
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "manager" | "reader" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("suppliers router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("suppliers.list", () => {
    it("returns list of suppliers for authenticated user", async () => {
      const ctx = createAuthContext("reader");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.suppliers.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("throws error for unauthenticated user", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.suppliers.list({})).rejects.toThrow();
    });
  });

  describe("suppliers.getById", () => {
    it("returns supplier details for authenticated user", async () => {
      const ctx = createAuthContext("reader");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.suppliers.getById({ id: 1 });

      expect(result).toBeDefined();
      expect(result?.companyName).toBe("Fornecedor Teste");
    });
  });

  describe("suppliers.create", () => {
    it("allows manager to create supplier", async () => {
      const ctx = createAuthContext("manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.suppliers.create({
        companyName: "Nova Empresa",
        cnpj: "98.765.432/0001-10",
        email: "nova@empresa.com",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("denies reader from creating supplier", async () => {
      const ctx = createAuthContext("reader");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.suppliers.create({
          companyName: "Nova Empresa",
          cnpj: "98.765.432/0001-10",
          email: "nova@empresa.com",
        })
      ).rejects.toThrow();
    });
  });
});

describe("dashboard router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dashboard stats for authenticated user", async () => {
    const ctx = createAuthContext("reader");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toBeDefined();
    expect(result.totalSuppliers).toBe(10);
    expect(result.approvedSuppliers).toBe(8);
  });

  it("returns suppliers by category", async () => {
    const ctx = createAuthContext("reader");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.suppliersByCategory();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns suppliers by criticality", async () => {
    const ctx = createAuthContext("reader");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.suppliersByCriticality();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth router", () => {
  it("returns user info for authenticated user", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("admin");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
