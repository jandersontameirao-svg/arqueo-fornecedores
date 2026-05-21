/**
 * Organizational Router — tRPC procedures for multi-group management
 * 
 * Provides:
 * - org.groups.list — list accessible organizational groups
 * - org.groups.get — get a single group by ID
 * - org.context — resolve the current user's organizational context
 * - org.myRoles — list all roles assigned to the current user
 * - org.assignGroupRole — assign a user to a group role (admin only)
 * - org.assignCompanyRole — assign a user to a company role (admin only)
 * - org.assignBusinessUnitRole — assign a user to a BU role (admin only)
 * - org.removeGroupRole — remove a user's group role (admin only)
 * - org.removeCompanyRole — remove a user's company role (admin only)
 * - org.removeBusinessUnitRole — remove a user's BU role (admin only)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  organizationalGroups,
  userGroupRoles,
  userCompanyRoles,
  userBusinessUnitRoles,
  companies,
  businessUnits,
} from "../drizzle/schema";
import {
  resolveOrgContext,
  canAccessGroup,
  canAdmin,
  type OrgContext,
  type GlobalRole,
} from "./orgContext";

// DB singleton
let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db!;
}

// Admin check middleware
const orgAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

// Role enum values
const groupRoleEnum = z.enum(["group_admin", "group_operator", "group_viewer"]);
const companyRoleEnum = z.enum(["company_admin", "company_operator", "company_viewer"]);
const buRoleEnum = z.enum(["bu_admin", "bu_operator", "bu_viewer"]);

export const orgRouter = router({
  // ==================== CONTEXT ====================
  context: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = await resolveOrgContext(ctx.user);
    return orgCtx;
  }),

  // ==================== MY ROLES ====================
  myRoles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const groupRoles = await getDb()
      .select()
      .from(userGroupRoles)
      .where(eq(userGroupRoles.userId, userId));
    const companyRoles = await getDb()
      .select()
      .from(userCompanyRoles)
      .where(eq(userCompanyRoles.userId, userId));
    const buRoles = await getDb()
      .select()
      .from(userBusinessUnitRoles)
      .where(eq(userBusinessUnitRoles.userId, userId));
    return { groupRoles, companyRoles, buRoles };
  }),

  // ==================== GROUPS ====================
  groups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const orgCtx = await resolveOrgContext(ctx.user);
      const allGroups = await getDb().select().from(organizationalGroups);
      // Filter to only accessible groups
      return allGroups.filter((g: { id: number }) => orgCtx.accessibleGroupIds.includes(g.id));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const orgCtx = await resolveOrgContext(ctx.user);
        if (!canAccessGroup(orgCtx, input.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
        }
        const [group] = await getDb()
          .select()
          .from(organizationalGroups)
          .where(eq(organizationalGroups.id, input.id));
        if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Grupo não encontrado" });
        
        // Also fetch companies and BUs for this group
        const groupCompanies = await getDb()
          .select()
          .from(companies)
          .where(eq(companies.organizationalGroupId, input.id));
        const groupBUs = await getDb()
          .select()
          .from(businessUnits)
          .where(eq(businessUnits.organizationalGroupId, input.id));
        
        return { ...group, companies: groupCompanies, businessUnits: groupBUs };
      }),
  }),

  // ==================== ROLE ASSIGNMENT (ADMIN ONLY) ====================
  assignGroupRole: orgAdminProcedure
    .input(z.object({
      userId: z.number(),
      organizationalGroupId: z.number(),
      role: groupRoleEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(userGroupRoles).values({
        userId: input.userId,
        organizationalGroupId: input.organizationalGroupId,
        role: input.role,
        grantedById: ctx.user.id,
      });
      return { success: true };
    }),

  assignCompanyRole: orgAdminProcedure
    .input(z.object({
      userId: z.number(),
      organizationalGroupId: z.number(),
      companyId: z.number(),
      role: companyRoleEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(userCompanyRoles).values({
        userId: input.userId,
        organizationalGroupId: input.organizationalGroupId,
        companyId: input.companyId,
        role: input.role,
        grantedById: ctx.user.id,
      });
      return { success: true };
    }),

  assignBusinessUnitRole: orgAdminProcedure
    .input(z.object({
      userId: z.number(),
      organizationalGroupId: z.number(),
      businessUnitId: z.number(),
      role: buRoleEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(userBusinessUnitRoles).values({
        userId: input.userId,
        organizationalGroupId: input.organizationalGroupId,
        businessUnitId: input.businessUnitId,
        role: input.role,
        grantedById: ctx.user.id,
      });
      return { success: true };
    }),

  removeGroupRole: orgAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(userGroupRoles).where(eq(userGroupRoles.id, input.id));
      return { success: true };
    }),

  removeCompanyRole: orgAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(userCompanyRoles).where(eq(userCompanyRoles.id, input.id));
      return { success: true };
    }),

  removeBusinessUnitRole: orgAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.id, input.id));
      return { success: true };
    }),

  // ==================== USER ROLES FOR A SPECIFIC USER (ADMIN) ====================
  getUserRoles: orgAdminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const groupRoles = await getDb()
        .select()
        .from(userGroupRoles)
        .where(eq(userGroupRoles.userId, input.userId));
      const companyRoles = await getDb()
        .select()
        .from(userCompanyRoles)
        .where(eq(userCompanyRoles.userId, input.userId));
      const buRoles = await getDb()
        .select()
        .from(userBusinessUnitRoles)
        .where(eq(userBusinessUnitRoles.userId, input.userId));
      return { groupRoles, companyRoles, buRoles };
    }),
});

export type OrgRouter = typeof orgRouter;
