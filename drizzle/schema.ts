import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, longtext } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "reader"]).default("reader").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== SUPPLIER CATEGORIES ====================
export const supplierCategories = mysqlTable("supplier_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierCategory = typeof supplierCategories.$inferSelect;
export type InsertSupplierCategory = typeof supplierCategories.$inferInsert;

// ==================== SUPPLIERS ====================
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  // Basic Info
  companyName: varchar("companyName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  // Fiscal Data
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  stateRegistration: varchar("stateRegistration", { length: 20 }),
  municipalRegistration: varchar("municipalRegistration", { length: 20 }),
  // Contact Info
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  // Address
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  country: varchar("country", { length: 100 }).default("Brasil"),
  // Bank Info
  bankName: varchar("bankName", { length: 100 }),
  bankAgency: varchar("bankAgency", { length: 20 }),
  bankAccount: varchar("bankAccount", { length: 30 }),
  bankAccountType: mysqlEnum("bankAccountType", ["checking", "savings"]),
  pixKey: varchar("pixKey", { length: 255 }),
  // Classification
  categoryId: int("categoryId").references(() => supplierCategories.id),
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"]).default("medium"),
  // Company Association
  companyId: varchar("companyId", { length: 100 }),
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended", "inactive"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedById: int("approvedById").references(() => users.id),
  // Metadata
  notes: text("notes"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ==================== SUPPLIER CONTACTS ====================
export const supplierContacts = mysqlTable("supplier_contacts", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierContact = typeof supplierContacts.$inferSelect;
export type InsertSupplierContact = typeof supplierContacts.$inferInsert;

// ==================== DOCUMENTS ====================
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["contract", "certificate", "invoice", "license", "other"]).notNull(),
  description: text("description"),
  // S3 Storage
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  // Version Control
  version: int("version").default(1).notNull(),
  parentDocumentId: int("parentDocumentId"),
  // Expiration
  expiresAt: timestamp("expiresAt"),
  expirationAlertSent: boolean("expirationAlertSent").default(false),
  // Metadata
  uploadedById: int("uploadedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ==================== APPROVAL WORKFLOWS ====================
export const approvalWorkflows = mysqlTable("approval_workflows", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "in_progress", "approved", "rejected"]).default("pending").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  totalSteps: int("totalSteps").default(1).notNull(),
  notes: text("notes"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;

// ==================== APPROVAL STEPS ====================
export const approvalSteps = mysqlTable("approval_steps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull().references(() => approvalWorkflows.id, { onDelete: "cascade" }),
  stepNumber: int("stepNumber").notNull(),
  stepName: varchar("stepName", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  assignedToId: int("assignedToId").references(() => users.id),
  approvedById: int("approvedById").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = typeof approvalSteps.$inferInsert;

// ==================== AUDIT LOG ====================
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "approve", "reject", "upload", "download"]).notNull(),
  changes: json("changes"),
  userId: int("userId").references(() => users.id),
  userEmail: varchar("userEmail", { length: 320 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ==================== INTERACTIONS ====================
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["email", "phone", "meeting", "visit", "note", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  contactName: varchar("contactName", { length: 255 }),
  interactionDate: timestamp("interactionDate").notNull(),
  followUpDate: timestamp("followUpDate"),
  attachmentUrl: varchar("attachmentUrl", { length: 1000 }),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ==================== PERFORMANCE EVALUATIONS ====================
export const performanceEvaluations = mysqlTable("performance_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  evaluationPeriod: varchar("evaluationPeriod", { length: 50 }).notNull(),
  // KPI Scores (0-100)
  qualityScore: decimal("qualityScore", { precision: 5, scale: 2 }),
  deliveryScore: decimal("deliveryScore", { precision: 5, scale: 2 }),
  priceScore: decimal("priceScore", { precision: 5, scale: 2 }),
  communicationScore: decimal("communicationScore", { precision: 5, scale: 2 }),
  complianceScore: decimal("complianceScore", { precision: 5, scale: 2 }),
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }),
  // Details
  strengths: text("strengths"),
  improvements: text("improvements"),
  comments: text("comments"),
  // Metadata
  evaluatedById: int("evaluatedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertPerformanceEvaluation = typeof performanceEvaluations.$inferInsert;

// ==================== COMPLIANCE ALERTS ====================
export const complianceAlerts = mysqlTable("compliance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").references(() => suppliers.id, { onDelete: "cascade" }),
  documentId: int("documentId").references(() => documents.id, { onDelete: "cascade" }),
  alertType: mysqlEnum("alertType", ["expiration", "missing_document", "compliance_issue", "review_needed"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedById: int("resolvedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$inferInsert;

// ==================== CONTRACTS ====================
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  // Identification
  number: varchar("number", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  object: text("object"),
  // Type & Status
  contractType: mysqlEnum("contractType", ["service", "supply", "lease", "consulting", "maintenance", "other"]).default("service"),
  status: mysqlEnum("status", ["draft", "review", "active", "suspended", "expired", "terminated"]).default("draft").notNull(),
  // Creation mode tracking
  creationMode: mysqlEnum("creationMode", ["manual", "template", "duplicate", "ai"]).default("manual"),
  // Financial
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  paymentTerms: text("paymentTerms"),
  // Dates
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  signedAt: timestamp("signedAt"),
  // Parties
  contractorName: varchar("contractorName", { length: 255 }),
  contractorCnpj: varchar("contractorCnpj", { length: 18 }),
  contractorRepresentative: varchar("contractorRepresentative", { length: 255 }),
  // Content
  content: text("content"),
  notes: text("notes"),
  // S3 attachment (signed PDF)
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 255 }),
  // Metadata
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ==================== CONTRACT ITEMS ====================
export const contractItems = mysqlTable("contract_items", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractItem = typeof contractItems.$inferSelect;
export type InsertContractItem = typeof contractItems.$inferInsert;

// ==================== CONTRACT TEMPLATES ====================
export const contractTemplates = mysqlTable("contract_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  contractType: mysqlEnum("contractType", ["service", "supply", "lease", "consulting", "maintenance", "other"]).default("service"),
  content: longtext("content").notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = typeof contractTemplates.$inferInsert;

// ==================== CONTRACT AMENDMENTS (ADITIVOS) ====================
export const contractAmendments = mysqlTable("contract_amendments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  number: varchar("number", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  amendmentType: mysqlEnum("amendmentType", ["financial", "scope", "term", "mixed"]).notNull().default("financial"),
  status: mysqlEnum("status", ["draft", "review", "active", "terminated"]).default("draft").notNull(),
  description: text("description"),
  valueChange: varchar("valueChange", { length: 50 }),
  newTotalValue: varchar("newTotalValue", { length: 50 }),
  newEndDate: timestamp("newEndDate"),
  content: text("content"),
  notes: text("notes"),
  signedAt: timestamp("signedAt"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type InsertContractAmendment = typeof contractAmendments.$inferInsert;

// ==================== FINANCIAL MILESTONES (MARCOS FINANCEIROS) ====================
export const financialMilestones = mysqlTable("financial_milestones", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  amendmentId: int("amendmentId").references(() => contractAmendments.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  plannedValue: varchar("plannedValue", { length: 50 }).notNull(),
  paidValue: varchar("paidValue", { length: 50 }),
  dueDate: timestamp("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  paymentDeadlineDays: int("paymentDeadlineDays").default(30),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialMilestone = typeof financialMilestones.$inferSelect;
export type InsertFinancialMilestone = typeof financialMilestones.$inferInsert;

// ==================== BUSINESS UNITS (ÁREAS DE NEGÓCIO) ====================
export const businessUnits = mysqlTable("business_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 1000 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessUnit = typeof businessUnits.$inferSelect;
export type InsertBusinessUnit = typeof businessUnits.$inferInsert;

// ==================== COMPANIES (EMPRESAS VINCULADAS) ====================
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  businessUnitId: int("businessUnitId").notNull().references(() => businessUnits.id, { onDelete: "cascade" }),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  logoUrl: varchar("logoUrl", { length: 1000 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ==================== SUPPLIER LINKS (VÍNCULOS ENTRE EMPRESAS) ====================
// Permite que um fornecedor já cadastrado em uma empresa seja vinculado a outra empresa
// do MESMO grupo empresarial. Vínculos entre grupos diferentes são proibidos.
export const supplierLinks = mysqlTable("supplier_links", {
  id: int("id").autoincrement().primaryKey(),
  // Fornecedor que está sendo vinculado
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  // Empresa de destino do vínculo (companyId estático, ex: "arqueogis-preventiva")
  targetCompanyId: varchar("targetCompanyId", { length: 100 }).notNull(),
  targetCompanyName: varchar("targetCompanyName", { length: 255 }).notNull(),
  // Empresa de origem (onde o fornecedor foi originalmente cadastrado)
  sourceCompanyId: varchar("sourceCompanyId", { length: 100 }).notNull(),
  sourceCompanyName: varchar("sourceCompanyName", { length: 255 }).notNull(),
  // Grupo empresarial (obrigatório para validação de regra de negócio)
  groupName: varchar("groupName", { length: 100 }).notNull(),
  // Status do vínculo
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  // Auditoria
  linkedById: int("linkedById").references(() => users.id),
  linkedByEmail: varchar("linkedByEmail", { length: 320 }),
  linkedByName: varchar("linkedByName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierLink = typeof supplierLinks.$inferSelect;
export type InsertSupplierLink = typeof supplierLinks.$inferInsert;
