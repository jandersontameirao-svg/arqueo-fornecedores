/**
 * Organizational Context & Hierarchical RBAC Module
 * 
 * Provides:
 * 1. OrgContext type — represents the user's active organizational scope
 * 2. resolveOrgContext() — resolves the user's effective permissions for a given group/company/BU
 * 3. scopedProcedure — tRPC middleware that injects orgContext into ctx
 * 4. Permission helpers — canAccessGroup, canAccessCompany, canManage, etc.
 * 
 * Hierarchy:
 *   superadmin_global > group_admin > company_admin > business_manager > operator > viewer
 * 
 * Isolation Rule:
 *   A user can ONLY see data belonging to groups/companies/BUs where they have explicit roles
 *   OR where their globalRole grants implicit access (superadmin_global sees everything).
 */

import { eq, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  organizationalGroups,
  userGroupRoles,
  userCompanyRoles,
  userBusinessUnitRoles,
  businessUnits,
  companies,
} from "../drizzle/schema";
import type { User } from "../drizzle/schema";

// Lazy singleton DB connection (same pattern as server/db.ts)
let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db!;
}

// ==================== TYPES ====================

export type GlobalRole = "superadmin_global" | "group_admin" | "company_admin" | "business_manager" | "operator" | "viewer";

export type OrgPermissionLevel = "admin" | "operator" | "viewer" | "none";

export interface OrgContext {
  /** The user's global role */
  globalRole: GlobalRole;
  /** User's default organizational group ID */
  defaultOrgGroupId: number | null;
  /** All group IDs the user has access to */
  accessibleGroupIds: number[];
  /** All company IDs the user has access to */
  accessibleCompanyIds: number[];
  /** All business unit IDs the user has access to */
  accessibleBusinessUnitIds: number[];
  /** Effective permission level for the current context */
  effectiveLevel: OrgPermissionLevel;
  /** Whether the user is a super admin (sees everything) */
  isSuperAdmin: boolean;
}

export interface ScopeFilter {
  organizationalGroupId?: number;
  orgCompanyId?: number;
  orgBusinessUnitId?: number;
}

// ==================== ROLE HIERARCHY ====================

const ROLE_HIERARCHY: Record<GlobalRole, number> = {
  superadmin_global: 100,
  group_admin: 80,
  company_admin: 60,
  business_manager: 40,
  operator: 20,
  viewer: 10,
};

export function isRoleAtLeast(userRole: GlobalRole, requiredRole: GlobalRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ==================== CONTEXT RESOLUTION ====================

/**
 * Resolves the full organizational context for a user.
 * This is the primary function called by middleware to determine what data a user can see.
 */
export async function resolveOrgContext(user: User): Promise<OrgContext> {
  const globalRole = (user.globalRole as GlobalRole) || "viewer";
  const isSuperAdmin = globalRole === "superadmin_global";

  // Super admins can access everything
  if (isSuperAdmin) {
    const allGroups = await getDb().select({ id: organizationalGroups.id }).from(organizationalGroups);
    const allCompanies = await getDb().select({ id: companies.id }).from(companies);
    const allBUs = await getDb().select({ id: businessUnits.id }).from(businessUnits);

    return {
      globalRole,
      defaultOrgGroupId: user.defaultOrgGroupId,
      accessibleGroupIds: allGroups.map((g: { id: number }) => g.id),
      accessibleCompanyIds: allCompanies.map((c: { id: number }) => c.id),
      accessibleBusinessUnitIds: allBUs.map((b: { id: number }) => b.id),
      effectiveLevel: "admin" as OrgPermissionLevel,
      isSuperAdmin: true,
    };
  }

  // For non-super-admins, resolve from role tables
  const groupRoles = await getDb()
    .select({ organizationalGroupId: userGroupRoles.organizationalGroupId })
    .from(userGroupRoles)
    .where(eq(userGroupRoles.userId, user.id));

  const companyRoles = await getDb()
    .select({ companyId: userCompanyRoles.companyId, organizationalGroupId: userCompanyRoles.organizationalGroupId })
    .from(userCompanyRoles)
    .where(eq(userCompanyRoles.userId, user.id));

  const buRoles = await getDb()
    .select({ businessUnitId: userBusinessUnitRoles.businessUnitId, organizationalGroupId: userBusinessUnitRoles.organizationalGroupId })
    .from(userBusinessUnitRoles)
    .where(eq(userBusinessUnitRoles.userId, user.id));

  const accessibleGroupIds: number[] = Array.from(new Set(groupRoles.map((r: { organizationalGroupId: number }) => r.organizationalGroupId)));
  const accessibleCompanyIds: number[] = Array.from(new Set(companyRoles.map((r: { companyId: number }) => r.companyId)));
  const accessibleBusinessUnitIds: number[] = Array.from(new Set(buRoles.map((r: { businessUnitId: number }) => r.businessUnitId)));

  // If user has group-level roles, they can also access all companies/BUs in those groups
  if (accessibleGroupIds.length > 0) {
    const groupCompanies = await getDb()
      .select({ id: companies.id })
      .from(companies)
      .where(inArray(companies.organizationalGroupId, accessibleGroupIds));
    
    const groupBUs = await getDb()
      .select({ id: businessUnits.id })
      .from(businessUnits)
      .where(inArray(businessUnits.organizationalGroupId, accessibleGroupIds));

    groupCompanies.forEach((c: { id: number }) => {
      if (!accessibleCompanyIds.includes(c.id)) accessibleCompanyIds.push(c.id);
    });
    groupBUs.forEach((b: { id: number }) => {
      if (!accessibleBusinessUnitIds.includes(b.id)) accessibleBusinessUnitIds.push(b.id);
    });
  }

  // Fallback: if user has legacy role=admin but no globalRole assignments, grant full access
  // This ensures backward compatibility during migration
  if (accessibleGroupIds.length === 0 && user.role === "admin") {
    const allGroups = await getDb().select({ id: organizationalGroups.id }).from(organizationalGroups);
    const allCompanies = await getDb().select({ id: companies.id }).from(companies);
    const allBUs = await getDb().select({ id: businessUnits.id }).from(businessUnits);

    return {
      globalRole,
      defaultOrgGroupId: user.defaultOrgGroupId,
      accessibleGroupIds: allGroups.map((g: { id: number }) => g.id),
      accessibleCompanyIds: allCompanies.map((c: { id: number }) => c.id),
      accessibleBusinessUnitIds: allBUs.map((b: { id: number }) => b.id),
      effectiveLevel: "admin" as OrgPermissionLevel,
      isSuperAdmin: false,
    };
  }

  // Determine effective permission level
  let effectiveLevel: OrgPermissionLevel = "none";
  if (isRoleAtLeast(globalRole, "group_admin")) {
    effectiveLevel = "admin";
  } else if (isRoleAtLeast(globalRole, "operator")) {
    effectiveLevel = "operator";
  } else if (isRoleAtLeast(globalRole, "viewer")) {
    effectiveLevel = "viewer";
  }

  return {
    globalRole,
    defaultOrgGroupId: user.defaultOrgGroupId,
    accessibleGroupIds,
    accessibleCompanyIds,
    accessibleBusinessUnitIds,
    effectiveLevel,
    isSuperAdmin: false,
  };
}

// ==================== PERMISSION CHECKS ====================

/**
 * Check if user can access data belonging to a specific organizational group
 */
export function canAccessGroup(ctx: OrgContext, groupId: number): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.accessibleGroupIds.includes(groupId);
}

