import { eq, desc, and, or, like, gte, lte, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  suppliers, InsertSupplier, Supplier,
  supplierCategories, InsertSupplierCategory,
  supplierContacts, InsertSupplierContact,
  documents, InsertDocument,
  approvalWorkflows, InsertApprovalWorkflow,
  approvalSteps, InsertApprovalStep,
  auditLogs, InsertAuditLog,
  interactions, InsertInteraction,
  performanceEvaluations, InsertPerformanceEvaluation,
  complianceAlerts, InsertComplianceAlert,
  contracts, InsertContract,
  contractItems, InsertContractItem,
  contractTemplates, InsertContractTemplate,
  contractAmendments, InsertContractAmendment,
  financialMilestones, InsertFinancialMilestone,
  businessUnits, InsertBusinessUnit,
  companies, InsertCompany,
  supplierLinks, InsertSupplierLink,
  documentExpirationNotifications, InsertDocumentExpirationNotification,
  contractExpirationNotifications,
  contractVersions, InsertContractVersion,
  contractSigners, InsertContractSigner,
  contractClicksignEvents, InsertContractClicksignEvent,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(id: number, role: "admin" | "manager" | "reader") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function updateUserStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive }).where(eq(users.id, id));
}

// ==================== SUPPLIER CATEGORY FUNCTIONS ====================
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierCategories).orderBy(supplierCategories.name);
}

