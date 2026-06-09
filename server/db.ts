import { eq, desc, asc, and, or, like, gte, lte, sql, isNull, inArray } from "drizzle-orm";

/**
 * Filtro de escopo organizacional que INCLUI registros com `organizationalGroupId IS NULL`.
 *
 * Por que: muitos registros legados foram criados antes do campo `organizationalGroupId`
 * existir e ficaram com NULL. O Bloco H aplicou `inArray(col, [grupoAtivo])` que exclui
 * NULLs — resultado: usuário ativo no "Grupo Arqueo Brasil" deixou de ver fornecedores
 * (e documentos, contratos) que existiam antes da migração.
 *
 * Comportamento desta função:
 *   - orgGroupIds === undefined → sem filtro (caller decide)
 *   - orgGroupIds === []       → sem acesso a nenhum grupo, retorna `sql\`1=0\``
 *   - orgGroupIds === [N, ...] → `(col IN (N,...) OR col IS NULL)`
 *
 * AVISO de segurança: aceitar NULL significa que registros órfãos aparecem em
 * QUALQUER grupo selecionado. Hoje isso é seguro porque só o "Grupo Arqueo Brasil"
 * está populado. Quando outros grupos forem populados, rodar backfill:
 *   UPDATE suppliers SET organizationalGroupId = 1 WHERE organizationalGroupId IS NULL;
 *   (e equivalentes em documents, contracts, etc.)
 */
function orgScopeOrNull(col: any, orgGroupIds: number[] | undefined) {
  if (orgGroupIds === undefined) return undefined;
  if (orgGroupIds.length === 0) return sql`1=0`;
  return or(inArray(col, orgGroupIds), isNull(col));
}
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
  supplierCompanyLinks, InsertSupplierCompanyLink,
  documentExpirationNotifications, InsertDocumentExpirationNotification,
  contractExpirationNotifications,
  contractVersions, InsertContractVersion,
  contractSigners, InsertContractSigner,
  contractClicksignEvents, InsertContractClicksignEvent,
  templateFields, InsertTemplateField,
  extractionRuns, InsertExtractionRun,
  extractedFields, InsertExtractedField,
  supplierDocumentLinks, InsertSupplierDocumentLink,
  userBusinessUnits, InsertUserBusinessUnit,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { isSuperAdminEmail } from '../shared/superadmins';

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

    // LISTA BRANCA DE SUPERADMINS: apenas os emails autorizados podem ter globalRole='superadmin_global'.
    // Se o email está na lista branca → forçar superadmin_global.
    // Se o email NÃO está na lista branca → bloquear qualquer tentativa de atribuir superadmin_global.
    const emailForCheck = user.email ?? values.email ?? null;
    if (isSuperAdminEmail(emailForCheck)) {
      values.globalRole = 'superadmin_global';
      updateSet.globalRole = 'superadmin_global';
    } else if (user.globalRole === 'superadmin_global') {
      // Tentativa de atribuir superadmin_global a email não autorizado — bloquear silenciosamente
      console.warn(`[Security] Blocked superadmin_global assignment for non-whitelisted email: ${emailForCheck}`);
      // Não atribui globalRole — mantém o valor atual ou null
    } else if (user.globalRole !== undefined) {
      values.globalRole = user.globalRole;
      updateSet.globalRole = user.globalRole;
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

// Gera um openId interno para usuários criados manualmente (sem OAuth)
export function generateInternalOpenId(): string {
  return `internal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createUser(data: {
  name: string;
  email: string;
  role: "admin" | "manager" | "reader";
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verificar se e-mail já existe
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) throw new Error("Já existe um usuário com este e-mail");
  const openId = generateInternalOpenId();
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: data.role,
    isActive: data.isActive ?? true,
    loginMethod: "manual",
    lastSignedIn: new Date(),
  });
  return (result[0] as any).insertId as number;
}

export async function updateUser(id: number, data: {
  name?: string;
  email?: string;
  role?: "admin" | "manager" | "reader";
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verificar duplicidade de e-mail (excluindo o próprio usuário)
  if (data.email) {
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error("Já existe outro usuário com este e-mail");
    }
  }
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.email !== undefined) updateSet.email = data.email;
  if (data.role !== undefined) updateSet.role = data.role;
  if (data.isActive !== undefined) updateSet.isActive = data.isActive;
  if (Object.keys(updateSet).length === 0) return;
  await db.update(users).set(updateSet).where(eq(users.id, id));
}

// Soft delete: desativa o usuário sem remover do banco
export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isActive: false }).where(eq(users.id, id));
}

/**
 * Hard delete que PRESERVA os dados de negócio criados pelo usuário.
 * Antes de remover o usuário, nula todas as colunas de autoria que apontam para
 * ele (createdById, approvedById, uploadedById, etc.) — assim os fornecedores,
 * contratos e documentos permanecem, apenas perdem o vínculo de "criado por".
 * Os vínculos de ACESSO do próprio usuário (roles/áreas) são removidos, pois não
 * fazem sentido sem o usuário. Cada statement é tolerante a coluna/tabela ausente.
 */
export async function hardDeleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const uid = Number(id);
  if (!Number.isFinite(uid)) throw new Error("ID de usuário inválido");

  // Descobre DINAMICAMENTE todas as colunas (FK) que apontam para users.id.
  // Isso garante que nenhuma referência seja esquecida — qualquer coluna que
  // bloquearia o DELETE é tratada aqui, independente de quantas tabelas existam.
  let fkCols: Array<{ tbl: string; col: string }> = [];
  try {
    const res: any = await db.execute(sql`
      SELECT TABLE_NAME AS tbl, COLUMN_NAME AS col
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME = 'users'
        AND REFERENCED_COLUMN_NAME = 'id'
        AND TABLE_SCHEMA = DATABASE()
    `);
    const rows = Array.isArray(res) ? res[0] : res;
    fkCols = (rows as any[]).map((r) => ({ tbl: r.tbl, col: r.col }));
  } catch (e) {
    console.warn("[hardDeleteUser] Falha ao descobrir FKs, usando lista estática:", e);
  }

  // Fallback estático caso a introspecção não retorne nada (ex.: FKs não declaradas).
  if (fkCols.length === 0) {
    fkCols = [
      { tbl: "suppliers", col: "createdById" }, { tbl: "suppliers", col: "approvedById" },
      { tbl: "supplier_company_links", col: "internalResponsibleId" }, { tbl: "supplier_company_links", col: "homologatedById" }, { tbl: "supplier_company_links", col: "linkedById" },
      { tbl: "supplier_links", col: "createdById" },
      { tbl: "documents", col: "uploadedById" },
      { tbl: "approval_workflows", col: "createdById" }, { tbl: "approval_steps", col: "assignedToId" },
      { tbl: "audit_logs", col: "userId" },
      { tbl: "interactions", col: "createdById" },
      { tbl: "performance_evaluations", col: "evaluatedById" },
      { tbl: "compliance_alerts", col: "resolvedById" },
      { tbl: "contracts", col: "createdById" },
      { tbl: "contract_amendments", col: "createdById" },
      { tbl: "financial_milestones", col: "createdById" },
      { tbl: "contract_versions", col: "createdById" },
      { tbl: "extraction_runs", col: "createdById" }, { tbl: "extraction_runs", col: "reviewedById" },
      { tbl: "supplier_document_links", col: "linkedById" },
      { tbl: "contract_templates", col: "createdById" },
      { tbl: "organizational_groups", col: "createdById" },
      { tbl: "companies", col: "createdById" }, { tbl: "business_units", col: "createdById" },
      { tbl: "user_group_roles", col: "userId" }, { tbl: "user_group_roles", col: "grantedById" },
      { tbl: "user_company_roles", col: "userId" }, { tbl: "user_company_roles", col: "grantedById" },
      { tbl: "user_business_unit_roles", col: "userId" }, { tbl: "user_business_unit_roles", col: "grantedById" },
      { tbl: "user_business_units", col: "userId" },
    ];
  }

  // Para cada referência: tenta NULL (preserva o registro). Se a coluna for
  // NOT NULL (ex.: userId de uma tabela de vínculo), o NULL falha e então a
  // linha é REMOVIDA — esses vínculos não fazem sentido sem o usuário.
  for (const { tbl, col } of fkCols) {
    try {
      await db.execute(sql.raw(`UPDATE \`${tbl}\` SET \`${col}\` = NULL WHERE \`${col}\` = ${uid}`));
    } catch {
      try {
        await db.execute(sql.raw(`DELETE FROM \`${tbl}\` WHERE \`${col}\` = ${uid}`));
      } catch { /* tabela/coluna ausente — ignora */ }
    }
  }

  // Por fim, remove o usuário
  await db.delete(users).where(eq(users.id, uid));
}

