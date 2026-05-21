/**
 * Organizational Context & Hierarchical RBAC Module
 * 
 * Provides:
 * 1. OrgContext type — represents the user's active organizational scope
 * 2. resolveOrgContext() — resolves the user's effective permissions for a given group/company/BU
 * 3. Permission helpers — canAccessGroup, canAccessCompany, canManage, etc.
 * 
 * Hierarchy:
 *   superadmin_global > group_admin > company_admin > business_manager > operator > viewer
 * 
 * Isolation Rule:
 *   A user can ONLY see data belonging to groups/companies/BUs where they have explicit roles
 *   OR where their globalRole grants implicit access (superadmin_global sees everything).
 */
import { eq } from "drizzle-orm";
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
import { getDb as _getDbAsync } from "./db";
import { isSuperAdminEmail } from "../shared/superadmins";
// Use the shared async DB connection from server/db.ts (avoids duplicate connections)
async function getDb() {
  const db = await _getDbAsync();
  if (!db) throw new Error("[orgContext] Database not available");
  return db;
}

// ==================== TYPES ====================
export type GlobalRole = "superadmin_global" | "group_admin" | "company_admin" | "business_manager" | "operator" | "viewer";
export type OrgPermissionLevel = "admin" | "operator" | "viewer" | "none";

export interface OrgContext {
  globalRole: GlobalRole;
  defaultOrgGroupId: number | null;
  accessibleGroupIds: number[];
  accessibleCompanyIds: number[];
  accessibleBusinessUnitIds: number[];
  effectiveLevel: OrgPermissionLevel;
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
 * Resolves the organizational context for a given user.
 * This is the primary function called by middleware to determine what data a user can see.
 */
export async function resolveOrgContext(user: User): Promise<OrgContext> {
  // LISTA BRANCA: o status superadmin_global é determinado pelo email, não pelo banco.
  // Mesmo que o banco tenha globalRole='superadmin_global' para um email não autorizado,
  // ele será rebaixado para 'viewer' aqui. Isso garante que nenhuma manipulação direta
  // no banco de dados possa escalar privilégios.
  let globalRole = (user.globalRole as GlobalRole) || "viewer";
  if (globalRole === "superadmin_global" && !isSuperAdminEmail(user.email)) {
    console.warn(`[Security] Downgraded unauthorized superadmin_global for email: ${user.email}`);
    globalRole = "viewer";
  }
  // Garantir que emails da lista branca SEMPRE tenham superadmin_global,
  // mesmo que o banco ainda não tenha sido atualizado.
  if (isSuperAdminEmail(user.email) && globalRole !== "superadmin_global") {
    globalRole = "superadmin_global";
  }
  const isSuperAdmin = globalRole === "superadmin_global";

  // Super admins can access everything
  if (isSuperAdmin) {
    const db = await getDb();
    const allGroups = await db.select({ id: organizationalGroups.id }).from(organizationalGroups);
    const allCompanies = await db.select({ id: companies.id }).from(companies);
    const allBUs = await db.select({ id: businessUnits.id }).from(businessUnits);
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
  const db = await getDb();

  const groupRoles = await db
    .select({ organizationalGroupId: userGroupRoles.organizationalGroupId })
    .from(userGroupRoles)
    .where(eq(userGroupRoles.userId, user.id));

  const companyRoles = await db
    .select({ companyId: userCompanyRoles.companyId, organizationalGroupId: userCompanyRoles.organizationalGroupId })
    .from(userCompanyRoles)
    .where(eq(userCompanyRoles.userId, user.id));

  const buRoles = await db
    .select({ businessUnitId: userBusinessUnitRoles.businessUnitId, organizationalGroupId: userBusinessUnitRoles.organizationalGroupId })
    .from(userBusinessUnitRoles)
    .where(eq(userBusinessUnitRoles.userId, user.id));

  const accessibleGroupIds: number[] = Array.from(new Set(groupRoles.map((r: { organizationalGroupId: number }) => r.organizationalGroupId)));
  const accessibleCompanyIds: number[] = Array.from(new Set(companyRoles.map((r: { companyId: number }) => r.companyId)));
  const accessibleBusinessUnitIds: number[] = Array.from(new Set(buRoles.map((r: { businessUnitId: number }) => r.businessUnitId)));

  // Also add groups from company and BU roles
  const implicitGroupIds = Array.from(new Set([
    ...accessibleGroupIds,
    ...companyRoles.map((r: { organizationalGroupId: number }) => r.organizationalGroupId),
    ...buRoles.map((r: { organizationalGroupId: number }) => r.organizationalGroupId),
  ]));

  // If group_admin or higher, expand access to all companies/BUs within accessible groups
  if (isRoleAtLeast(globalRole, "group_admin") && implicitGroupIds.length > 0) {
    const groupCompanies = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.organizationalGroupId, implicitGroupIds[0]));
    const groupBUs = await db
      .select({ id: businessUnits.id })
      .from(businessUnits)
      .where(eq(businessUnits.organizationalGroupId, implicitGroupIds[0]));
    return {
      globalRole,
      defaultOrgGroupId: user.defaultOrgGroupId,
      accessibleGroupIds: implicitGroupIds,
      accessibleCompanyIds: groupCompanies.map((c: { id: number }) => c.id),
      accessibleBusinessUnitIds: groupBUs.map((b: { id: number }) => b.id),
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
    accessibleGroupIds: implicitGroupIds,
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
  const db = await getDb();
  return db.select().from(organizationalGroups);
}

export async function getOrganizationalGroupById(id: number) {
  const db = await getDb();
  const [group] = await db.select().from(organizationalGroups).where(eq(organizationalGroups.id, id));
  return group || null;
}

export async function getUserGroupRoles(userId: number) {
  const db = await getDb();
  return db.select().from(userGroupRoles).where(eq(userGroupRoles.userId, userId));
}

export async function getUserCompanyRoles(userId: number) {
  const db = await getDb();
  return db.select().from(userCompanyRoles).where(eq(userCompanyRoles.userId, userId));
}

export async function getUserBusinessUnitRoles(userId: number) {
  const db = await getDb();
  return db.select().from(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.userId, userId));
}

// Re-export User type for convenience
export type { User };