export async function createCategory(data: InsertSupplierCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierCategories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertSupplierCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierCategories).set(data).where(eq(supplierCategories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(supplierCategories).where(eq(supplierCategories.id, id));
}

// ==================== SUPPLIER FUNCTIONS ====================
export async function getAllSuppliers(filters?: {
  status?: string;
  categoryId?: number;
  criticality?: string;
  search?: string;
  companyId?: string;
  groupId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  // Monta condições base (sem companyId para poder unir com vínculos)
  const baseConditions: any[] = [];

  if (filters?.status) {
    baseConditions.push(eq(suppliers.status, filters.status as any));
  }
  if (filters?.categoryId) {
    baseConditions.push(eq(suppliers.categoryId, filters.categoryId));
  }
  if (filters?.criticality) {
    baseConditions.push(eq(suppliers.criticality, filters.criticality as any));
  }

  // Filtro de busca textual
  let searchCond: any = undefined;
  if (filters?.search) {
    const raw = filters.search.trim();
    const cleanCnpj = raw.replace(/[.\-\/]/g, '');
    const term = `%${raw}%`;
    const termClean = `%${cleanCnpj}%`;
    searchCond = or(
      like(suppliers.companyName, term),
      like(suppliers.tradeName, term),
      like(suppliers.cnpj, term),
      like(suppliers.cnpj, termClean),
      like(suppliers.email, term),
      like(suppliers.phone, term),
      like(suppliers.city, term),
      like(suppliers.state, term),
      like(suppliers.neighborhood, term),
      like(suppliers.notes, term)
    );
  }

  // SEGREGAÇÃO POR GRUPO: quando groupId fornecido, filtrar por grupo
  // SEGREGAÇÃO POR EMPRESA: quando companyId fornecido, incluir diretos + vinculados

  if (filters?.companyId) {
    // Busca fornecedores cadastrados diretamente nessa empresa
    const directConds = [...baseConditions, eq(suppliers.companyId, filters.companyId)];
    if (searchCond) directConds.push(searchCond);

    const directQuery = db.select({
      supplier: suppliers,
      category: supplierCategories,
      createdBy: users,
    })
      .from(suppliers)
      .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
      .leftJoin(users, eq(suppliers.createdById, users.id))
      .where(and(...directConds))
      .orderBy(desc(suppliers.createdAt));

    const direct = await directQuery;

    // Busca fornecedores vinculados a essa empresa (como destino)
    const linkedRows = await db.select({
      link: supplierLinks,
      supplier: suppliers,
      category: supplierCategories,
      createdBy: users,
    })
      .from(supplierLinks)
      .innerJoin(suppliers, eq(supplierLinks.supplierId, suppliers.id))
      .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
      .leftJoin(users, eq(suppliers.createdById, users.id))
      .where(and(
        eq(supplierLinks.targetCompanyId, filters.companyId),
        eq(supplierLinks.status, "active")
      ));

    // Aplica filtros de busca/status/etc nos vinculados também
    let linked = linkedRows;
    if (filters?.status) {
      linked = linked.filter(r => r.supplier.status === filters.status);
    }
    if (filters?.criticality) {
      linked = linked.filter(r => r.supplier.criticality === filters.criticality);
    }
    if (filters?.categoryId) {
      linked = linked.filter(r => r.supplier.categoryId === filters.categoryId);
    }
    if (searchCond && filters?.search) {
      const term = filters.search.trim().toLowerCase();
      linked = linked.filter(r => {
        const s = r.supplier;
        return (
          s.companyName?.toLowerCase().includes(term) ||
          s.tradeName?.toLowerCase().includes(term) ||
          s.cnpj?.replace(/[.\-\/]/g, '').includes(term.replace(/[.\-\/]/g, '')) ||
          s.email?.toLowerCase().includes(term) ||
          s.city?.toLowerCase().includes(term) ||
          s.state?.toLowerCase().includes(term)
        );
      });
    }

    // Deduplica: se fornecedor já está nos diretos, não adicionar nos vinculados
    const directIds = new Set(direct.map(r => r.supplier.id));
    const linkedUnique = linked.filter(r => !directIds.has(r.supplier.id));

    // Retorna diretos + vinculados (vinculados marcados com _isLinked)
    const linkedMapped = linkedUnique.map(r => ({
      supplier: { ...r.supplier, _isLinked: true, _linkId: r.link.id },
      category: r.category,
      createdBy: r.createdBy,
    }));

    return [...direct, ...linkedMapped];
  }

  // Sem companyId: filtrar por groupId se fornecido (segregação por grupo)
  const conditions = [...baseConditions];
  if (filters?.groupId) {
    conditions.push(eq(suppliers.groupId, filters.groupId));
  }
  if (searchCond) conditions.push(searchCond);

  let query = db.select({
    supplier: suppliers,
    category: supplierCategories,
    createdBy: users,
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
    .leftJoin(users, eq(suppliers.createdById, users.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    supplier: suppliers,
    category: supplierCategories,
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
    .where(eq(suppliers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createSupplier(data: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar duplicidade de CNPJ dentro da mesma empresa
  if (data.cnpj && data.companyId) {
    const existing = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.cnpj, data.cnpj), eq(suppliers.companyId, data.companyId)))
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Já existe um fornecedor cadastrado com este CNPJ nesta empresa.");
    }
  }

  const supplierData: InsertSupplier = {
    ...data,
    criticality: data.criticality || "medium",
    status: data.status || "pending",
  };
  const result = await db.insert(suppliers).values(supplierData);
  return result[0].insertId;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

export async function approveSupplier(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set({
    status: "approved",
    approvedAt: new Date(),
    approvedById: userId,
  }).where(eq(suppliers.id, id));
}

export async function rejectSupplier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set({ status: "rejected" }).where(eq(suppliers.id, id));
}

// ==================== SUPPLIER CONTACTS FUNCTIONS ====================
export async function getSupplierContacts(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierContacts).where(eq(supplierContacts.supplierId, supplierId));
}

export async function createSupplierContact(data: InsertSupplierContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierContacts).values(data);
  return result[0].insertId;
}

export async function updateSupplierContact(id: number, data: Partial<InsertSupplierContact>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierContacts).set(data).where(eq(supplierContacts.id, id));
}

export async function deleteSupplierContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(supplierContacts).where(eq(supplierContacts.id, id));
}

// ==================== DOCUMENT FUNCTIONS ====================
export async function getSupplierDocuments(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    document: documents,
    uploadedBy: users,
  })
    .from(documents)
    .leftJoin(users, eq(documents.uploadedById, users.id))
    .where(eq(documents.supplierId, supplierId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return result[0].insertId;
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(documents).set(data).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getExpiringDocuments(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return db.select({
    document: documents,
    supplier: suppliers,
  })
    .from(documents)
    .innerJoin(suppliers, eq(documents.supplierId, suppliers.id))
    .where(
      and(
        lte(documents.expiresAt, futureDate),
        gte(documents.expiresAt, new Date()),
        eq(documents.expirationAlertSent, false)
      )
    )
    .orderBy(documents.expiresAt);
}

export async function getAllDocuments(filters?: {
  search?: string;
  type?: string;
  expirationStatus?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.search) {
    conditions.push(like(documents.name, `%${filters.search}%`));
  }
  if (filters?.type) {
    conditions.push(eq(documents.type, filters.type as any));
  }
  if (filters?.expirationStatus) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (filters.expirationStatus === "expired") {
      conditions.push(lte(documents.expiresAt, now));
    } else if (filters.expirationStatus === "expiring") {
      conditions.push(
        and(
          gte(documents.expiresAt, now),
          lte(documents.expiresAt, thirtyDaysFromNow)
        )
      );
    } else if (filters.expirationStatus === "valid") {
      conditions.push(
        or(
          isNull(documents.expiresAt),
          gte(documents.expiresAt, now)
        )
      );
    }
  }

  let query = db.select({
    document: documents,
    supplier: suppliers,
    uploadedBy: users,
  })
    .from(documents)
    .leftJoin(suppliers, eq(documents.supplierId, suppliers.id))
    .leftJoin(users, eq(documents.uploadedById, users.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(documents.createdAt)).limit(100);
}

// ==================== APPROVAL WORKFLOW FUNCTIONS ====================
export async function getSupplierWorkflows(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(approvalWorkflows).where(eq(approvalWorkflows.supplierId, supplierId)).orderBy(desc(approvalWorkflows.createdAt));
}

export async function createWorkflow(data: InsertApprovalWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(approvalWorkflows).values(data);
  return result[0].insertId;
}

export async function updateWorkflow(id: number, data: Partial<InsertApprovalWorkflow>) {
  const db = await getDb();
  if (!db) return;
  await db.update(approvalWorkflows).set(data).where(eq(approvalWorkflows.id, id));
}

export async function getWorkflowSteps(workflowId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    step: approvalSteps,
    assignedTo: users,
  })
    .from(approvalSteps)
    .leftJoin(users, eq(approvalSteps.assignedToId, users.id))
    .where(eq(approvalSteps.workflowId, workflowId))
    .orderBy(approvalSteps.stepNumber);
}