// ==================== SUPPLIER CATEGORY FUNCTIONS =====================
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
  /** IDs dos grupos organizacionais acessíveis (multi-grupo). Se fornecido e vazio, retorna [] */
  orgGroupIds?: number[];
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
    // Fonte canônica: supplierCompanyLinks
    // Converte companyId para número (pode vir como string do frontend)
    const companyIdNum = typeof filters.companyId === 'string' ? parseInt(filters.companyId, 10) : filters.companyId;
    if (isNaN(companyIdNum)) return [];

    // Condições no vínculo
    const linkConditions: any[] = [
      eq(supplierCompanyLinks.companyId, companyIdNum),
      eq(supplierCompanyLinks.status, "active"),
    ];

    // Filtros opcionais no vínculo
    if (filters?.categoryId) {
      linkConditions.push(eq(supplierCompanyLinks.categoryId, filters.categoryId));
    }
    if (filters?.criticality) {
      linkConditions.push(eq(supplierCompanyLinks.criticality, filters.criticality as any));
    }

    // Condições no fornecedor
    const supplierConditions: any[] = [];
    if (filters?.status) {
      supplierConditions.push(eq(suppliers.status, filters.status as any));
    }
    if (searchCond) supplierConditions.push(searchCond);

    const allConditions = [
      and(...linkConditions),
      ...(supplierConditions.length > 0 ? [and(...supplierConditions)] : []),
    ];

    const rows = await db.select({
      supplier: suppliers,
      category: supplierCategories,
      createdBy: users,
      link: supplierCompanyLinks,
    })
      .from(supplierCompanyLinks)
      .innerJoin(suppliers, eq(supplierCompanyLinks.supplierId, suppliers.id))
      .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
      .leftJoin(users, eq(suppliers.createdById, users.id))
      .where(and(...allConditions))
      .orderBy(desc(suppliers.createdAt));

    // Deduplica por supplierId (caso haja múltiplos vínculos para a mesma empresa)
    const seen = new Set<number>();
    return rows
      .filter(r => {
        if (seen.has(r.supplier.id)) return false;
        seen.add(r.supplier.id);
        return true;
      })
      .map(r => ({
        supplier: r.supplier,
        category: r.category,
        createdBy: r.createdBy,
        link: r.link,
      }));
  }

  // Sem companyId: se groupId (businessUnitId) fornecido, usar supplierCompanyLinks como fonte canônica
  if (filters?.groupId) {
    const buId = filters.groupId;

    // Condições no vínculo
    const linkConds: any[] = [
      eq(supplierCompanyLinks.businessUnitId, buId),
      eq(supplierCompanyLinks.status, "active"),
    ];
    if (filters?.categoryId) {
      linkConds.push(eq(supplierCompanyLinks.categoryId, filters.categoryId));
    }
    if (filters?.criticality) {
      linkConds.push(eq(supplierCompanyLinks.criticality, filters.criticality as any));
    }

    // Condições no fornecedor
    const supplierConds: any[] = [];
    if (filters?.status) {
      supplierConds.push(eq(suppliers.status, filters.status as any));
    }
    if (searchCond) supplierConds.push(searchCond);
    // NOTA: Não aplicar filtro por suppliers.organizationalGroupId neste caminho.
    // O isolamento de escopo já é garantido pelo supplierCompanyLinks.businessUnitId.
    // Fornecedores legados com organizationalGroupId NULL mas com vínculo ativo em
    // supplierCompanyLinks devem aparecer normalmente na listagem por área.

    const allConds = [
      and(...linkConds),
      ...(supplierConds.length > 0 ? [and(...supplierConds)] : []),
    ];

    const rows = await db.select({
      supplier: suppliers,
      category: supplierCategories,
      createdBy: users,
      link: supplierCompanyLinks,
    })
      .from(supplierCompanyLinks)
      .innerJoin(suppliers, eq(supplierCompanyLinks.supplierId, suppliers.id))
      .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
      .leftJoin(users, eq(suppliers.createdById, users.id))
      .where(and(...allConds))
      .orderBy(desc(suppliers.createdAt));

    // Deduplica por supplierId (fornecedor vinculado a múltiplas empresas da mesma área)
    const seen = new Set<number>();
    return rows
      .filter(r => {
        if (seen.has(r.supplier.id)) return false;
        seen.add(r.supplier.id);
        return true;
      })
      .map(r => ({
        supplier: r.supplier,
        category: r.category,
        createdBy: r.createdBy,
        link: r.link,
      }));
  }

  // Sem companyId e sem groupId: listagem global (superadmin ou fallback legado)
  const conditions = [...baseConditions];
  // ISOLAMENTO MULTI-GRUPO: se orgGroupIds fornecido, filtrar por organizationalGroupId
  if (filters?.orgGroupIds !== undefined) {
    if (filters.orgGroupIds.length === 0) return []; // sem acesso a nenhum grupo
    // Inclui registros legados com organizationalGroupId IS NULL (pré-migração).
    conditions.push(orgScopeOrNull(suppliers.organizationalGroupId, filters.orgGroupIds)!);
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
  if (!db) return null;

  const result = await db.select({
    supplier: suppliers,
    category: supplierCategories,
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
    .where(eq(suppliers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Mapa nome-do-estado → sigla UF (a coluna suppliers.state é varchar(2)).
// A extração por IA às vezes retorna o nome completo ("Minas Gerais"), que
// estoura a coluna e derruba o INSERT. Normalizamos para a sigla antes de gravar.
const UF_BY_NAME: Record<string, string> = {
  "acre": "AC", "alagoas": "AL", "amapa": "AP", "amazonas": "AM", "bahia": "BA",
  "ceara": "CE", "distrito federal": "DF", "espirito santo": "ES", "goias": "GO",
  "maranhao": "MA", "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG",
  "para": "PA", "paraiba": "PB", "parana": "PR", "pernambuco": "PE", "piaui": "PI",
  "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS",
  "rondonia": "RO", "roraima": "RR", "santa catarina": "SC", "sao paulo": "SP",
  "sergipe": "SE", "tocantins": "TO",
};
function normalizeUF(state: string | null | undefined): string | null | undefined {
  if (state == null) return state;
  const raw = String(state).trim();
  if (!raw) return raw;
  if (raw.length <= 2) return raw.toUpperCase();
  const key = raw.toLowerCase().normalize("NFD").split("")
    .filter((c) => { const code = c.charCodeAt(0); return code < 0x300 || code > 0x36f; })
    .join("");
  if (UF_BY_NAME[key]) return UF_BY_NAME[key];
  // Rede de segurança: nunca estoura varchar(2). Se for nome desconhecido, trunca.
  return raw.slice(0, 2).toUpperCase();
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
    state: normalizeUF(data.state) as any,
    criticality: data.criticality || "medium",
    status: data.status || "pending",
  };
  const result = await db.insert(suppliers).values(supplierData);
  return result[0].insertId;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) return;
  const normalized = data.state !== undefined ? { ...data, state: normalizeUF(data.state) as any } : data;
  await db.update(suppliers).set(normalized).where(eq(suppliers.id, id));
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
export async function getSupplierContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(supplierContacts).where(eq(supplierContacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

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

/**
 * Retorna documentos que vencem dentro de `daysAhead` dias (janela de alerta ativo).
 * Padrão: 15 dias — janela crítica de alerta ativo.
 * Use daysAhead=365 para a janela preventiva (sem alerta crítico).
 * Documentos já vencidos não são incluídos aqui (use getExpiredDocuments).
 */
export async function getExpiringDocuments(daysAhead: number = 15, opts?: { orgGroupIds?: number[] }) {
  const db = await getDb();
  if (!db) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const conds: any[] = [
    lte(documents.expiresAt, futureDate),
    gte(documents.expiresAt, new Date()),
    or(eq(documents.expirationAlertSent, false), isNull(documents.expirationAlertSent)),
  ];
  // Filtro de escopo organizacional. Sem este, notifications e relatorios vazam
  // documentos de outros tenants.
  if (opts?.orgGroupIds !== undefined) {
    if (opts.orgGroupIds.length === 0) return [];
    conds.push(orgScopeOrNull(documents.organizationalGroupId, opts.orgGroupIds)!);
  }

  return db.select({
    document: documents,
    supplier: suppliers,
  })
    .from(documents)
    .innerJoin(suppliers, eq(documents.supplierId, suppliers.id))
    .where(and(...conds))
    .orderBy(documents.expiresAt);
}

export async function getAllDocuments(filters?: {
  search?: string;
  type?: string;
  expirationStatus?: string;
  /** IDs dos grupos organizacionais acessíveis (multi-grupo). Se fornecido e vazio, retorna [] */
  orgGroupIds?: number[];
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

  // ISOLAMENTO MULTI-GRUPO: se orgGroupIds fornecido, filtrar por organizationalGroupId
  if (filters?.orgGroupIds !== undefined) {
    if (filters.orgGroupIds.length === 0) return []; // sem acesso a nenhum grupo
    conditions.push(orgScopeOrNull(documents.organizationalGroupId, filters.orgGroupIds)!);
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

// =============================================================================
// SSOT: helper único para resolver "quais fornecedores devem aparecer nesta empresa/BU"
// -----------------------------------------------------------------------------
// Fonte canônica = supplier_company_links com status='active'. Substitui o padrão
// legado (suppliers.companyId + supplier_links tabela) que ainda existia em 6
// pontos do código.
// Retorno:
//   - null  → sem filtro por escopo (caller decide se aplica algum fallback)
//   - []    → escopo solicitado existe mas não há fornecedores → caller deve devolver vazio
//   - num[] → IDs visíveis no escopo
// =============================================================================
export async function getVisibleSupplierIdsByScope(companyId?: string, groupId?: number): Promise<number[] | null> {
  if (!companyId && !groupId) return null;
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    const companyIdNum = Number(companyId);
    if (!Number.isFinite(companyIdNum)) return [];
    const rows = await db
      .select({ supplierId: supplierCompanyLinks.supplierId })
      .from(supplierCompanyLinks)
      .where(and(
        eq(supplierCompanyLinks.companyId, companyIdNum),
        eq(supplierCompanyLinks.status, "active"),
      ));
    return Array.from(new Set(rows.map((r: { supplierId: number }) => r.supplierId)));
  }

  // groupId aqui representa businessUnitId (legado de naming) — escopo por área.
  const rows = await db
    .select({ supplierId: supplierCompanyLinks.supplierId })
    .from(supplierCompanyLinks)
    .where(and(
      eq(supplierCompanyLinks.businessUnitId, groupId!),
      eq(supplierCompanyLinks.status, "active"),
    ));
  return Array.from(new Set(rows.map((r: { supplierId: number }) => r.supplierId)));
}

export async function getPendingWorkflows(companyId?: string) {
  const db = await getDb();
  if (!db) return [];
  const statusCond = or(
    eq(approvalWorkflows.status, "pending"),
    eq(approvalWorkflows.status, "in_progress")
  );
  // SSOT via supplier_company_links — substitui filtro legado por suppliers.companyId.
  const visibleIds = await getVisibleSupplierIdsByScope(companyId, undefined);
  let whereCond: any = statusCond;
  if (visibleIds !== null) {
    if (visibleIds.length === 0) return [];
    whereCond = and(statusCond, inArray(approvalWorkflows.supplierId, visibleIds));
  }
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

/**
 * createScopedAuditLog — wrapper that includes organizational scope + before/after data.
 * Use for new audit entries that need organizational isolation.
 */
export async function createScopedAuditLog(
  data: InsertAuditLog & {
    organizationalGroupId?: number | null;
    companyId?: number | null;
    businessUnitId?: number | null;
    beforeData?: unknown;
    afterData?: unknown;
    userAgent?: string | null;
    ipAddress?: string | null;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    entityType: data.entityType,
    entityId: data.entityId,
    action: data.action,
    changes: data.changes ?? null,
    userId: data.userId ?? null,
    userEmail: data.userEmail ?? null,
    organizationalGroupId: data.organizationalGroupId ?? null,
    companyId: data.companyId ?? null,
    businessUnitId: data.businessUnitId ?? null,
    beforeData: data.beforeData ?? null,
    afterData: data.afterData ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
  });
}

export async function getAuditLogs(filters?: {
  entityType?: string;
  entityId?: number;
  userId?: number;
  limit?: number;
  organizationalGroupId?: number;
  companyId?: number;
  businessUnitId?: number;
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
  // Filtros de escopo organizacional
  if (filters?.organizationalGroupId) {
    conditions.push(eq(auditLogs.organizationalGroupId, filters.organizationalGroupId));
  }
  if (filters?.companyId) {
    conditions.push(eq(auditLogs.companyId, filters.companyId));
  }
  if (filters?.businessUnitId) {
    conditions.push(eq(auditLogs.businessUnitId, filters.businessUnitId));
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
  // SSOT: resolve via supplier_company_links (substitui suppliers.companyId + supplierLinks legado).
  const visibleIds = await getVisibleSupplierIdsByScope(companyId, groupId);

  let q = db.select({
    interaction: interactions,
    supplier: suppliers,
    createdBy: users,
  })
    .from(interactions)
    .leftJoin(suppliers, eq(interactions.supplierId, suppliers.id))
    .leftJoin(users, eq(interactions.createdById, users.id));

  if (visibleIds !== null) {
    if (visibleIds.length === 0) return [];
    q = q.where(inArray(interactions.supplierId, visibleIds)) as any;
  }
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
  // SSOT: supplier_company_links.
  const visibleIds = await getVisibleSupplierIdsByScope(companyId, groupId);

  let q = db.select({
    evaluation: performanceEvaluations,
    supplier: suppliers,
  })
    .from(performanceEvaluations)
    .innerJoin(suppliers, eq(performanceEvaluations.supplierId, suppliers.id));

  if (visibleIds !== null) {
    if (visibleIds.length === 0) return [];
    q = q.where(inArray(performanceEvaluations.supplierId, visibleIds)) as any;
  }
  return (q as any).orderBy(desc(performanceEvaluations.createdAt)).limit(limit);
}

// ==================== COMPLIANCE ALERT FUNCTIONS ====================
/**
 * Retorna alertas ativos.
 * Para alertas do tipo "expiration": somente exibe se dueDate é nulo (sem data),
 * já vencido (dueDate < agora) ou dentro da janela crítica de 15 dias.
 * Alertas de outros tipos (missing_document, compliance_issue, review_needed) são sempre exibidos.
 */
export async function getActiveAlerts(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Janela crítica: alertas de expiração só aparecem se dueDate é nulo, já vencido ou ≤15 dias
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  const expirationWindowCond = sql`(
    ${complianceAlerts.alertType} != 'expiration'
    OR ${complianceAlerts.dueDate} IS NULL
    OR ${complianceAlerts.dueDate} <= ${fifteenDaysFromNow}
  )`;
  const resolvedCond = eq(complianceAlerts.isResolved, false);

  // SSOT: supplier_company_links.
  const visibleIds = await getVisibleSupplierIdsByScope(companyId, groupId);
  let whereCond: any = and(resolvedCond, expirationWindowCond);
  if (visibleIds !== null) {
    if (visibleIds.length === 0) return [];
    whereCond = and(resolvedCond, expirationWindowCond, inArray(complianceAlerts.supplierId, visibleIds));
  }
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
export async function getDashboardStats(companyId?: string, groupId?: number, opts?: { orgGroupIds?: number[] }) {
  const db = await getDb();
  if (!db) return null;

  // Camada 1 (organizationalGroup): se o usuário sinalizou um grupo ativo via
  // header `x-active-org-group-id`, o router passa orgGroupIds restrito a esse
  // único grupo. Sem isso, dashboard global de um usuário multi-grupo
  // somaria fornecedores de todos os grupos acessíveis.
  let orgScopeFilter: any = undefined;
  if (opts?.orgGroupIds !== undefined) {
    if (opts.orgGroupIds.length === 0) {
      return {
        totalSuppliers: 0, pendingSuppliers: 0, approvedSuppliers: 0,
        totalDocuments: 0, expiringDocuments: 0, activeAlerts: 0,
      };
    }
    orgScopeFilter = orgScopeOrNull(suppliers.organizationalGroupId, opts.orgGroupIds);
  }

  // Camada 2 (companyId/businessUnit): SSOT supplier_company_links.
  const visibleIds = await getVisibleSupplierIdsByScope(companyId, groupId);
  const companyScopeFilter = visibleIds !== null
    ? (visibleIds.length > 0 ? inArray(suppliers.id, visibleIds) : sql`1=0`)
    : undefined;

  // Combinar: ambas as camadas se aplicáveis.
  const scopeFilter = orgScopeFilter && companyScopeFilter
    ? and(orgScopeFilter, companyScopeFilter)
    : (orgScopeFilter || companyScopeFilter);

  // Janela crítica: alertas de expiração só aparecem se dueDate é nulo, já vencido ou ≤15 dias
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  const expirationWindowCond = sql`(
    ${complianceAlerts.alertType} != 'expiration'
    OR ${complianceAlerts.dueDate} IS NULL
    OR ${complianceAlerts.dueDate} <= ${fifteenDaysFromNow}
  )`;

  // totalDocuments respeita scope (sem isso, total da Home diverge da lista).
  // Aplica camada orgGroup tambem (documents tem organizationalGroupId proprio).
  const docOrgFilter = orgScopeOrNull(documents.organizationalGroupId, opts?.orgGroupIds);
  const docCompanyFilter = visibleIds !== null
    ? (visibleIds.length > 0 ? inArray(documents.supplierId, visibleIds) : sql`1=0`)
    : undefined;
  const docFilter = docOrgFilter && docCompanyFilter
    ? and(docOrgFilter, docCompanyFilter)
    : (docOrgFilter || docCompanyFilter);
  const docCountQuery = docFilter
    ? db.select({ count: sql<number>`count(*)` }).from(documents).where(docFilter)
    : db.select({ count: sql<number>`count(*)` }).from(documents);

  const [
    totalSuppliers,
    pendingSuppliers,
    approvedSuppliers,
    totalDocuments,
    expiringDocsAll,
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
    docCountQuery,
    getExpiringDocuments(15, opts?.orgGroupIds !== undefined ? { orgGroupIds: opts.orgGroupIds } : undefined),
    scopeFilter
      ? db.select({ count: sql<number>`count(*)` }).from(complianceAlerts)
          .innerJoin(suppliers, eq(complianceAlerts.supplierId, suppliers.id))
          .where(and(scopeFilter, eq(complianceAlerts.isResolved, false), expirationWindowCond))
      : db.select({ count: sql<number>`count(*)` }).from(complianceAlerts).where(and(eq(complianceAlerts.isResolved, false), expirationWindowCond)),
  ]);

  // expiringDocuments filtrado por scope. Faz pos-filtro em memoria pq a query
  // ja retorna o supplierId. Para volumes pequenos (~dezenas) e aceitavel; se
  // crescer, mover filtro para a query via orgGroupIds.
  const expiringDocs = visibleIds !== null
    ? expiringDocsAll.filter((d: any) => visibleIds.includes(d.document.supplierId))
    : expiringDocsAll;

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
    // Fonte canônica: supplierCompanyLinks
    const companyIdNum = parseInt(companyId, 10);
    if (isNaN(companyIdNum)) return [];
    return db.select({
      categoryId: supplierCompanyLinks.categoryId,
      categoryName: supplierCategories.name,
      categoryColor: supplierCategories.color,
      count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})`,
    })
      .from(supplierCompanyLinks)
      .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
      .where(and(
        eq(supplierCompanyLinks.companyId, companyIdNum),
        eq(supplierCompanyLinks.status, "active")
      ))
      .groupBy(supplierCompanyLinks.categoryId, supplierCategories.name, supplierCategories.color);
  }

  if (groupId) {
    // Fonte canônica: supplierCompanyLinks por businessUnitId
    return db.select({
      categoryId: supplierCompanyLinks.categoryId,
      categoryName: supplierCategories.name,
      categoryColor: supplierCategories.color,
      count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})`,
    })
      .from(supplierCompanyLinks)
      .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
      .where(and(
        eq(supplierCompanyLinks.businessUnitId, groupId),
        eq(supplierCompanyLinks.status, "active")
      ))
      .groupBy(supplierCompanyLinks.categoryId, supplierCategories.name, supplierCategories.color);
  }

  // Global (superadmin)
  let q = db.select({
    categoryId: suppliers.categoryId,
    categoryName: supplierCategories.name,
    categoryColor: supplierCategories.color,
    count: sql<number>`count(*)`,
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id));
  return (q as any).groupBy(suppliers.categoryId, supplierCategories.name, supplierCategories.color);
}
export async function getSuppliersByCriticality(companyId?: string, groupId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    // Fonte canônica: supplierCompanyLinks
    const companyIdNum = parseInt(companyId, 10);
    if (isNaN(companyIdNum)) return [];
    return db.select({
      criticality: supplierCompanyLinks.criticality,
      count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})`,
    })
      .from(supplierCompanyLinks)
      .where(and(
        eq(supplierCompanyLinks.companyId, companyIdNum),
        eq(supplierCompanyLinks.status, "active")
      ))
      .groupBy(supplierCompanyLinks.criticality);
  }

  if (groupId) {
    // Fonte canônica: supplierCompanyLinks por businessUnitId
    return db.select({
      criticality: supplierCompanyLinks.criticality,
      count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})`,
    })
      .from(supplierCompanyLinks)
      .where(and(
        eq(supplierCompanyLinks.businessUnitId, groupId),
        eq(supplierCompanyLinks.status, "active")
      ))
      .groupBy(supplierCompanyLinks.criticality);
  }

  // Global (superadmin)
  return db.select({
    criticality: suppliers.criticality,
    count: sql<number>`count(*)`,
  })
    .from(suppliers)
    .groupBy(suppliers.criticality);
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

export async function getContractWithDetails(id: number) {
  const contract = await getContractById(id);
  if (!contract) return null;
  const items = await getContractItems(id);
  return { contract, items };
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
export async function getMilestoneById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(financialMilestones).where(eq(financialMilestones.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

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

export async function getBusinessUnitIdByCompanyId(companyId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ businessUnitId: companies.businessUnitId }).from(companies).where(eq(companies.id, companyId)).limit(1);
  return rows[0]?.businessUnitId ?? null;
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

// ==================== USER ↔ BUSINESS UNIT ACCESS ====================

export async function getUserBusinessUnitIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ businessUnitId: userBusinessUnits.businessUnitId })
    .from(userBusinessUnits)
    .where(eq(userBusinessUnits.userId, userId));
  return rows.map(r => r.businessUnitId);
}

export async function getUserBusinessUnitLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(userBusinessUnits)
    .where(eq(userBusinessUnits.userId, userId));
}

export async function assignUserToBusinessUnit(userId: number, businessUnitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Idempotent: check if already exists
  const existing = await db.select()
    .from(userBusinessUnits)
    .where(and(eq(userBusinessUnits.userId, userId), eq(userBusinessUnits.businessUnitId, businessUnitId)));
  if (existing.length > 0) return existing[0];
  const [result] = await db.insert(userBusinessUnits).values({ userId, businessUnitId });
  return { id: result.insertId, userId, businessUnitId };
}

export async function removeUserFromBusinessUnit(userId: number, businessUnitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userBusinessUnits)
    .where(and(eq(userBusinessUnits.userId, userId), eq(userBusinessUnits.businessUnitId, businessUnitId)));
}

export async function listBusinessUnitsForUser(userId: number, role: string) {
  const db = await getDb();
  if (!db) return [];
  // Admin sees everything
  if (role === "admin") {
    return db.select().from(businessUnits).orderBy(businessUnits.name);
  }
  // Manager/reader sees only assigned units
  const allowedIds = await getUserBusinessUnitIds(userId);
  if (allowedIds.length === 0) return [];
  return db.select().from(businessUnits)
    .where(inArray(businessUnits.id, allowedIds))
    .orderBy(businessUnits.name);
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
  const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
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
        inArray(documentExpirationNotifications.documentId, docIds)
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
export async function getContractsBySupplierWithEffectiveEndDate(supplierId: number, companySlug?: string) {
  const db = await getDb();
  if (!db) return [];

  // Filtro de segregação por empresa (regra estrita):
  // - Se companySlug fornecido: retorna APENAS contratos da empresa OU companyScope=all_group
  //   Contratos sem slug (NULL) NÃO aparecem em nenhuma empresa
  // - Se não fornecido: retorna todos (sem contexto de empresa, ex: visões globais)
  let whereClause: any;
  if (companySlug) {
    whereClause = and(
      eq(contracts.supplierId, supplierId),
      or(
        eq(contracts.contractCompanySlug, companySlug),
        eq(contracts.companyScope, "all_group")
      )
    );
  } else {
    whereClause = eq(contracts.supplierId, supplierId);
  }

  const contractList = await db.select().from(contracts)
    .where(whereClause)
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
        inArray(contractExpirationNotifications.contractId, contractIds)
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

export async function getContractSignerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contractSigners).where(eq(contractSigners.id, id)).limit(1);
  return rows[0] || null;
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


// ==================== SUPPLIER COMPANY LINKS (VÍNCULOS) ====================

export async function getSupplierCompanyLinks(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    link: supplierCompanyLinks,
    company: companies,
    businessUnit: businessUnits,
    category: supplierCategories,
    responsible: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(supplierCompanyLinks)
    .leftJoin(companies, eq(supplierCompanyLinks.companyId, companies.id))
    .leftJoin(businessUnits, eq(supplierCompanyLinks.businessUnitId, businessUnits.id))
    .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
    .leftJoin(users, eq(supplierCompanyLinks.internalResponsibleId, users.id))
    .where(eq(supplierCompanyLinks.supplierId, supplierId))
    .orderBy(desc(supplierCompanyLinks.createdAt));
}

export async function getSuppliersByCompanyLink(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    link: supplierCompanyLinks,
    supplier: suppliers,
    category: supplierCategories,
  })
    .from(supplierCompanyLinks)
    .innerJoin(suppliers, eq(supplierCompanyLinks.supplierId, suppliers.id))
    .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
    .where(and(
      eq(supplierCompanyLinks.companyId, companyId),
      eq(supplierCompanyLinks.status, "active")
    ))
    .orderBy(suppliers.companyName);
}

export async function getSuppliersByBusinessUnit(businessUnitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    link: supplierCompanyLinks,
    supplier: suppliers,
    company: companies,
    category: supplierCategories,
  })
    .from(supplierCompanyLinks)
    .innerJoin(suppliers, eq(supplierCompanyLinks.supplierId, suppliers.id))
    .leftJoin(companies, eq(supplierCompanyLinks.companyId, companies.id))
    .leftJoin(supplierCategories, eq(supplierCompanyLinks.categoryId, supplierCategories.id))
    .where(and(
      eq(supplierCompanyLinks.businessUnitId, businessUnitId),
      eq(supplierCompanyLinks.status, "active")
    ))
    .orderBy(suppliers.companyName);
}

