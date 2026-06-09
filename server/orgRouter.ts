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
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
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
} from "./orgContext";

// Use the shared async DB connection from server/db.ts (avoids duplicate connections)
import { getDb as _getDbAsync } from "./db";
async function getDb() {
  const db = await _getDbAsync();
  if (!db) throw new Error("[orgRouter] Database not available");
  return db;
}

// Admin check middleware
const orgAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

// Role enum values matching schema
const groupRoleEnum = z.enum(["group_admin", "group_operator", "group_viewer"]);
const companyRoleEnum = z.enum(["company_admin", "company_operator", "company_viewer"]);
const buRoleEnum = z.enum(["bu_admin", "bu_operator", "bu_viewer"]);

export const orgRouter = router({
  // ==================== CONTEXT ====================
  context: protectedProcedure.query(async ({ ctx }) => {
    // IMPORTANTE: este endpoint serve o dropdown "Área de Negócio" do topo.
    // Por isso precisa retornar a lista COMPLETA de grupos acessíveis, não a
    // versão estreitada pelo activeOrgGroupId — senão o dropdown só listaria
    // o próprio grupo já selecionado e o usuário não conseguiria trocar.
    return resolveOrgContext(ctx.user, null);
  }),

  // ==================== MY ROLES ====================
  myRoles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;
    const groupRoles = await db
      .select()
      .from(userGroupRoles)
      .where(eq(userGroupRoles.userId, userId));
    const companyRoles = await db
      .select()
      .from(userCompanyRoles)
      .where(eq(userCompanyRoles.userId, userId));
    const buRoles = await db
      .select()
      .from(userBusinessUnitRoles)
      .where(eq(userBusinessUnitRoles.userId, userId));
    return { groupRoles, companyRoles, buRoles };
  }),

  // ==================== GROUPS ====================
  groups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      // Lista do dropdown — também precisa do conjunto COMPLETO de grupos.
      const orgCtx = await resolveOrgContext(ctx.user, null);
      const allGroups = await db.select().from(organizationalGroups);
      // Filter to only accessible groups
      return allGroups.filter((g: { id: number }) => orgCtx.accessibleGroupIds.includes(g.id));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        const orgCtx = await resolveOrgContext(ctx.user);
        if (!canAccessGroup(orgCtx, input.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
        }
        const [group] = await db
          .select()
          .from(organizationalGroups)
          .where(eq(organizationalGroups.id, input.id));
        if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Grupo não encontrado" });

        // Also fetch companies and BUs for this group
        const groupCompanies = await db
          .select()
          .from(companies)
          .where(eq(companies.organizationalGroupId, input.id));
        const groupBUs = await db
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
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, input.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      const db = await getDb();
      await db.insert(userGroupRoles).values({
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
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, input.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      const db = await getDb();
      await db.insert(userCompanyRoles).values({
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
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, input.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      const db = await getDb();
      await db.insert(userBusinessUnitRoles).values({
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
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [role] = await db.select().from(userGroupRoles).where(eq(userGroupRoles.id, input.id)).limit(1);
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role não encontrada" });
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, role.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      await db.delete(userGroupRoles).where(eq(userGroupRoles.id, input.id));
      return { success: true };
    }),

  removeCompanyRole: orgAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [role] = await db.select().from(userCompanyRoles).where(eq(userCompanyRoles.id, input.id)).limit(1);
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role não encontrada" });
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, role.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      await db.delete(userCompanyRoles).where(eq(userCompanyRoles.id, input.id));
      return { success: true };
    }),

  removeBusinessUnitRole: orgAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [role] = await db.select().from(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.id, input.id)).limit(1);
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role não encontrada" });
      const orgCtx = await resolveOrgContext(ctx.user, null);
      if (!canAccessGroup(orgCtx, role.organizationalGroupId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este grupo organizacional" });
      }
      await db.delete(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.id, input.id));
      return { success: true };
    }),

  // ==================== USER ROLES FOR A SPECIFIC USER (ADMIN) ====================
  getUserRoles: orgAdminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const orgCtx = await resolveOrgContext(ctx.user, null);
      const { inArray } = await import("drizzle-orm");
      const groupRoles = orgCtx.isSuperAdmin
        ? await db.select().from(userGroupRoles).where(eq(userGroupRoles.userId, input.userId))
        : await db.select().from(userGroupRoles).where(
            eq(userGroupRoles.userId, input.userId)
          ).then(rows => rows.filter((r: any) => orgCtx.accessibleGroupIds.includes(r.organizationalGroupId)));
      const companyRoles = orgCtx.isSuperAdmin
        ? await db.select().from(userCompanyRoles).where(eq(userCompanyRoles.userId, input.userId))
        : await db.select().from(userCompanyRoles).where(
            eq(userCompanyRoles.userId, input.userId)
          ).then(rows => rows.filter((r: any) => orgCtx.accessibleGroupIds.includes(r.organizationalGroupId)));
      const buRoles = orgCtx.isSuperAdmin
        ? await db.select().from(userBusinessUnitRoles).where(eq(userBusinessUnitRoles.userId, input.userId))
        : await db.select().from(userBusinessUnitRoles).where(
            eq(userBusinessUnitRoles.userId, input.userId)
          ).then(rows => rows.filter((r: any) => orgCtx.accessibleGroupIds.includes(r.organizationalGroupId)));
      return { groupRoles, companyRoles, buRoles };
    }),
});

export type OrgRouter = typeof orgRouter;