export async function createWorkflowStep(data: InsertApprovalStep) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(approvalSteps).values(data);
  return result[0].insertId;
}

export async function updateWorkflowStep(id: number, data: Partial<InsertApprovalStep>) {
  const db = await getDb();
  if (!db) return;
  await db.update(approvalSteps).set(data).where(eq(approvalSteps.id, id));
}

export async function getPendingWorkflows(companyId?: string) {
  const db = await getDb();
  if (!db) return [];
  const statusCond = or(
    eq(approvalWorkflows.status, "pending"),
    eq(approvalWorkflows.status, "in_progress")
  );
  const whereCond = companyId
    ? and(statusCond, eq(suppliers.companyId, companyId))
    : statusCond;
  return db.select({
    workflow: approvalWorkflows,
    supplier: suppliers,
  })
    .from(approvalWorkflows)
    .innerJoin(suppliers, eq(approvalWorkflows.supplierId, suppliers.id))
    .where(whereCond)
    .orderBy(approvalWorkflows.startedAt);
}

// ==================== AUDIT LOG FUNCTIONS ====================
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(filters?: {
  entityType?: string;
  entityId?: number;
  userId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select({
    log: auditLogs,
    user: users,
  })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id));

  const conditions = [];

  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.entityId) {
    conditions.push(eq(auditLogs.entityId, filters.entityId));
  }
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(auditLogs.createdAt)).limit(filters?.limit || 100);
}

// ==================== INTERACTION FUNCTIONS ====================
export async function getSupplierInteractions(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    interaction: interactions,
    createdBy: users,
  })
    .from(interactions)
    .leftJoin(users, eq(interactions.createdById, users.id))
    .where(eq(interactions.supplierId, supplierId))
    .orderBy(desc(interactions.interactionDate));
}

export async function createInteraction(data: InsertInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interactions).values(data);
  return result[0].insertId;
}

export async function updateInteraction(id: number, data: Partial<InsertInteraction>) {
  const db = await getDb();
  if (!db) return;
  await db.update(interactions).set(data).where(eq(interactions.id, id));
}

export async function deleteInteraction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(interactions).where(eq(interactions.id, id));
}

export async function getRecentInteractions(limit: number = 50, companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    const direct = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.companyId, companyId));
    const linked = await db.select({ supplierId: supplierLinks.supplierId }).from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    const visibleIds = Array.from(ids);
    if (visibleIds.length === 0) return [];
    return db.select({
      interaction: interactions,
      supplier: suppliers,
      createdBy: users,
    })
      .from(interactions)
      .leftJoin(suppliers, eq(interactions.supplierId, suppliers.id))
      .leftJoin(users, eq(interactions.createdById, users.id))
      .where(sql`${interactions.supplierId} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(interactions.interactionDate))
      .limit(limit);
  }

  let q = db.select({
    interaction: interactions,
    supplier: suppliers,
    createdBy: users,
  })
    .from(interactions)
    .leftJoin(suppliers, eq(interactions.supplierId, suppliers.id))
    .leftJoin(users, eq(interactions.createdById, users.id));
  if (groupId) q = q.where(eq(suppliers.groupId, groupId)) as any;
  return (q as any).orderBy(desc(interactions.interactionDate)).limit(limit);
}

// ==================== PERFORMANCE EVALUATION FUNCTIONS ====================
export async function getSupplierEvaluations(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    evaluation: performanceEvaluations,
    evaluatedBy: users,
  })
    .from(performanceEvaluations)
    .leftJoin(users, eq(performanceEvaluations.evaluatedById, users.id))
    .where(eq(performanceEvaluations.supplierId, supplierId))
    .orderBy(desc(performanceEvaluations.createdAt));
}

export async function createEvaluation(data: InsertPerformanceEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performanceEvaluations).values(data);
  return result[0].insertId;
}

export async function updateEvaluation(id: number, data: Partial<InsertPerformanceEvaluation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(performanceEvaluations).set(data).where(eq(performanceEvaluations.id, id));
}

export async function getLatestEvaluations(limit: number = 10, companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    const direct = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.companyId, companyId));
    const linked = await db.select({ supplierId: supplierLinks.supplierId }).from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    const visibleIds = Array.from(ids);
    if (visibleIds.length === 0) return [];
    return db.select({
      evaluation: performanceEvaluations,
      supplier: suppliers,
    })
      .from(performanceEvaluations)
      .innerJoin(suppliers, eq(performanceEvaluations.supplierId, suppliers.id))
      .where(sql`${performanceEvaluations.supplierId} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(performanceEvaluations.createdAt))
      .limit(limit);
  }

  let q = db.select({
    evaluation: performanceEvaluations,
    supplier: suppliers,
  })
    .from(performanceEvaluations)
    .innerJoin(suppliers, eq(performanceEvaluations.supplierId, suppliers.id));
  if (groupId) q = q.where(eq(suppliers.groupId, groupId)) as any;
  return (q as any).orderBy(desc(performanceEvaluations.createdAt)).limit(limit);
}