export async function createSupplierCompanyLink(data: InsertSupplierCompanyLink): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierCompanyLinks).values(data);
  return Number(result[0].insertId);
}

export async function getSupplierCompanyLinkById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(supplierCompanyLinks).where(eq(supplierCompanyLinks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSupplierCompanyLink(id: number, data: Partial<InsertSupplierCompanyLink>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierCompanyLinks).set(data).where(eq(supplierCompanyLinks.id, id));
}

export async function deleteSupplierCompanyLink(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierCompanyLinks).set({ status: "inactive" }).where(eq(supplierCompanyLinks.id, id));
}

export async function checkSupplierCompanyLinkExists(supplierId: number, companyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: supplierCompanyLinks.id })
    .from(supplierCompanyLinks)
    .where(and(
      eq(supplierCompanyLinks.supplierId, supplierId),
      eq(supplierCompanyLinks.companyId, companyId),
      eq(supplierCompanyLinks.status, "active")
    ))
    .limit(1);
  return rows.length > 0;
}

// ==================== BASE GERAL — BUSCA POR CNPJ ====================

export async function findSupplierByCnpj(cnpj: string, opts?: { orgGroupIds?: number[] }) {
  const db = await getDb();
  if (!db) return null;
  const sanitized = cnpj.replace(/\D/g, "");
  const conds = [eq(suppliers.cnpj, sanitized)];
  if (opts?.orgGroupIds !== undefined) {
    if (opts.orgGroupIds.length === 0) return null;
    conds.push(orgScopeOrNull(suppliers.organizationalGroupId, opts.orgGroupIds)!);
  }
  const rows = await db.select().from(suppliers).where(and(...conds)).limit(1);
  return rows[0] || null;
}