/**
 * Check if user can access data belonging to a specific company
 */
export function canAccessCompany(ctx: OrgContext, companyId: number): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.accessibleCompanyIds.includes(companyId);
}

/**
 * Check if user can access data belonging to a specific business unit
 */
export function canAccessBusinessUnit(ctx: OrgContext, buId: number): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.accessibleBusinessUnitIds.includes(buId);
}

/**
 * Check if user has at least operator-level permissions (can create/edit)
 */
export function canManage(ctx: OrgContext): boolean {
  return ctx.effectiveLevel === "admin" || ctx.effectiveLevel === "operator";
}

/**
 * Check if user has admin-level permissions (can delete, manage users)
 */
export function canAdmin(ctx: OrgContext): boolean {
  const adminRoles: GlobalRole[] = ["superadmin_global", "group_admin", "company_admin"];
  return adminRoles.includes(ctx.globalRole as GlobalRole);
}

// ==================== SCOPE FILTER BUILDER ====================

/**
 * Builds a WHERE clause filter for organizational scope.
 * Used by db queries to restrict data to what the user can see.
 */
export function buildScopeFilter(ctx: OrgContext, requestedScope?: ScopeFilter): {
  groupIds: number[];
  companyIds: number[];
  buIds: number[];
} {
  // If super admin and no specific scope requested, return all
  if (ctx.isSuperAdmin && !requestedScope) {
    return {
      groupIds: ctx.accessibleGroupIds,
      companyIds: ctx.accessibleCompanyIds,
      buIds: ctx.accessibleBusinessUnitIds,
    };
  }

  // If a specific scope is requested, validate access
  let groupIds = ctx.accessibleGroupIds;
  let companyIds = ctx.accessibleCompanyIds;
  let buIds = ctx.accessibleBusinessUnitIds;

  if (requestedScope?.organizationalGroupId) {
    if (!canAccessGroup(ctx, requestedScope.organizationalGroupId)) {
      return { groupIds: [], companyIds: [], buIds: [] };
    }
    groupIds = [requestedScope.organizationalGroupId];
  }

  if (requestedScope?.orgCompanyId) {
    if (!canAccessCompany(ctx, requestedScope.orgCompanyId)) {
      return { groupIds: [], companyIds: [], buIds: [] };
    }
    companyIds = [requestedScope.orgCompanyId];
  }

  if (requestedScope?.orgBusinessUnitId) {
    if (!canAccessBusinessUnit(ctx, requestedScope.orgBusinessUnitId)) {
      return { groupIds: [], companyIds: [], buIds: [] };
    }
    buIds = [requestedScope.orgBusinessUnitId];
  }

  return { groupIds, companyIds, buIds };
}

// ==================== ORGANIZATIONAL GROUPS CRUD ====================

export async function listOrganizationalGroups() {
  return getDb().select().from(organizationalGroups);
}

export async function getOrganizationalGroupById(id: number) {
  const [group] = await getDb().select().from(organizationalGroups).where(eq(organizationalGroups.id, id));
  return group || null;
}

export async function getUserGroupRoles(userId: number) {
  return getDb().select().from(userGroupRoles).where(eq(userGroupRoles.userId, userId));
}

export async function getUserCompanyRoles(userId: number) {
  return getDb().select().from(userCompanyRoles).where(eq(userCompanyRoles.userId, userId));
}

export async function getUserBusinessUnitRoles(userId: number) {
  return getDb().select().from(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.userId, userId));
}