// ==================== COMPLIANCE ALERT FUNCTIONS ====================
export async function getActiveAlerts(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    const direct = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.companyId, companyId));
    const linked = await db.select({ supplierId: supplierLinks.supplierId }).from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    const visibleIds = Array.from(ids);
    const resolvedCond = eq(complianceAlerts.isResolved, false);
    const whereCond = visibleIds.length > 0
      ? and(resolvedCond, sql`${complianceAlerts.supplierId} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})`)
      : and(resolvedCond, sql`1=0`);
    return db.select({
      alert: complianceAlerts,
      supplier: suppliers,
      document: documents,
    })
      .from(complianceAlerts)
      .leftJoin(suppliers, eq(complianceAlerts.supplierId, suppliers.id))
      .leftJoin(documents, eq(complianceAlerts.documentId, documents.id))
      .where(whereCond)
      .orderBy(desc(complianceAlerts.severity), complianceAlerts.dueDate);
  }

  const resolvedCond = eq(complianceAlerts.isResolved, false);
  let whereCond: any = resolvedCond;
  if (groupId) whereCond = and(resolvedCond, eq(suppliers.groupId, groupId));
  return db.select({
    alert: complianceAlerts,
    supplier: suppliers,
    document: documents,
  })
    .from(complianceAlerts)
    .leftJoin(suppliers, eq(complianceAlerts.supplierId, suppliers.id))
    .leftJoin(documents, eq(complianceAlerts.documentId, documents.id))
    .where(whereCond)
    .orderBy(desc(complianceAlerts.severity), complianceAlerts.dueDate);
}

export async function createAlert(data: InsertComplianceAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(complianceAlerts).values(data);
  return result[0].insertId;
}

export async function resolveAlert(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(complianceAlerts).set({
    isResolved: true,
    resolvedAt: new Date(),
    resolvedById: userId,
  }).where(eq(complianceAlerts.id, id));
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return null;

  // Helper: retorna IDs de todos os fornecedores visíveis para a empresa (diretos + vinculados)
  async function getVisibleSupplierIds(): Promise<number[] | null> {
    if (!companyId) return null; // null = sem filtro de empresa (usa groupId ou sem filtro)
    const direct = await db!.select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.companyId, companyId));
    const linked = await db!.select({ supplierId: supplierLinks.supplierId })
      .from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    return Array.from(ids);
  }

  const visibleIds = await getVisibleSupplierIds();

  // Condição de escopo: por IDs visíveis (empresa), por grupo, ou sem filtro
  const scopeFilter = visibleIds !== null
    ? (visibleIds.length > 0 ? sql`${suppliers.id} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})` : sql`1=0`)
    : groupId
    ? eq(suppliers.groupId, groupId)
    : undefined;

  const [
    totalSuppliers,
    pendingSuppliers,
    approvedSuppliers,
    totalDocuments,
    expiringDocs,
    activeAlerts,
  ] = await Promise.all([
    scopeFilter
      ? db.select({ count: sql<number>`count(*)` }).from(suppliers).where(scopeFilter)
      : db.select({ count: sql<number>`count(*)` }).from(suppliers),
    scopeFilter
      ? db.select({ count: sql<number>`count(*)` }).from(suppliers).where(and(scopeFilter, eq(suppliers.status, "pending")))
      : db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.status, "pending")),
    scopeFilter
      ? db.select({ count: sql<number>`count(*)` }).from(suppliers).where(and(scopeFilter, eq(suppliers.status, "approved")))
      : db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.status, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(documents),
    getExpiringDocuments(30),
    db.select({ count: sql<number>`count(*)` }).from(complianceAlerts).where(eq(complianceAlerts.isResolved, false)),
  ]);
  return {
    totalSuppliers: totalSuppliers[0]?.count || 0,
    pendingSuppliers: pendingSuppliers[0]?.count || 0,
    approvedSuppliers: approvedSuppliers[0]?.count || 0,
    totalDocuments: totalDocuments[0]?.count || 0,
    expiringDocuments: expiringDocs.length,
    activeAlerts: activeAlerts[0]?.count || 0,
  };
}