export async function getAllSuppliersBaseGeral(opts?: { orgGroupIds?: number[] }) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({
    supplier: suppliers,
    category: {
      id: supplierCategories.id,
      name: supplierCategories.name,
      color: supplierCategories.color,
    },
  })
    .from(suppliers)
    .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id));
  // Restringe a base geral ao escopo organizacional do chamador. Sem este filtro,
  // qualquer usuário autenticado lê PII (CNPJ, dados bancários) de todos os tenants.
  if (opts?.orgGroupIds !== undefined) {
    if (opts.orgGroupIds.length === 0) return [];
    return query.where(orgScopeOrNull(suppliers.organizationalGroupId, opts.orgGroupIds)!).orderBy(suppliers.companyName);
  }
  return query.orderBy(suppliers.companyName);
}

// ==================== BUSCA GLOBAL ====================

export async function globalSearch(query: string, limit = 20, opts?: { orgGroupIds?: number[] }) {
  const db = await getDb();
  if (!db) return { suppliers: [], documents: [], contracts: [], companies: [] };

  const searchTerm = `%${query}%`;
  const scopedGroupIds = opts?.orgGroupIds;
  // Filtro de escopo: se nenhum grupo acessível, devolve vazio para todas as entidades.
  if (scopedGroupIds !== undefined && scopedGroupIds.length === 0) {
    return { suppliers: [], documents: [], contracts: [], companies: [] };
  }
  const supplierGroupCond = orgScopeOrNull(suppliers.organizationalGroupId, scopedGroupIds);
  const documentGroupCond = orgScopeOrNull(documents.organizationalGroupId, scopedGroupIds);
  const contractGroupCond = orgScopeOrNull(contracts.organizationalGroupId, scopedGroupIds);
  const companyGroupCond = orgScopeOrNull(companies.organizationalGroupId, scopedGroupIds);

  const [supplierResults, documentResults, contractResults, companyResults] = await Promise.all([
    db.select({
      id: suppliers.id,
      companyName: suppliers.companyName,
      tradeName: suppliers.tradeName,
      cnpj: suppliers.cnpj,
      email: suppliers.email,
      status: suppliers.status,
    })
      .from(suppliers)
      .where(and(
        or(
          like(suppliers.companyName, searchTerm),
          like(suppliers.tradeName, searchTerm),
          like(suppliers.cnpj, searchTerm),
          like(suppliers.email, searchTerm),
        ),
        ...(supplierGroupCond ? [supplierGroupCond] : []),
      ))
      .limit(limit),

    db.select({
      id: documents.id,
      name: documents.name,
      type: documents.type,
      fileName: documents.fileName,
      supplierId: documents.supplierId,
    })
      .from(documents)
      .where(and(
        or(
          like(documents.name, searchTerm),
          like(documents.fileName, searchTerm),
        ),
        ...(documentGroupCond ? [documentGroupCond] : []),
      ))
      .limit(limit),

    db.select({
      id: contracts.id,
      title: contracts.title,
      number: contracts.number,
      status: contracts.status,
      supplierId: contracts.supplierId,
    })
      .from(contracts)
      .where(and(
        or(
          like(contracts.title, searchTerm),
          like(contracts.number, searchTerm),
        ),
        ...(contractGroupCond ? [contractGroupCond] : []),
      ))
      .limit(limit),

    db.select({
      id: companies.id,
      legalName: companies.legalName,
      tradeName: companies.tradeName,
      cnpj: companies.cnpj,
    })
      .from(companies)
      .where(and(
        or(
          like(companies.legalName, searchTerm),
          like(companies.tradeName, searchTerm),
          like(companies.cnpj, searchTerm),
        ),
        ...(companyGroupCond ? [companyGroupCond] : []),
      ))
      .limit(limit),
  ]);

  return {
    suppliers: supplierResults,
    documents: documentResults,
    contracts: contractResults,
    companies: companyResults,
  };
}

