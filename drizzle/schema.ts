import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, longtext } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
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

// ==================== SUPPLIERS (BASE GERAL) ====================
// Cada fornecedor existe UMA ÚNICA VEZ na base geral, identificado por CNPJ/CPF.
// Dados gerais do fornecedor ficam aqui. Dados de vínculo ficam em supplier_company_links.
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  // Basic Info
  companyName: varchar("companyName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  // Fiscal Data
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
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
  // Representantes legais
  legalRepresentatives: json("legalRepresentatives"),
  // Classification (mantidos para compatibilidade — dados de vínculo ficam em supplier_company_links)
  categoryId: int("categoryId").references(() => supplierCategories.id),
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"]).default("medium"),
  // Company Association (legado — mantido para compatibilidade com dados existentes)
  companyId: varchar("companyId", { length: 100 }),
  // Group Association (FK para business_units — segregação obrigatória por grupo)
  groupId: int("groupId").references(() => businessUnits.id),
  // Status geral na base
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended", "inactive"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedById: int("approvedById").references(() => users.id),
  // Origem do cadastro
  registrationOrigin: mysqlEnum("registrationOrigin", ["manual", "ai"]).default("manual").notNull(),
  // Metadata
  notes: text("notes"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ==================== SUPPLIER COMPANY LINKS (VÍNCULOS POR EMPRESA/UNIDADE) ====================
// Cada empresa/unidade vincula fornecedores da base geral à sua operação.
// Contém dados específicos da relação: categoria, escopo, responsável, status de homologação.
export const supplierCompanyLinks = mysqlTable("supplier_company_links", {
  id: int("id").autoincrement().primaryKey(),
  // Fornecedor da base geral
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  // Empresa/unidade vinculada (FK para companies)
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  // Área de negócio (para facilitar consultas)
  businessUnitId: int("businessUnitId").references(() => businessUnits.id),
  // Dados específicos do vínculo
  categoryId: int("categoryId").references(() => supplierCategories.id),
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"]).default("medium"),
  serviceScope: text("serviceScope"),
  internalResponsibleId: int("internalResponsibleId").references(() => users.id),
  // Status de homologação nesta unidade
  homologationStatus: mysqlEnum("homologationStatus", ["pending", "in_progress", "approved", "rejected", "suspended"]).default("pending").notNull(),
  homologatedAt: timestamp("homologatedAt"),
  homologatedById: int("homologatedById").references(() => users.id),
  // Status do vínculo
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  // Observações internas da unidade
  internalNotes: text("internalNotes"),
  // Auditoria
  linkedById: int("linkedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierCompanyLink = typeof supplierCompanyLinks.$inferSelect;
export type InsertSupplierCompanyLink = typeof supplierCompanyLinks.$inferInsert;

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
  type: mysqlEnum("type", ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"]).notNull(),
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
  attachmentKey: varchar("attachmentKey", { length: 500 }),
  attachmentName: varchar("attachmentName", { length: 255 }),
  aiExtractedContent: longtext("aiExtractedContent"),
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
  // Template de origem (quando gerado a partir de template)
  templateId: int("templateId").references(() => contractTemplates.id),
  templateName: varchar("templateName", { length: 255 }), // Nome do template no momento da geração (rastreabilidade)
  // Extração por IA
  extractionRunId: int("extractionRunId"),
  aiConfidenceScore: decimal("aiConfidenceScore", { precision: 5, scale: 2 }),
  filledFieldsOrigin: json("filledFieldsOrigin"), // { campo: "ai" | "manual" | "supplier_data" }
  // Financial
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  paymentTerms: text("paymentTerms"),
  // Dates
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  signedAt: timestamp("signedAt"),
  // Parties
  contractorName: varchar("contractorName", { length: 1000 }),
  contractorCnpj: varchar("contractorCnpj", { length: 500 }),
  contractorRepresentative: varchar("contractorRepresentative", { length: 500 }),
  // Content (longtext para suportar contratos grandes - text tem limite de 65535 bytes)
  content: longtext("content"),
  notes: text("notes"),
  // S3 attachment (signed PDF)
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 255 }),
  // Clicksign integration tracking
  clicksignEnvelopeId: varchar("clicksignEnvelopeId", { length: 255 }),
  clicksignDocumentId: varchar("clicksignDocumentId", { length: 255 }),
  signatureStatus: mysqlEnum("signatureStatus", [
    "not_sent", "sending", "sent", "partially_signed", "signed", "refused", "cancelled", "expired", "send_failed"
  ]).default("not_sent"),
  lastSendAttemptAt: timestamp("lastSendAttemptAt"),
  lastSendError: text("lastSendError"),
  sendAttemptCount: int("sendAttemptCount").default(0),
  // Company Scope (segregação por empresa)
  // "single": contrato pertence apenas à empresa com slug = contractCompanySlug
  // "all_group": contrato visível para todas as empresas do Grupo Arqueo Brasil
  companyScope: mysqlEnum("companyScope", ["single", "all_group"]).default("single").notNull(),
  contractCompanySlug: varchar("contractCompanySlug", { length: 100 }), // slug da empresa (ex: "arqueoproject")
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

// ==================== TEMPLATE FIELDS (PLACEHOLDERS DE TEMPLATE) ====================
// Campos variáveis definidos em cada template, usados para preenchimento manual ou por IA.
export const templateFields = mysqlTable("template_fields", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => contractTemplates.id, { onDelete: "cascade" }),
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(), // ex: {{razao_social}}, {{cnpj}}
  label: varchar("label", { length: 255 }).notNull(), // ex: "Razão Social"
  fieldType: mysqlEnum("fieldType", ["text", "number", "date", "currency", "textarea", "select"]).default("text").notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  defaultValue: text("defaultValue"),
  description: text("description"),
  selectOptions: json("selectOptions"), // para fieldType=select: ["opção1", "opção2"]
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = typeof templateFields.$inferInsert;

// ==================== EXTRACTION RUNS (EXECUÇÕES DE EXTRAÇÃO POR IA) ====================
// Cada vez que um PDF é enviado para extração por IA, uma run é criada.
export const extractionRuns = mysqlTable("extraction_runs", {
  id: int("id").autoincrement().primaryKey(),
  // Arquivo fonte
  sourceFileUrl: varchar("sourceFileUrl", { length: 1000 }).notNull(),
  sourceFileKey: varchar("sourceFileKey", { length: 500 }),
  sourceFileName: varchar("sourceFileName", { length: 255 }).notNull(),
  sourceFileMimeType: varchar("sourceFileMimeType", { length: 100 }),
  // Contexto
  purpose: mysqlEnum("purpose", ["contract_fill", "supplier_fill", "both"]).default("both").notNull(),
  templateId: int("templateId").references(() => contractTemplates.id),
  supplierId: int("supplierId").references(() => suppliers.id),
  contractId: int("contractId").references(() => contracts.id),
  // Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "reviewed"]).default("pending").notNull(),
  overallConfidence: decimal("overallConfidence", { precision: 5, scale: 2 }), // 0-100
  // IA response
  rawResponse: longtext("rawResponse"),
  errorMessage: text("errorMessage"),
  processingTimeMs: int("processingTimeMs"),
  // Revisão humana
  reviewedById: int("reviewedById").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  // Metadata
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExtractionRun = typeof extractionRuns.$inferSelect;
export type InsertExtractionRun = typeof extractionRuns.$inferInsert;

// ==================== EXTRACTED FIELDS (CAMPOS EXTRAÍDOS POR IA) ====================
// Cada campo individual extraído de um PDF durante uma extraction run.
export const extractedFields = mysqlTable("extracted_fields", {
  id: int("id").autoincrement().primaryKey(),
  extractionRunId: int("extractionRunId").notNull().references(() => extractionRuns.id, { onDelete: "cascade" }),
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(), // ex: "cnpj", "razao_social"
  fieldLabel: varchar("fieldLabel", { length: 255 }).notNull(),
  extractedValue: text("extractedValue"),
  confirmedValue: text("confirmedValue"), // valor após revisão humana
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  source: mysqlEnum("source", ["ai", "manual", "ai_confirmed", "ai_corrected"]).default("ai").notNull(),
  category: mysqlEnum("category", ["supplier", "contract", "financial", "legal", "other"]).default("other").notNull(),
  needsReview: boolean("needsReview").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExtractedField = typeof extractedFields.$inferSelect;
export type InsertExtractedField = typeof extractedFields.$inferInsert;

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

// ==================== DOCUMENT EXPIRATION NOTIFICATIONS ====================
// Rastreia quais notificações de vencimento foram enviadas para evitar duplicidade
export const documentExpirationNotifications = mysqlTable("document_expiration_notifications", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull().references(() => documents.id, { onDelete: "cascade" }),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  daysBeforeExpiration: int("daysBeforeExpiration").notNull(), // 7, 3, 1, etc.
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  notificationTitle: varchar("notificationTitle", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentExpirationNotification = typeof documentExpirationNotifications.$inferSelect;
export type InsertDocumentExpirationNotification = typeof documentExpirationNotifications.$inferInsert;

// ==================== CONTRACT EXPIRATION NOTIFICATIONS ====================
// Rastreia notificações de vencimento de contratos para evitar duplicidade
export const contractExpirationNotifications = mysqlTable("contract_expiration_notifications", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  daysBeforeExpiration: int("daysBeforeExpiration").notNull(), // 7, 3, 1, etc.
  // Rastreabilidade: qual foi a fonte da vigência usada para a notificação
  effectiveDateSource: mysqlEnum("effectiveDateSource", ["original", "amendment"]).notNull().default("original"),
  amendmentId: int("amendmentId"), // sem FK explícita para evitar nome de constraint longo no MySQL
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  notificationTitle: varchar("notificationTitle", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractExpirationNotification = typeof contractExpirationNotifications.$inferSelect;
export type InsertContractExpirationNotification = typeof contractExpirationNotifications.$inferInsert;

// ==================== CONTRACT VERSIONS (VERSIONAMENTO) ====================
export const contractVersions = mysqlTable("contract_versions", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  versionNumber: int("versionNumber").notNull().default(1),
  content: longtext("content"),
  changeDescription: varchar("changeDescription", { length: 500 }),
  // Snapshot of key fields at this version
  title: varchar("title", { length: 255 }),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  // Metadata
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractVersion = typeof contractVersions.$inferSelect;
export type InsertContractVersion = typeof contractVersions.$inferInsert;

// ==================== CONTRACT SIGNERS (SIGNATÁRIOS) ====================
export const contractSigners = mysqlTable("contract_signers", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  role: mysqlEnum("role", ["contractor", "contracted", "witness", "guarantor"]).notNull().default("contractor"),
  signOrder: int("signOrder").default(1),
  // Clicksign tracking
  clicksignSignerId: varchar("clicksignSignerId", { length: 255 }),
  clicksignRequirementId: varchar("clicksignRequirementId", { length: 255 }),
  signedAt: timestamp("signedAt"),
  status: mysqlEnum("status", ["pending", "signed", "refused", "expired"]).default("pending").notNull(),
  emailDeliveryStatus: varchar("emailDeliveryStatus", { length: 50 }),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractSigner = typeof contractSigners.$inferSelect;
export type InsertContractSigner = typeof contractSigners.$inferInsert;

// ==================== CONTRACT CLICKSIGN EVENTS ====================
export const contractClicksignEvents = mysqlTable("contract_clicksign_events", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  // Clicksign document tracking
  clicksignDocumentId: varchar("clicksignDocumentId", { length: 255 }),
  clicksignEnvelopeId: varchar("clicksignEnvelopeId", { length: 255 }),
  eventType: mysqlEnum("eventType", [
    "envelope_created", "document_uploaded", "signers_added", "requirements_set",
    "envelope_activated", "notification_sent", "signer_signed", "signer_refused",
    "envelope_completed", "envelope_cancelled", "envelope_expired",
    "resend", "send_failed", "webhook_received"
  ]).notNull(),
  eventData: json("eventData"),
  errorMessage: text("errorMessage"),
  httpStatus: int("httpStatus"),
  requestId: varchar("requestId", { length: 255 }),
  signerId: int("signerId"), // references contractSigners.id (sem FK explícita)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractClicksignEvent = typeof contractClicksignEvents.$inferSelect;
export type InsertContractClicksignEvent = typeof contractClicksignEvents.$inferInsert;

// ==================== SUPPLIER DOCUMENT LINKS (DOCUMENTOS VINCULADOS VIA IA) ====================
// Vincula documentos usados na extração por IA ao fornecedor criado.
export const supplierDocumentLinks = mysqlTable("supplier_document_links", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  extractionRunId: int("extractionRunId").references(() => extractionRuns.id, { onDelete: "set null" }),
  // Arquivo vinculado
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  // Tipo de documento reconhecido pela IA
  documentType: mysqlEnum("documentType", [
    "cnpj_card", "registration_form", "personal_id", "address_proof",
    "resume", "diploma", "certificate", "cnh", "contract", "invoice", "other"
  ]).default("other").notNull(),
  documentTypeConfidence: decimal("documentTypeConfidence", { precision: 5, scale: 2 }),
  // Metadata
  linkedById: int("linkedById").references(() => users.id),
  linkedAt: timestamp("linkedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierDocumentLink = typeof supplierDocumentLinks.$inferSelect;
export type InsertSupplierDocumentLink = typeof supplierDocumentLinks.$inferInsert;