export async function getSuppliersByCategory(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    // Coleta IDs visíveis (diretos + vinculados)
    const direct = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.companyId, companyId));
    const linked = await db.select({ supplierId: supplierLinks.supplierId }).from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    const visibleIds = Array.from(ids);
    if (visibleIds.length === 0) return [];
    return db.select({
      categoryId: suppliers.categoryId,
      categoryName: supplierCategories.name,
      categoryColor: supplierCategories.color,
      count: sql<number>`count(*)`,
    })
      .from(suppliers)
      .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
      .where(sql`${suppliers.id} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(suppliers.categoryId, supplierCategories.name, supplierCategories.color);
  }

  let q = db.select({
    categoryId: suppliers.categoryId,
    categoryName: supplierCategories.name,
    categoryColor: supplierCategories.color,
    count: sql<number>`count(*)`,
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id));
  if (groupId) q = q.where(eq(suppliers.groupId, groupId)) as any;
  return (q as any).groupBy(suppliers.categoryId, supplierCategories.name, supplierCategories.color);
}
export async function getSuppliersByCriticality(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    const direct = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.companyId, companyId));
    const linked = await db.select({ supplierId: supplierLinks.supplierId }).from(supplierLinks)
      .where(and(eq(supplierLinks.targetCompanyId, companyId), eq(supplierLinks.status, "active")));
    const ids = new Set<number>();
    direct.forEach(r => ids.add(r.id));
    linked.forEach(r => ids.add(r.supplierId));
    const visibleIds = Array.from(ids);
    if (visibleIds.length === 0) return [];
    return db.select({
      criticality: suppliers.criticality,
      count: sql<number>`count(*)`,
    })
      .from(suppliers)
      .where(sql`${suppliers.id} IN (${sql.join(visibleIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(suppliers.criticality);
  }

  let q = db.select({
    criticality: suppliers.criticality,
    count: sql<number>`count(*)`,
  })
    .from(suppliers);
  if (groupId) q = q.where(eq(suppliers.groupId, groupId)) as any;
  return (q as any).groupBy(suppliers.criticality);
}

// ==================== CONTRACT FUNCTIONS ====================
export async function getContractsBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.supplierId, supplierId)).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return rows[0] || null;
}

export async function createContract(data: InsertContract): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contracts).values(data);
  return (result[0] as any).insertId;
}

export async function updateContract(id: number, data: Partial<InsertContract>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

export async function deleteContract(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contracts).where(eq(contracts.id, id));
}

export async function getContractItems(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractItems).where(eq(contractItems.contractId, contractId));
}

export async function createContractItem(data: InsertContractItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractItems).values(data);
  return (result[0] as any).insertId;
}

export async function deleteContractItems(contractId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contractItems).where(eq(contractItems.contractId, contractId));
}

export async function getContractTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractTemplates).where(eq(contractTemplates.isActive, true)).orderBy(contractTemplates.name);
}

export async function createContractTemplate(data: InsertContractTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractTemplates).values(data);
  return (result[0] as any).insertId;
}

export async function updateContractTemplate(id: number, data: Partial<InsertContractTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractTemplates).set(data).where(eq(contractTemplates.id, id));
}

export async function deleteContractTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractTemplates).set({ isActive: false }).where(eq(contractTemplates.id, id));
}

export async function getAllContractTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractTemplates).orderBy(contractTemplates.name);
}

// ==================== AMENDMENT FUNCTIONS ====================
export async function getAmendmentsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractAmendments)
    .where(eq(contractAmendments.contractId, contractId))
    .orderBy(desc(contractAmendments.createdAt));
}

export async function getAmendmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contractAmendments).where(eq(contractAmendments.id, id)).limit(1);
  return rows[0] || null;
}

export async function createAmendment(data: InsertContractAmendment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractAmendments).values(data);
  return (result[0] as any).insertId;
}

export async function updateAmendment(id: number, data: Partial<InsertContractAmendment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractAmendments).set(data).where(eq(contractAmendments.id, id));
}

export async function deleteAmendment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contractAmendments).where(eq(contractAmendments.id, id));
}

// ==================== FINANCIAL MILESTONE FUNCTIONS ====================
export async function getMilestonesByContract(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  // Auto-update overdue status
  const now = new Date();
  await db.update(financialMilestones)
    .set({ status: "overdue" })
    .where(
      and(
        eq(financialMilestones.contractId, contractId),
        eq(financialMilestones.status, "pending"),
        lte(financialMilestones.dueDate, now)
      )
    );
  return db.select().from(financialMilestones)
    .where(eq(financialMilestones.contractId, contractId))
    .orderBy(financialMilestones.dueDate);
}

export async function getMilestonesByAmendment(amendmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financialMilestones)
    .where(eq(financialMilestones.amendmentId, amendmentId))
    .orderBy(financialMilestones.dueDate);
}

export async function createMilestone(data: InsertFinancialMilestone): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(financialMilestones).values(data);
  return (result[0] as any).insertId;
}

export async function updateMilestone(id: number, data: Partial<InsertFinancialMilestone>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(financialMilestones).set(data).where(eq(financialMilestones.id, id));
}

export async function deleteMilestone(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(financialMilestones).where(eq(financialMilestones.id, id));
}

// ==================== BUSINESS UNITS ====================
export async function listBusinessUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessUnits).orderBy(businessUnits.name);
}

export async function getBusinessUnitById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(businessUnits).where(eq(businessUnits.id, id));
  return rows[0] || null;
}

export async function createBusinessUnit(data: Omit<InsertBusinessUnit, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(businessUnits).values(data);
  return { id: result.insertId, ...data };
}

export async function updateBusinessUnit(id: number, data: Partial<InsertBusinessUnit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(businessUnits).set(data).where(eq(businessUnits.id, id));
  return getBusinessUnitById(id);
}

