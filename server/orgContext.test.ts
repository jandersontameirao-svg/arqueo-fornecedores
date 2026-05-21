import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveOrgContext, canAccessGroup, canAccessCompany, canAccessBusinessUnit, canAdmin, buildScopeFilter } from "./orgContext";
import type { OrgContext } from "./orgContext";

// Mock user objects
const superAdminUser = {
  id: 1,
  openId: "owner_001",
  name: "Super Admin",
  email: "admin@arqueo.com",
  role: "admin" as const,
  globalRole: "superadmin_global" as const,
  defaultOrgGroupId: null,
  isActive: true,
  loginMethod: "oauth" as const,
  lastSignedIn: new Date(),
  createdAt: new Date(),
};

const groupAdminUser = {
  id: 2,
  openId: "group_admin_001",
  name: "Group Admin",
  email: "gadmin@arqueo.com",
  role: "admin" as const,
  globalRole: "group_admin" as const,
  defaultOrgGroupId: 1,
  isActive: true,
  loginMethod: "oauth" as const,
  lastSignedIn: new Date(),
  createdAt: new Date(),
};

const operatorUser = {
  id: 3,
  openId: "operator_001",
  name: "Operator",
  email: "operator@arqueo.com",
  role: "manager" as const,
  globalRole: "operator" as const,
  defaultOrgGroupId: 1,
  isActive: true,
  loginMethod: "manual" as const,
  lastSignedIn: new Date(),
  createdAt: new Date(),
};

describe("OrgContext — Access Control Functions", () => {
  describe("canAccessGroup", () => {
    it("should allow super admin to access any group", () => {
      const ctx: OrgContext = {
        globalRole: "superadmin_global",
        defaultOrgGroupId: null,
        accessibleGroupIds: [1, 2, 3],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1, 2, 3],
        effectiveLevel: "global",
        isSuperAdmin: true,
      };
      expect(canAccessGroup(ctx, 1)).toBe(true);
      expect(canAccessGroup(ctx, 2)).toBe(true);
      expect(canAccessGroup(ctx, 999)).toBe(true); // super admin has global access
    });

    it("should restrict group admin to their assigned groups", () => {
      const ctx: OrgContext = {
        globalRole: "group_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "group",
        isSuperAdmin: false,
      };
      expect(canAccessGroup(ctx, 1)).toBe(true);
      expect(canAccessGroup(ctx, 2)).toBe(false);
    });
  });

  describe("canAccessCompany", () => {
    it("should allow access to companies within accessible list", () => {
      const ctx: OrgContext = {
        globalRole: "company_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1, 2],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "company",
        isSuperAdmin: false,
      };
      expect(canAccessCompany(ctx, 1)).toBe(true);
      expect(canAccessCompany(ctx, 2)).toBe(true);
      expect(canAccessCompany(ctx, 3)).toBe(false);
    });

    it("should allow super admin to access any company", () => {
      const ctx: OrgContext = {
        globalRole: "superadmin_global",
        defaultOrgGroupId: null,
        accessibleGroupIds: [1, 2, 3],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1, 2, 3],
        effectiveLevel: "global",
        isSuperAdmin: true,
      };
      expect(canAccessCompany(ctx, 999)).toBe(true);
    });
  });

  describe("canAccessBusinessUnit", () => {
    it("should restrict operator to their assigned business units", () => {
      const ctx: OrgContext = {
        globalRole: "operator",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "business_unit",
        isSuperAdmin: false,
      };
      expect(canAccessBusinessUnit(ctx, 1)).toBe(true);
      expect(canAccessBusinessUnit(ctx, 2)).toBe(false);
    });
  });

  describe("canAdmin", () => {
    it("should return true for superadmin_global", () => {
      const ctx: OrgContext = {
        globalRole: "superadmin_global",
        defaultOrgGroupId: null,
        accessibleGroupIds: [1, 2, 3],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1, 2, 3],
        effectiveLevel: "global",
        isSuperAdmin: true,
      };
      expect(canAdmin(ctx)).toBe(true);
    });

    it("should return true for group_admin", () => {
      const ctx: OrgContext = {
        globalRole: "group_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "group",
        isSuperAdmin: false,
      };
      expect(canAdmin(ctx)).toBe(true);
    });

    it("should return false for operator", () => {
      const ctx: OrgContext = {
        globalRole: "operator",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "business_unit",
        isSuperAdmin: false,
      };
      expect(canAdmin(ctx)).toBe(false);
    });

    it("should return false for viewer", () => {
      const ctx: OrgContext = {
        globalRole: "viewer",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [],
        accessibleBusinessUnitIds: [],
        effectiveLevel: "business_unit",
        isSuperAdmin: false,
      };
      expect(canAdmin(ctx)).toBe(false);
    });
  });

  describe("buildScopeFilter", () => {
    it("should return all accessible IDs for super admin (no filter needed)", () => {
      const ctx: OrgContext = {
        globalRole: "superadmin_global",
        defaultOrgGroupId: null,
        accessibleGroupIds: [1, 2, 3],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1, 2, 3],
        effectiveLevel: "global",
        isSuperAdmin: true,
      };
      const filter = buildScopeFilter(ctx);
      expect(filter.groupIds).toEqual([1, 2, 3]);
      expect(filter.companyIds).toEqual([1, 2, 3, 4]);
      expect(filter.buIds).toEqual([1, 2, 3]);
    });

    it("should return scope filter for non-super-admin users", () => {
      const ctx: OrgContext = {
        globalRole: "group_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "group",
        isSuperAdmin: false,
      };
      const filter = buildScopeFilter(ctx);
      expect(filter.groupIds).toEqual([1]);
      expect(filter.companyIds).toEqual([1, 2, 3, 4]);
      expect(filter.buIds).toEqual([1]);
    });
  });

  describe("Isolation between groups", () => {
    it("should not allow group 1 admin to see group 2 data", () => {
      const group1Ctx: OrgContext = {
        globalRole: "group_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1],
        accessibleCompanyIds: [1, 2, 3, 4],
        accessibleBusinessUnitIds: [1],
        effectiveLevel: "group",
        isSuperAdmin: false,
      };
      
      // Group 2 resources
      expect(canAccessGroup(group1Ctx, 2)).toBe(false);
      expect(canAccessCompany(group1Ctx, 5)).toBe(false); // company 5 belongs to group 2
      expect(canAccessBusinessUnit(group1Ctx, 2)).toBe(false);
    });

    it("should allow multi-group user to access both groups", () => {
      const multiGroupCtx: OrgContext = {
        globalRole: "group_admin",
        defaultOrgGroupId: 1,
        accessibleGroupIds: [1, 2],
        accessibleCompanyIds: [1, 2, 3, 4, 5],
        accessibleBusinessUnitIds: [1, 2],
        effectiveLevel: "group",
        isSuperAdmin: false,
      };
      
      expect(canAccessGroup(multiGroupCtx, 1)).toBe(true);
      expect(canAccessGroup(multiGroupCtx, 2)).toBe(true);
      expect(canAccessGroup(multiGroupCtx, 3)).toBe(false);
    });
  });
});