export async function countSuppliersByBusinessUnit(businessUnitId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})` })
    .from(supplierCompanyLinks)
    .where(and(
      eq(supplierCompanyLinks.businessUnitId, businessUnitId),
      eq(supplierCompanyLinks.status, "active")
    ));
  return Number(result[0]?.count ?? 0);
}

// Contar fornecedores por companyId string (campo direto na tabela suppliers)
export async function countSuppliersByCompanyStringId(companyId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Fonte canônica: supplierCompanyLinks (companyId como número)
  const companyIdNum = parseInt(companyId, 10);
  if (isNaN(companyIdNum)) return 0;
  const result = await db
    .select({ count: sql<number>`count(distinct ${supplierCompanyLinks.supplierId})` })
    .from(supplierCompanyLinks)
    .where(and(
      eq(supplierCompanyLinks.companyId, companyIdNum),
      eq(supplierCompanyLinks.status, "active")
    ));
  return Number(result[0]?.count ?? 0);
}

// Contagem para home da central de fornecedores
export async function countCategories(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(supplierCategories);
  return Number(result[0]?.count ?? 0);
}

export async function countContractTemplates(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(contractTemplates);
  return Number(result[0]?.count ?? 0);
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}

export async function countAuditLogs(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  return Number(result[0]?.count ?? 0);
}


// ==================== TEMPLATE FIELDS ====================

export async function getTemplateFields(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templateFields).where(eq(templateFields.templateId, templateId)).orderBy(asc(templateFields.sortOrder));
}

export async function createTemplateField(data: InsertTemplateField) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(templateFields).values(data);
  return result.insertId;
}

export async function updateTemplateField(id: number, data: Partial<InsertTemplateField>) {
  const db = await getDb();
  if (!db) return;
  await db.update(templateFields).set(data).where(eq(templateFields.id, id));
}

export async function deleteTemplateField(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(templateFields).where(eq(templateFields.id, id));
}

export async function deleteTemplateFieldsByTemplateId(templateId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(templateFields).where(eq(templateFields.templateId, templateId));
}

// ==================== EXTRACTION RUNS ====================

export async function createExtractionRun(data: InsertExtractionRun) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(extractionRuns).values(data);
  return result.insertId;
}

export async function getExtractionRun(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(extractionRuns).where(eq(extractionRuns.id, id));
  return rows[0] ?? null;
}

export async function updateExtractionRun(id: number, data: Partial<InsertExtractionRun>) {
  const db = await getDb();
  if (!db) return;
  await db.update(extractionRuns).set(data).where(eq(extractionRuns.id, id));
}

export async function getExtractionRunsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(extractionRuns).where(eq(extractionRuns.contractId, contractId)).orderBy(desc(extractionRuns.createdAt));
}

// ==================== EXTRACTED FIELDS ====================

export async function createExtractedFields(data: InsertExtractedField[]) {
  const db = await getDb();
  if (!db) return;
  if (data.length === 0) return;
  await db.insert(extractedFields).values(data);
}

export async function getExtractedFieldsByRun(extractionRunId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(extractedFields).where(eq(extractedFields.extractionRunId, extractionRunId)).orderBy(asc(extractedFields.id));
}

export async function updateExtractedField(id: number, data: Partial<InsertExtractedField>) {
  const db = await getDb();
  if (!db) return;
  await db.update(extractedFields).set(data).where(eq(extractedFields.id, id));
}

export async function confirmExtractedFields(extractionRunId: number, confirmedData: { id: number; confirmedValue: string; source: "ai_confirmed" | "ai_corrected" | "manual" }[]) {
  const db = await getDb();
  if (!db) return;
  for (const field of confirmedData) {
    await db.update(extractedFields).set({
      confirmedValue: field.confirmedValue,
      source: field.source,
      needsReview: false,
    }).where(eq(extractedFields.id, field.id));
  }
  // Mark the run as reviewed
  await db.update(extractionRuns).set({ status: "reviewed" }).where(eq(extractionRuns.id, extractionRunId));
}

// ==================== GENERATE CONTRACT FROM TEMPLATE ====================

export async function generateContractFromTemplate(params: {
  templateId: number;
  supplierId: number;
  filledFields: Record<string, string>;
  filledFieldsOrigin: Record<string, string>;
  aiConfidenceScore?: number;
  extractionRunId?: number;
  createdById?: number;
  groupId?: number;
}) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Banco de dados indisponível. Tente novamente.");

  // Validate template
  const [template] = await dbConn.select().from(contractTemplates).where(eq(contractTemplates.id, params.templateId));
  if (!template) throw new Error("Template não encontrado ou foi excluído.");
  if (!template.isActive) throw new Error("Template inativo. Ative o template antes de gerar um contrato.");
  if (!template.content || template.content.trim().length < 10) throw new Error("Template sem conteúdo. Adicione conteúdo ao template antes de gerar.");

  // Validate supplier
  const [supplier] = await dbConn.select().from(suppliers).where(eq(suppliers.id, params.supplierId));
  if (!supplier) throw new Error("Fornecedor não encontrado.");

  // Build a comprehensive placeholder map — covers both exact keys and normalized variants
  const fieldMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(params.filledFields)) {
    fieldMap[key] = value;
    fieldMap[key.toLowerCase()] = value;
    fieldMap[key.toUpperCase()] = value;
  }
  // Auto-populate supplier fields if not already in filledFields
  const autoFill: Record<string, string> = {
    FORNECEDOR_NOME: supplier.companyName || "",
    FORNECEDOR_RAZAO_SOCIAL: supplier.companyName || "",
    FORNECEDOR_CNPJ: supplier.cnpj || "",
    FORNECEDOR_EMAIL: supplier.email || "",
    FORNECEDOR_TELEFONE: supplier.phone || "",
    FORNECEDOR_ENDERECO: [supplier.street, supplier.number, supplier.neighborhood, supplier.city, supplier.state].filter(Boolean).join(", "),
    FORNECEDOR_CIDADE: supplier.city || "",
    FORNECEDOR_ESTADO: supplier.state || "",
    FORNECEDOR_CEP: supplier.zipCode || "",
    FORNECEDOR_BANCO: supplier.bankName || "",
    FORNECEDOR_AGENCIA: supplier.bankAgency || "",
    FORNECEDOR_CONTA: supplier.bankAccount || "",
    FORNECEDOR_PIX: supplier.pixKey || "",
    nome_empresa: supplier.companyName || "",
    razao_social: supplier.companyName || "",
    cnpj: supplier.cnpj || "",
    email: supplier.email || "",
    telefone: supplier.phone || "",
  };
  for (const [k, v] of Object.entries(autoFill)) {
    if (!fieldMap[k] && v) fieldMap[k] = v;
    if (!fieldMap[k.toLowerCase()] && v) fieldMap[k.toLowerCase()] = v;
  }

  // Derive title, object, value from filledFields (multiple key variants) — must be before placeholder replacement
  const title = params.filledFields["titulo"] || params.filledFields["title"] || params.filledFields["TITULO"] || `Contrato - ${supplier.companyName}`;
  const object = params.filledFields["objeto"] || params.filledFields["object"] || params.filledFields["OBJETO"] || template.description || "";
  const totalValue = params.filledFields["valor_total"] || params.filledFields["total_value"] || params.filledFields["VALOR_TOTAL"] || params.filledFields["valor"] || params.filledFields["VALOR"] || null;
  const paymentTerms = params.filledFields["condicoes_pagamento"] || params.filledFields["payment_terms"] || params.filledFields["CONDICOES_PAGAMENTO"] || params.filledFields["pagamento"] || null;
  const contractorName = params.filledFields["contratante_nome"] || params.filledFields["contractor_name"] || params.filledFields["CONTRATANTE_NOME"] || "";
  const contractorCnpj = params.filledFields["contratante_cnpj"] || params.filledFields["contractor_cnpj"] || params.filledFields["CONTRATANTE_CNPJ"] || "";

  // Replace ALL {{placeholder}} variants (case-insensitive global)
  let content = template.content;
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  content = content.replace(placeholderRegex, (match, key) => {
    const trimmed = key.trim();
    return fieldMap[trimmed] ?? fieldMap[trimmed.toLowerCase()] ?? fieldMap[trimmed.toUpperCase()] ?? match;
  });

  // Also replace [PLACEHOLDER] bracket-style placeholders used in templates
  const bracketMap: Record<string, string> = {
    // Contratante (empresa do grupo Arqueo)
    "RAZÃO SOCIAL DA CONTRATANTE": contractorName || autoFill["FORNECEDOR_NOME"] || "",
    "RAZAO SOCIAL DA CONTRATANTE": contractorName || autoFill["FORNECEDOR_NOME"] || "",
    "CNPJ DA CONTRATANTE": contractorCnpj || "",
    "CNPJ": contractorCnpj || supplier.cnpj || "",
    "ENDEREÇO COMPLETO": autoFill["FORNECEDOR_ENDERECO"] || "",
    "ENDERECO COMPLETO": autoFill["FORNECEDOR_ENDERECO"] || "",
    "NOME DO REPRESENTANTE": params.filledFields["representante"] || params.filledFields["REPRESENTANTE"] || "",
    "CARGO": params.filledFields["cargo"] || params.filledFields["CARGO"] || "",
    "CPF": params.filledFields["cpf"] || params.filledFields["CPF"] || "",
    // Contratada (fornecedor)
    "RAZÃO SOCIAL DA CONTRATADA": supplier.companyName || "",
    "RAZAO SOCIAL DA CONTRATADA": supplier.companyName || "",
    "CNPJ DA CONTRATADA": supplier.cnpj || "",
    // Datas e valores
    "DATA DE INÍCIO": params.filledFields["data_inicio"] || params.filledFields["DATA_INICIO"] || "",
    "DATA DE INICIO": params.filledFields["data_inicio"] || params.filledFields["DATA_INICIO"] || "",
    "DATA DE TÉRMINO": params.filledFields["data_fim"] || params.filledFields["DATA_FIM"] || "",
    "DATA DE TERMINO": params.filledFields["data_fim"] || params.filledFields["DATA_FIM"] || "",
    "VALOR": totalValue || "",
    "VALOR TOTAL": totalValue || "",
    "CONDIÇÕES DE PAGAMENTO": paymentTerms || "",
    "CONDICOES DE PAGAMENTO": paymentTerms || "",
    "OBJETO": object || "",
  };
  // Inject all filledFields into bracketMap (key as-is, uppercased, and underscores→spaces)
  for (const [k, v] of Object.entries(params.filledFields)) {
    if (v) {
      bracketMap[k] = v;
      bracketMap[k.toUpperCase()] = v;
      bracketMap[k.replace(/_/g, " ").toUpperCase()] = v;
    }
  }
  const bracketRegex = /\[([^\]]+)\]/g;
  content = content.replace(bracketRegex, (match, key) => {
    const trimmed = key.trim();
    return bracketMap[trimmed] ?? bracketMap[trimmed.toUpperCase()] ?? match;
  });

  // Parse dates safely
  const parseDate = (v?: string) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  const startDate = parseDate(params.filledFields["data_inicio"] || params.filledFields["start_date"] || params.filledFields["DATA_INICIO"]);
  const endDate = parseDate(params.filledFields["data_fim"] || params.filledFields["end_date"] || params.filledFields["DATA_FIM"]);

  // Generate unique contract number
  const countResult = await dbConn.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.supplierId, params.supplierId));
  const count = Number(countResult[0]?.count ?? 0) + 1;
  const contractNumber = `CTR-${supplier.cnpj?.replace(/\D/g, "").slice(0, 8) ?? "0000"}-${String(count).padStart(3, "0")}`;

  // Insert contract
  const [result] = await dbConn.insert(contracts).values({
    supplierId: params.supplierId,
    number: contractNumber,
    title,
    object,
    contractType: template.contractType ?? "service",
    status: "draft",
    creationMode: "template",
    templateId: params.templateId,
    templateName: template.name,
    extractionRunId: params.extractionRunId ?? null,
    aiConfidenceScore: params.aiConfidenceScore != null ? String(params.aiConfidenceScore) : null,
    filledFieldsOrigin: params.filledFieldsOrigin,
    totalValue: totalValue || null,
    paymentTerms: paymentTerms || null,
    content,
    contractorName,
    contractorCnpj,
    startDate,
    endDate,
    createdById: params.createdById,
  });

  const contractId = Number(result.insertId);
  if (!contractId) throw new Error("Falha ao salvar contrato no banco de dados.");

  // Create initial version for audit trail
  await dbConn.insert(contractVersions).values({
    contractId,
    versionNumber: 1,
    content,
    changeDescription: `Contrato gerado a partir do template "${template.name}"`,
    title,
    totalValue: totalValue || null,
    createdById: params.createdById,
  });

  return contractId;
}

// ==================== LIST ALL CONTRACTS (GENERAL VIEW) ====================

export async function getAllContracts(params: {
  search?: string;
  status?: string;
  contractType?: string;
  supplierId?: number;
  groupId?: number;
  limit?: number;
  offset?: number;
  /** IDs dos grupos organizacionais acessíveis (multi-grupo). Se fornecido e vazio, retorna [] */
  orgGroupIds?: number[];
}) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  let query = dbConn
    .select({
      id: contracts.id,
      number: contracts.number,
      title: contracts.title,
      object: contracts.object,
      contractType: contracts.contractType,
      status: contracts.status,
      creationMode: contracts.creationMode,
      templateId: contracts.templateId,
      templateName: contracts.templateName,
      totalValue: contracts.totalValue,
      currency: contracts.currency,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      createdAt: contracts.createdAt,
      supplierId: contracts.supplierId,
      supplierName: suppliers.companyName,
      supplierCnpj: suppliers.cnpj,
    })
    .from(contracts)
    .innerJoin(suppliers, eq(contracts.supplierId, suppliers.id));

  const conditions = [];
  if (params.supplierId) conditions.push(eq(contracts.supplierId, params.supplierId));
  if (params.status) conditions.push(eq(contracts.status, params.status as any));
  if (params.contractType) conditions.push(eq(contracts.contractType, params.contractType as any));
  // SSOT: groupId aqui representa businessUnitId. Filtrar por supplier_company_links
  // garante que contratos de fornecedores com suppliers.groupId NULL mas vinculados
  // por supplier_company_links.businessUnitId apareçam corretamente.
  if (params.groupId) {
    const visibleIds = await getVisibleSupplierIdsByScope(undefined, params.groupId);
    if (visibleIds && visibleIds.length === 0) return [];
    if (visibleIds && visibleIds.length > 0) conditions.push(inArray(contracts.supplierId, visibleIds));
  }
  // ISOLAMENTO MULTI-GRUPO: se orgGroupIds fornecido, filtrar por contracts.organizationalGroupId
  if (params.orgGroupIds !== undefined) {
    if (params.orgGroupIds.length === 0) return [];
    conditions.push(orgScopeOrNull(contracts.organizationalGroupId, params.orgGroupIds)!);
  }
  if (params.search) {
    const like = `%${params.search}%`;
    conditions.push(
      sql`(${contracts.title} LIKE ${like} OR ${contracts.number} LIKE ${like} OR ${suppliers.companyName} LIKE ${like})`
    );
  }

  if (conditions.length > 0) {
    query = (query as any).where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  return (query as any).orderBy(desc(contracts.createdAt)).limit(params.limit ?? 100);
}

// ==================== COUNT TEMPLATES & CONTRACTS FOR UNIT STATS ====================

export async function countContractsByBusinessUnit(businessUnitId: number) {
  const db = await getDb();
  if (!db) return 0;
  // SSOT: supplier_company_links em vez de suppliers.groupId legado.
  const visibleIds = await getVisibleSupplierIdsByScope(undefined, businessUnitId);
  if (!visibleIds || visibleIds.length === 0) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contracts)
    .where(inArray(contracts.supplierId, visibleIds));
  return Number(result[0]?.count ?? 0);
}


export async function countTemplates() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(contractTemplates);
  return Number(result[0]?.count ?? 0);
}


// ==================== SUPPLIER DOCUMENT LINKS (DOCUMENTOS VIA IA) ====================

export async function createSupplierDocumentLink(data: InsertSupplierDocumentLink): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierDocumentLinks).values(data);
  return Number(result[0].insertId);
}

export async function getSupplierDocumentLinks(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierDocumentLinks).where(eq(supplierDocumentLinks.supplierId, supplierId)).orderBy(desc(supplierDocumentLinks.createdAt));
}

// ==================== SUPPLIER AI EXTRACTION HELPERS ====================

export async function createSupplierExtractionRun(data: InsertExtractionRun): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(extractionRuns).values(data);
  return Number(result[0].insertId);
}

export async function updateExtractionRunStatus(id: number, status: string, extra?: Partial<InsertExtractionRun>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(extractionRuns).set({ status: status as any, ...extra }).where(eq(extractionRuns.id, id));
}

export async function createExtractedFieldsBatch(fields: InsertExtractedField[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (fields.length === 0) return;
  await db.insert(extractedFields).values(fields);
}

export async function getExtractionRunById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(extractionRuns).where(eq(extractionRuns.id, id)).limit(1);
  return rows[0] || null;
}

export async function getExtractedFieldsByRunId(runId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(extractedFields).where(eq(extractedFields.extractionRunId, runId));
}