export async function deleteBusinessUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(businessUnits).where(eq(businessUnits.id, id));
}

// ==================== COMPANIES ====================
export async function listCompaniesByUnit(businessUnitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.businessUnitId, businessUnitId)).orderBy(companies.legalName);
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companies).where(eq(companies.id, id));
  return rows[0] || null;
}

export async function createCompany(data: Omit<InsertCompany, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(companies).values(data);
  return { id: result.insertId, ...data };
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set(data).where(eq(companies.id, id));
  return getCompanyById(id);
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(companies).where(eq(companies.id, id));
}

export async function listAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(companies.legalName);
}

// ==================== SUPPLIER LINKS (VÍNCULOS) ====================

/**
 * Lista todos os vínculos de um fornecedor específico
 */
export async function getSupplierLinks(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierLinks)
    .where(eq(supplierLinks.supplierId, supplierId))
    .orderBy(desc(supplierLinks.createdAt));
}

/**
 * Lista todos os vínculos ativos de uma empresa (como destino)
 */
export async function getLinksByTargetCompany(targetCompanyId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    link: supplierLinks,
    supplier: suppliers,
  })
    .from(supplierLinks)
    .innerJoin(suppliers, eq(supplierLinks.supplierId, suppliers.id))
    .where(and(
      eq(supplierLinks.targetCompanyId, targetCompanyId),
      eq(supplierLinks.status, "active")
    ))
    .orderBy(desc(supplierLinks.createdAt));
}

/**
 * Verifica se um vínculo já existe entre fornecedor e empresa destino
 */
export async function checkSupplierLinkExists(supplierId: number, targetCompanyId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: supplierLinks.id })
    .from(supplierLinks)
    .where(and(
      eq(supplierLinks.supplierId, supplierId),
      eq(supplierLinks.targetCompanyId, targetCompanyId),
      eq(supplierLinks.status, "active")
    ))
    .limit(1);
  return rows.length > 0;
}

/**
 * Cria um novo vínculo entre fornecedor e empresa destino
 */
export async function createSupplierLink(data: InsertSupplierLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierLinks).values(data);
  return result[0].insertId;
}

/**
 * Desativa um vínculo (soft delete)
 */
export async function deactivateSupplierLink(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierLinks).set({ status: "inactive" }).where(eq(supplierLinks.id, id));
}

/**
 * Lista fornecedores de uma empresa (cadastrados diretamente + vinculados)
 */
export async function getSuppliersByCompanyWithLinks(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  // Fornecedores cadastrados diretamente nessa empresa
  const direct = await db.select().from(suppliers)
    .where(eq(suppliers.companyId, companyId))
    .orderBy(desc(suppliers.createdAt));

  // Fornecedores vinculados a essa empresa (como destino)
  const linked = await db.select({
    link: supplierLinks,
    supplier: suppliers,
  })
    .from(supplierLinks)
    .innerJoin(suppliers, eq(supplierLinks.supplierId, suppliers.id))
    .where(and(
      eq(supplierLinks.targetCompanyId, companyId),
      eq(supplierLinks.status, "active")
    ));

  return {
    direct,
    linked: linked.map(r => ({ ...r.supplier, _linkId: r.link.id, _isLinked: true })),
  };
}

// ==================== DOCUMENT EXPIRATION NOTIFICATIONS ====================

/**
 * Busca documentos que vencem em exatamente N dias e ainda não receberam notificação
 */
export async function getDocumentsExpiringInDaysWithoutNotification(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setDate(startOfDay.getDate() + daysAhead);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Busca documentos que vencem no intervalo do dia alvo
  const docs = await db.select({
    document: documents,
    supplier: suppliers,
  })
    .from(documents)
    .innerJoin(suppliers, eq(documents.supplierId, suppliers.id))
    .where(
      and(
        gte(documents.expiresAt, startOfDay),
        lte(documents.expiresAt, endOfDay)
      )
    );

  if (docs.length === 0) return [];

  // Filtra os que já receberam notificação para esse número de dias
  const docIds = docs.map(d => d.document.id);
  const alreadySent = await db.select({ documentId: documentExpirationNotifications.documentId })
    .from(documentExpirationNotifications)
    .where(
      and(
        eq(documentExpirationNotifications.daysBeforeExpiration, daysAhead),
        sql`${documentExpirationNotifications.documentId} IN (${docIds.join(",")})`
      )
    );

  const sentIds = new Set(alreadySent.map(n => n.documentId));
  return docs.filter(d => !sentIds.has(d.document.id));
}

/**
 * Registra que uma notificação foi enviada para um documento
 */
export async function recordDocumentExpirationNotification(data: InsertDocumentExpirationNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(documentExpirationNotifications).values(data);
}

// ==================== EVALUATION DELETE ====================

export async function deleteEvaluation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(performanceEvaluations).where(eq(performanceEvaluations.id, id));
}

// ==================== CONTRACT EFFECTIVE END DATE ====================

