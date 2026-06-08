/**
 * Tenant guard — assertions that throw FORBIDDEN/NOT_FOUND when a user tries
 * to access a resource (supplier, document, contract, file) that does not belong
 * to a group/company/BU they have access to.
 *
 * Use these at the top of any `getById` / `update` / `delete` procedure that
 * accepts an entity id from the client. Without them, the procedure trusts
 * whatever id the client sent and leaks data across tenants (IDOR).
 */
import { TRPCError } from "@trpc/server";
import { eq, or, inArray } from "drizzle-orm";
import { OrgContext, canAccessGroup, canAccessCompany, canAccessBusinessUnit, resolveOrgContext } from "../orgContext";
import * as db from "../db";
import {
  suppliers,
  supplierCompanyLinks,
  documents,
  contracts,
  contractAmendments,
  interactions,
  evaluations,
  workflows,
  workflowSteps,
  supplierDocumentLinks,
  extractionRuns,
} from "../../drizzle/schema";

export type AuthedUser = { id: number; email: string | null; role: string; [k: string]: any };

async function getOrgCtxFor(user: AuthedUser): Promise<OrgContext> {
  return resolveOrgContext(user as any);
}

function forbidden(message = "Você não tem acesso a este recurso"): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

function notFound(message = "Recurso não encontrado"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

/**
 * Assert that the user can access the supplier identified by `supplierId`.
 * A supplier is accessible if:
 *   - the user is super-admin, OR
 *   - the supplier's `organizationalGroupId` is in the user's accessible groups, OR
 *   - the supplier has an ACTIVE link in supplier_company_links pointing to a company
 *     the user can access.
 *
 * Returns the supplier record (so the caller doesn't need to re-fetch).
 */
export async function assertSupplierAccess(user: AuthedUser, supplierId: number) {
  const supplier = await db.getSupplierById(supplierId);
  if (!supplier) notFound("Fornecedor não encontrado");

  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return supplier;

  if (supplier.organizationalGroupId && canAccessGroup(ctx, supplier.organizationalGroupId)) {
    return supplier;
  }

  // Fall back to canonical visibility via supplier_company_links
  const dbConn = await db.getDb();
  if (!dbConn) forbidden();
  const links = await dbConn
    .select({ companyId: supplierCompanyLinks.companyId })
    .from(supplierCompanyLinks)
    .where(eq(supplierCompanyLinks.supplierId, supplierId));
  const hasAccessibleLink = links.some((l: { companyId: number | null }) =>
    l.companyId != null && canAccessCompany(ctx, l.companyId)
  );
  if (!hasAccessibleLink) forbidden();
  return supplier;
}

/**
 * Assert access to a document by id. Returns the document if accessible.
 */
export async function assertDocumentAccess(user: AuthedUser, documentId: number) {
  const doc = await db.getDocumentById(documentId);
  if (!doc) notFound("Documento não encontrado");

  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return doc;

  if (doc.organizationalGroupId && canAccessGroup(ctx, doc.organizationalGroupId)) {
    return doc;
  }
  // Fall back to supplier scope
  await assertSupplierAccess(user, doc.supplierId);
  return doc;
}

/**
 * Assert access to a contract by id. Returns the contract if accessible.
 */
export async function assertContractAccess(user: AuthedUser, contractId: number) {
  const contract = await db.getContractById(contractId);
  if (!contract) notFound("Contrato não encontrado");

  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return contract;

  if (contract.organizationalGroupId && canAccessGroup(ctx, contract.organizationalGroupId)) {
    return contract;
  }
  await assertSupplierAccess(user, contract.supplierId);
  return contract;
}

/**
 * Assert access to a contract amendment by id.
 */
export async function assertAmendmentAccess(user: AuthedUser, amendmentId: number) {
  const amendment = await db.getAmendmentById(amendmentId);
  if (!amendment) notFound("Aditivo não encontrado");
  await assertContractAccess(user, amendment.contractId);
  return amendment;
}

/**
 * Assert access to a specific organizational group.
 */
export async function assertGroupAccess(user: AuthedUser, groupId: number) {
  const ctx = await getOrgCtxFor(user);
  if (!canAccessGroup(ctx, groupId)) forbidden();
  return ctx;
}

/**
 * Assert access to a specific company.
 */
export async function assertCompanyAccess(user: AuthedUser, companyId: number) {
  const ctx = await getOrgCtxFor(user);
  if (!canAccessCompany(ctx, companyId)) forbidden();
  return ctx;
}

/**
 * Assert access to a specific business unit.
 */
export async function assertBusinessUnitAccess(user: AuthedUser, businessUnitId: number) {
  const ctx = await getOrgCtxFor(user);
  if (!canAccessBusinessUnit(ctx, businessUnitId)) forbidden();
  return ctx;
}

/**
 * Assert access to an interaction by id. We look up the supplier and delegate.
 */
export async function assertInteractionAccess(user: AuthedUser, interactionId: number) {
  const dbConn = await db.getDb();
  if (!dbConn) forbidden();
  const [row] = await dbConn
    .select({ supplierId: interactions.supplierId, organizationalGroupId: interactions.organizationalGroupId })
    .from(interactions)
    .where(eq(interactions.id, interactionId))
    .limit(1);
  if (!row) notFound("Interação não encontrada");
  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return row;
  if (row.organizationalGroupId && canAccessGroup(ctx, row.organizationalGroupId)) return row;
  await assertSupplierAccess(user, row.supplierId);
  return row;
}

/**
 * Assert access to an evaluation by id.
 */
export async function assertEvaluationAccess(user: AuthedUser, evaluationId: number) {
  const dbConn = await db.getDb();
  if (!dbConn) forbidden();
  const [row] = await dbConn
    .select({ supplierId: evaluations.supplierId, organizationalGroupId: evaluations.organizationalGroupId })
    .from(evaluations)
    .where(eq(evaluations.id, evaluationId))
    .limit(1);
  if (!row) notFound("Avaliação não encontrada");
  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return row;
  if (row.organizationalGroupId && canAccessGroup(ctx, row.organizationalGroupId)) return row;
  await assertSupplierAccess(user, row.supplierId);
  return row;
}

/**
 * Validate that a fileKey belongs to an entity the user can access.
 * Used by `storage.getSignedUrl` to prevent direct enumeration of R2 keys.
 */
export async function assertFileKeyAccess(user: AuthedUser, fileKey: string) {
  const ctx = await getOrgCtxFor(user);
  if (ctx.isSuperAdmin) return;

  const dbConn = await db.getDb();
  if (!dbConn) forbidden();

  // Look up the fileKey across all tables that store one.
  const [doc] = await dbConn
    .select({ supplierId: documents.supplierId, organizationalGroupId: documents.organizationalGroupId })
    .from(documents)
    .where(eq(documents.fileKey, fileKey))
    .limit(1);
  if (doc) {
    if (doc.organizationalGroupId && canAccessGroup(ctx, doc.organizationalGroupId)) return;
    await assertSupplierAccess(user, doc.supplierId);
    return;
  }

  const [contract] = await dbConn
    .select({ supplierId: contracts.supplierId, organizationalGroupId: contracts.organizationalGroupId })
    .from(contracts)
    .where(eq(contracts.fileKey, fileKey))
    .limit(1);
  if (contract) {
    if (contract.organizationalGroupId && canAccessGroup(ctx, contract.organizationalGroupId)) return;
    await assertSupplierAccess(user, contract.supplierId);
    return;
  }

  const [supplierDoc] = await dbConn
    .select({ supplierId: supplierDocumentLinks.supplierId })
    .from(supplierDocumentLinks)
    .where(eq(supplierDocumentLinks.fileKey, fileKey))
    .limit(1);
  if (supplierDoc) {
    await assertSupplierAccess(user, supplierDoc.supplierId);
    return;
  }

  const [amendment] = await dbConn
    .select({ contractId: contractAmendments.contractId })
    .from(contractAmendments)
    .where(eq(contractAmendments.fileKey, fileKey))
    .limit(1);
  if (amendment) {
    await assertContractAccess(user, amendment.contractId);
    return;
  }

  // Unknown fileKey or not in any tracked table.
  forbidden("Arquivo não encontrado ou acesso negado");
}

/**
 * Returns an org context, useful when you want to filter a list by scope
 * but you've already validated nothing.
 */
export async function getOrgContext(user: AuthedUser): Promise<OrgContext> {
  return getOrgCtxFor(user);
}

/**
 * Convenience: validate a `{ companyId?, groupId? }` input bag against the user's scope.
 * `companyId` may be a slug or a numeric-as-string. Slugs are not validated here
 * (legacy path) — only numeric ids are checked. `groupId` is always numeric.
 *
 * Throws FORBIDDEN if either id is set but the user can't access it.
 * Returns the resolved OrgContext for reuse.
 */
export async function assertScopeInput(
  user: AuthedUser,
  input: { companyId?: string | null; groupId?: number | null } | null | undefined
): Promise<OrgContext> {
  const ctx = await getOrgCtxFor(user);
  if (!input) return ctx;
  if (typeof input.groupId === "number" && !canAccessGroup(ctx, input.groupId)) {
    forbidden("Sem acesso a este grupo");
  }
  if (input.companyId) {
    const n = Number(input.companyId);
    if (Number.isFinite(n) && !canAccessCompany(ctx, n)) {
      forbidden("Sem acesso a esta empresa");
    }
  }
  return ctx;
}