// ==================== SCOPE FILTER INTEGRATION TESTS ====================
// Testa que buildScopeFilter produz os orgGroupIds corretos para cada tipo de usuário
// e que os filtros de db.ts respeitam esses IDs.

describe("buildScopeFilter — orgGroupIds para procedures de listagem", () => {
  it("superadmin: orgGroupIds deve incluir todos os grupos acessíveis", () => {
    const ctx: OrgContext = {
      globalRole: "superadmin_global",
      defaultOrgGroupId: null,
      accessibleGroupIds: [1, 2, 3],
      accessibleCompanyIds: [1, 2, 3, 4],
      accessibleBusinessUnitIds: [1, 2, 3],
      effectiveLevel: "global",
      isSuperAdmin: true,
    };
    const scope = buildScopeFilter(ctx);
    // Super admin vê todos os grupos — orgGroupIds = [1, 2, 3]
    expect(scope.groupIds).toEqual([1, 2, 3]);
    expect(scope.groupIds.length).toBeGreaterThan(0);
  });

  it("group_admin do grupo 1: orgGroupIds deve ser [1] (isolamento do grupo 2)", () => {
    const ctx: OrgContext = {
      globalRole: "group_admin",
      defaultOrgGroupId: 1,
      accessibleGroupIds: [1],
      accessibleCompanyIds: [1, 2, 3, 4],
      accessibleBusinessUnitIds: [1],
      effectiveLevel: "group",
      isSuperAdmin: false,
    };
    const scope = buildScopeFilter(ctx);
    expect(scope.groupIds).toEqual([1]);
    // Não deve incluir grupo 2 ou 3
    expect(scope.groupIds).not.toContain(2);
    expect(scope.groupIds).not.toContain(3);
  });

  it("operator sem grupos: orgGroupIds deve ser [] (sem acesso a nenhum dado)", () => {
    const ctx: OrgContext = {
      globalRole: "operator",
      defaultOrgGroupId: null,
      accessibleGroupIds: [],
      accessibleCompanyIds: [],
      accessibleBusinessUnitIds: [],
      effectiveLevel: "business_unit",
      isSuperAdmin: false,
    };
    const scope = buildScopeFilter(ctx);
    expect(scope.groupIds).toEqual([]);
    // Quando orgGroupIds = [], db.getAllSuppliers/Contracts/Documents deve retornar []
    // (lógica de early-return no db.ts: if orgGroupIds.length === 0 return [])
  });

  it("viewer com acesso a grupo 2: orgGroupIds deve ser [2]", () => {
    const ctx: OrgContext = {
      globalRole: "viewer",
      defaultOrgGroupId: 2,
      accessibleGroupIds: [2],
      accessibleCompanyIds: [5],
      accessibleBusinessUnitIds: [2],
      effectiveLevel: "group",
      isSuperAdmin: false,
    };
    const scope = buildScopeFilter(ctx);
    expect(scope.groupIds).toEqual([2]);
    expect(scope.groupIds).not.toContain(1);
  });

  it("buildScopeFilter com requestedScope: deve restringir ao grupo solicitado se acessível", () => {
    const ctx: OrgContext = {
      globalRole: "group_admin",
      defaultOrgGroupId: 1,
      accessibleGroupIds: [1, 2],
      accessibleCompanyIds: [1, 2, 3, 4, 5],
      accessibleBusinessUnitIds: [1, 2],
      effectiveLevel: "group",
      isSuperAdmin: false,
    };
    const scope = buildScopeFilter(ctx, { organizationalGroupId: 1 });
    expect(scope.groupIds).toEqual([1]);
  });

  it("buildScopeFilter com requestedScope inacessível: deve retornar arrays vazios", () => {
    const ctx: OrgContext = {
      globalRole: "group_admin",
      defaultOrgGroupId: 1,
      accessibleGroupIds: [1],
      accessibleCompanyIds: [1, 2, 3, 4],
      accessibleBusinessUnitIds: [1],
      effectiveLevel: "group",
      isSuperAdmin: false,
    };
    // Solicita grupo 3, mas só tem acesso ao grupo 1
    const scope = buildScopeFilter(ctx, { organizationalGroupId: 3 });
    expect(scope.groupIds).toEqual([]);
    expect(scope.companyIds).toEqual([]);
    expect(scope.buIds).toEqual([]);
  });
});