/**
 * Retorna o aditivo mais recente válido (status=active, newEndDate!=null) de um contrato.
 * "Mais recente" = maior newEndDate entre os aditivos ativos com nova vigência.
 * Se houver empate, usa createdAt mais recente como desempate.
 */
export async function getLatestValidAmendmentWithEndDate(contractId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select()
    .from(contractAmendments)
    .where(
      and(
        eq(contractAmendments.contractId, contractId),
        eq(contractAmendments.status, "active"),
        sql`${contractAmendments.newEndDate} IS NOT NULL`
      )
    )
    .orderBy(desc(contractAmendments.newEndDate), desc(contractAmendments.createdAt))
    .limit(1);
  return rows[0] || null;
}

/**
 * Calcula a vigência efetiva de um contrato:
 * - Se houver aditivo ativo com newEndDate, retorna { effectiveEndDate, source: 'amendment', amendmentId, amendmentTitle }
 * - Caso contrário, retorna { effectiveEndDate: contract.endDate, source: 'original', amendmentId: null }
 */
export async function getContractEffectiveEndDate(contractId: number): Promise<{
  effectiveEndDate: Date | null;
  source: "original" | "amendment";
  amendmentId: number | null;
  amendmentTitle: string | null;
}> {
  const contract = await getContractById(contractId);
  const latestAmendment = await getLatestValidAmendmentWithEndDate(contractId);

  if (latestAmendment && latestAmendment.newEndDate) {
    return {
      effectiveEndDate: latestAmendment.newEndDate,
      source: "amendment",
      amendmentId: latestAmendment.id,
      amendmentTitle: latestAmendment.title,
    };
  }

  return {
    effectiveEndDate: contract?.endDate ?? null,
    source: "original",
    amendmentId: null,
    amendmentTitle: null,
  };
}

/**
 * Retorna contratos com vigência efetiva calculada.
 * Usado em listagens, dashboard e alertas para garantir consistência.
 */
export async function getContractsBySupplierWithEffectiveEndDate(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  const contractList = await db.select().from(contracts)
    .where(eq(contracts.supplierId, supplierId))
    .orderBy(desc(contracts.createdAt));

  // Para cada contrato, calcular vigência efetiva
  return Promise.all(contractList.map(async (contract) => {
    const effective = await getContractEffectiveEndDate(contract.id);
    return { contract, ...effective };
  }));
}

// ==================== CONTRACT EXPIRATION NOTIFICATIONS ====================

/**
 * Busca contratos cuja vigência efetiva vence em exatamente N dias
 * e ainda não receberam notificação para esse número de dias.
 */
export async function getContractsExpiringInDaysWithoutNotification(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setDate(startOfDay.getDate() + daysAhead);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Busca todos os contratos ativos
  const allContracts = await db.select().from(contracts)
    .where(eq(contracts.status, "active"));

  if (allContracts.length === 0) return [];

  // Para cada contrato, calcula vigência efetiva e filtra os que vencem no intervalo
  const expiringContracts = [];
  for (const contract of allContracts) {
    const effective = await getContractEffectiveEndDate(contract.id);
    if (!effective.effectiveEndDate) continue;
    const expDate = new Date(effective.effectiveEndDate);
    if (expDate >= startOfDay && expDate <= endOfDay) {
      expiringContracts.push({ contract, ...effective });
    }
  }

  if (expiringContracts.length === 0) return [];

  // Filtra os que já receberam notificação
  const contractIds = expiringContracts.map(c => c.contract.id);
  const alreadySent = await db.select({ contractId: contractExpirationNotifications.contractId })
    .from(contractExpirationNotifications)
    .where(
      and(
        eq(contractExpirationNotifications.daysBeforeExpiration, daysAhead),
        sql`${contractExpirationNotifications.contractId} IN (${contractIds.join(",")})`
      )
    );

  const sentIds = new Set(alreadySent.map(n => n.contractId));
  return expiringContracts.filter(c => !sentIds.has(c.contract.id));
}

/**
 * Registra que uma notificação de vencimento de contrato foi enviada
 */
export async function recordContractExpirationNotification(data: {
  contractId: number;
  supplierId: number;
  daysBeforeExpiration: number;
  effectiveDateSource: "original" | "amendment";
  amendmentId: number | null;
  notificationTitle: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(contractExpirationNotifications).values({
    contractId: data.contractId,
    supplierId: data.supplierId,
    daysBeforeExpiration: data.daysBeforeExpiration,
    effectiveDateSource: data.effectiveDateSource,
    amendmentId: data.amendmentId ?? undefined,
    notificationTitle: data.notificationTitle,
  });
}

// ==================== CONTRACT VERSIONS ====================

export async function getContractVersions(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber));
}

export async function createContractVersion(data: InsertContractVersion): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractVersions).values(data);
  return (result[0] as any).insertId;
}

export async function getLatestVersionNumber(contractId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ maxVersion: sql<number>`COALESCE(MAX(${contractVersions.versionNumber}), 0)` })
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId));
  return rows[0]?.maxVersion || 0;
}

// ==================== CONTRACT SIGNERS ====================

export async function getContractSigners(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractSigners)
    .where(eq(contractSigners.contractId, contractId))
    .orderBy(contractSigners.signOrder);
}

export async function createContractSigner(data: InsertContractSigner): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractSigners).values(data);
  return (result[0] as any).insertId;
}

export async function updateContractSigner(id: number, data: Partial<InsertContractSigner>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractSigners).set(data).where(eq(contractSigners.id, id));
}

export async function deleteContractSigner(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contractSigners).where(eq(contractSigners.id, id));
}

// ==================== CONTRACT CLICKSIGN EVENTS ====================

export async function getContractClicksignEvents(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractClicksignEvents)
    .where(eq(contractClicksignEvents.contractId, contractId))
    .orderBy(desc(contractClicksignEvents.createdAt));
}

export async function createContractClicksignEvent(data: InsertContractClicksignEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractClicksignEvents).values(data);
  return (result[0] as any).insertId;
}

// ==================== TEMPLATE PLACEHOLDER PARSER ====================

/**
 * Extrai placeholders de um template de contrato.
 * Placeholders são marcados como {{nome_do_campo}} no conteúdo.
 * Retorna array de nomes de placeholders únicos.
 */
export function extractPlaceholders(templateContent: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const placeholders = new Set<string>();
  let match;
  while ((match = regex.exec(templateContent)) !== null) {
    placeholders.add(match[1].trim());
  }
  return Array.from(placeholders);
}

/**
 * Preenche placeholders em um template com dados fornecidos.
 * Retorna o conteúdo com placeholders substituídos e lista de não preenchidos.
 */
export function fillPlaceholders(
  templateContent: string,
  data: Record<string, string>
): { filledContent: string; unfilledPlaceholders: string[] } {
  const unfilled: string[] = [];
  const filledContent = templateContent.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (data[trimmedKey] !== undefined && data[trimmedKey] !== "") {
      return data[trimmedKey];
    }
    unfilled.push(trimmedKey);
    return match; // Mantém o placeholder original se não preenchido
  });
  return { filledContent, unfilledPlaceholders: unfilled };
}

/**
 * Mapeia dados do sistema (fornecedor, contrato, empresa) para placeholders conhecidos.
 * Retorna um dicionário de placeholder -> valor.
 */
export function mapSystemDataToPlaceholders(data: {
  supplier?: any;
  contract?: any;
  company?: any;
  contacts?: any[];
}): Record<string, string> {
  const map: Record<string, string> = {};
  
  if (data.supplier) {
    const s = data.supplier;
    map["razao_social_contratado"] = s.companyName || "";
    map["nome_fantasia_contratado"] = s.tradeName || s.companyName || "";
    map["cnpj_contratado"] = s.cnpj || "";
    map["endereco_contratado"] = [s.street, s.number, s.complement, s.neighborhood, s.city, s.state, s.zipCode].filter(Boolean).join(", ");
    map["email_contratado"] = s.email || "";
    map["telefone_contratado"] = s.phone || "";
    map["inscricao_estadual_contratado"] = s.stateRegistration || "Isento";
    map["inscricao_municipal_contratado"] = s.municipalRegistration || "";
    map["banco_contratado"] = s.bankName || "";
    map["agencia_contratado"] = s.bankAgency || "";
    map["conta_contratado"] = s.bankAccount || "";
    map["pix_contratado"] = s.pixKey || "";
  }
  
  if (data.contract) {
    const c = data.contract;
    map["numero_contrato"] = c.number || "";
    map["titulo_contrato"] = c.title || "";
    map["objeto_contrato"] = c.object || "";
    map["valor_total"] = c.totalValue || "";
    map["condicoes_pagamento"] = c.paymentTerms || "";
    map["data_inicio"] = c.startDate ? new Date(c.startDate).toLocaleDateString("pt-BR") : "";
    map["data_fim"] = c.endDate ? new Date(c.endDate).toLocaleDateString("pt-BR") : "";
    map["nome_contratante"] = c.contractorName || "";
    map["cnpj_contratante"] = c.contractorCnpj || "";
    map["representante_contratante"] = c.contractorRepresentative || "";
  }
  
  if (data.company) {
    const co = data.company;
    map["empresa_nome"] = co.legalName || co.tradeName || "";
    map["empresa_cnpj"] = co.cnpj || "";
    map["empresa_endereco"] = co.address || "";
  }
  
  if (data.contacts && data.contacts.length > 0) {
    const primary = data.contacts.find((c: any) => c.isPrimary) || data.contacts[0];
    map["contato_principal_nome"] = primary.name || "";
    map["contato_principal_email"] = primary.email || "";
    map["contato_principal_telefone"] = primary.phone || "";
    map["contato_principal_cargo"] = primary.position || "";
  }
  
  // Data atual
  const now = new Date();
  map["data_atual"] = now.toLocaleDateString("pt-BR");
  map["data_extenso"] = now.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  
  return map;
}

// ==================== CLICKSIGN LOOKUP ====================
export async function getContractByClicksignEnvelopeId(envelopeId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contracts).where(eq(contracts.clicksignEnvelopeId, envelopeId)).limit(1);
  return rows[0] || null;
}
