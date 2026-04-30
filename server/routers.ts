import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";
import * as notifications from "./notifications";
import * as reports from "./reports";
import * as exportService from "./export";
import * as clicksign from "./clicksign";
import { invokeLLM } from "./_core/llm";
import { PDFParse } from "pdf-parse";

// Helper: extract text from file buffer based on extension
async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  if (ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text?.substring(0, 12000) || "";
    } catch (e) {
      console.error("PDF text extraction failed:", e);
      return "";
    }
  }
  if (["txt", "md"].includes(ext)) {
    return buffer.toString("utf-8").substring(0, 12000);
  }
  // For docx/doc/other binary formats, return empty (LLM will handle with text prompt only)
  return "";
}

// ==================== RBAC MIDDLEWARE ====================
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
  }
  return next({ ctx });
});

// ==================== SUPPLIER AI EXTRACTION CONSTANTS ====================

const SUPPLIER_EXTRACTION_SYSTEM_PROMPT = `Voc\u00ea \u00e9 um especialista em an\u00e1lise de documentos empresariais brasileiros. Sua tarefa \u00e9 extrair dados cadastrais de fornecedores a partir de documentos enviados (cart\u00e3o CNPJ, contratos sociais, formul\u00e1rios de cadastro, comprovantes, CNH, curr\u00edculos, certid\u00f5es, etc.).

REGRAS CR\u00cdTICAS:
- Extraia APENAS dados presentes nos documentos. NUNCA invente informa\u00e7\u00f5es.
- Se um campo n\u00e3o estiver claramente no documento, retorne string vazia "" e confidence "not_found".
- N\u00e3o invente CNPJs, valores, nomes ou endere\u00e7os.
- Cruze informa\u00e7\u00f5es de m\u00faltiplos documentos para maior precis\u00e3o.
- Priorize dados mais claros e consistentes.
- Identifique o tipo de cada documento enviado.
- Seja conservador: prefira deixar vazio a inventar.`;

const SUPPLIER_EXTRACTION_USER_PROMPT = `Analise os documentos enviados e extraia os dados cadastrais do fornecedor. Retorne JSON com a estrutura abaixo:
{
  "documents_identified": [
    { "fileName": "nome do arquivo", "type": "cnpj_card|registration_form|personal_id|address_proof|resume|diploma|certificate|cnh|contract|invoice|other", "typeConfidence": 95 }
  ],
  "fields": {
    "companyName": { "value": "", "confidence": "high|medium|low|not_found", "source": "nome do arquivo" },
    "tradeName": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "cnpj": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "stateRegistration": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "municipalRegistration": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "email": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "phone": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "website": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "street": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "number": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "complement": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "neighborhood": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "city": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "state": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "zipCode": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "legalRepresentativeName": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "legalRepresentativeCpf": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "legalRepresentativeRole": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "bankName": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "bankAgency": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "bankAccount": { "value": "", "confidence": "high|medium|low|not_found", "source": "" },
    "notes": { "value": "", "confidence": "high|medium|low|not_found", "source": "" }
  },
  "summary": "Resumo do que foi encontrado nos documentos",
  "conflicts": ["lista de conflitos entre documentos, se houver"],
  "missingCritical": ["campos cr\u00edticos n\u00e3o encontrados"]
}`;

const SUPPLIER_EXTRACTION_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "supplier_extraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        documents_identified: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fileName: { type: "string" },
              type: { type: "string" },
              typeConfidence: { type: "number" },
            },
            required: ["fileName", "type", "typeConfidence"],
            additionalProperties: false,
          },
        },
        fields: {
          type: "object",
          properties: {
            companyName: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            tradeName: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            cnpj: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            stateRegistration: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            municipalRegistration: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            email: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            phone: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            website: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            street: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            number: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            complement: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            neighborhood: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            city: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            state: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            zipCode: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            legalRepresentativeName: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            legalRepresentativeCpf: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            legalRepresentativeRole: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            bankName: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            bankAgency: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            bankAccount: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
            notes: { type: "object", properties: { value: { type: "string" }, confidence: { type: "string" }, source: { type: "string" } }, required: ["value", "confidence", "source"], additionalProperties: false },
          },
          required: ["companyName", "tradeName", "cnpj", "stateRegistration", "municipalRegistration", "email", "phone", "website", "street", "number", "complement", "neighborhood", "city", "state", "zipCode", "legalRepresentativeName", "legalRepresentativeCpf", "legalRepresentativeRole", "bankName", "bankAgency", "bankAccount", "notes"],
          additionalProperties: false,
        },
        summary: { type: "string" },
        conflicts: { type: "array", items: { type: "string" } },
        missingCritical: { type: "array", items: { type: "string" } },
      },
      required: ["documents_identified", "fields", "summary", "conflicts", "missingCritical"],
      additionalProperties: false,
    },
  },
};

const CONFIDENCE_MAP: Record<string, number> = { high: 95, medium: 70, low: 35, not_found: 0 };

const FIELD_LABELS: Record<string, string> = {
  companyName: "Raz\u00e3o Social",
  tradeName: "Nome Fantasia",
  cnpj: "CNPJ",
  stateRegistration: "Inscri\u00e7\u00e3o Estadual",
  municipalRegistration: "Inscri\u00e7\u00e3o Municipal",
  email: "E-mail",
  phone: "Telefone",
  website: "Website",
  street: "Logradouro",
  number: "N\u00famero",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  zipCode: "CEP",
  legalRepresentativeName: "Nome do Representante Legal",
  legalRepresentativeCpf: "CPF do Representante",
  legalRepresentativeRole: "Cargo/Fun\u00e7\u00e3o",
  bankName: "Banco",
  bankAgency: "Ag\u00eancia",
  bankAccount: "Conta",
  notes: "Observa\u00e7\u00f5es",
};

function buildExtractedFields(runId: number, parsed: any) {
  const fields: any[] = [];
  if (!parsed?.fields) return fields;
  for (const [key, val] of Object.entries(parsed.fields)) {
    const v = val as any;
    if (!v) continue;
    const confStr = v.confidence || "not_found";
    fields.push({
      extractionRunId: runId,
      fieldKey: key,
      fieldLabel: FIELD_LABELS[key] || key,
      extractedValue: v.value || "",
      confidence: String(CONFIDENCE_MAP[confStr] ?? 0),
      source: "ai",
      category: "supplier",
      needsReview: confStr !== "high",
    });
  }
  return fields;
}

// ==================== SCHEMAS ====================
const supplierSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  tradeName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  website: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountType: z.enum(["checking", "savings"]).optional(),
  pixKey: z.string().optional(),
  categoryId: z.number().optional(),
  criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().optional(),
  companyId: z.string().optional(),
  groupId: z.number().optional(),
});

const documentSchema = z.object({
  supplierId: z.number(),
  name: z.string().min(1, "Nome do documento é obrigatório"),
  type: z.enum(["contract", "certificate", "invoice", "license", "insurance", "registration", "other"]),
  description: z.string().optional(),
  fileKey: z.string(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  expiresAt: z.string().optional(),
});

const interactionSchema = z.object({
  supplierId: z.number(),
  type: z.enum(["email", "phone", "meeting", "visit", "note", "other"]),
  subject: z.string().min(1, "Assunto é obrigatório"),
  description: z.string().optional(),
  contactName: z.string().optional(),
  interactionDate: z.string(),
  followUpDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

const evaluationSchema = z.object({
  supplierId: z.number(),
  evaluationPeriod: z.string(),
  qualityScore: z.number().min(0).max(100).optional(),
  deliveryScore: z.number().min(0).max(100).optional(),
  priceScore: z.number().min(0).max(100).optional(),
  communicationScore: z.number().min(0).max(100).optional(),
  complianceScore: z.number().min(0).max(100).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  comments: z.string().optional(),
});

// ==================== ROUTERS ====================
export const appRouter = router({
  system: systemRouter,

  // ==================== AUTH ====================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USERS ====================
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),

    updateRole: adminProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["admin", "manager", "reader"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.id, input.role);
        await db.createAuditLog({
          entityType: "user",
          entityId: input.id,
          action: "update",
          changes: { role: input.role },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserStatus(input.id, input.isActive);
        await db.createAuditLog({
          entityType: "user",
          entityId: input.id,
          action: "update",
          changes: { isActive: input.isActive },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("E-mail inválido"),
        role: z.enum(["admin", "manager", "reader"]),
        isActive: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createUser(input);
        await db.createAuditLog({
          entityType: "user",
          entityId: id,
          action: "create",
          changes: { name: input.name, email: input.email, role: input.role, isActive: input.isActive },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        email: z.string().email("E-mail inválido").optional(),
        role: z.enum(["admin", "manager", "reader"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateUser(id, data);
        await db.createAuditLog({
          entityType: "user",
          entityId: id,
          action: "update",
          changes: data,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta" });
        }
        await db.deleteUser(input.id);
        await db.createAuditLog({
          entityType: "user",
          entityId: input.id,
          action: "delete",
          changes: { deleted: true, softDelete: true },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),
  }),

  // ==================== CATEGORIES ====================
  categories: router({
    list: protectedProcedure.query(async () => {
      return db.getAllCategories();
    }),

    create: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createCategory(input);
        await db.createAuditLog({
          entityType: "category",
          entityId: id,
          action: "create",
          changes: input,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        await db.createAuditLog({
          entityType: "category",
          entityId: id,
          action: "update",
          changes: data,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteCategory(input.id);
        await db.createAuditLog({
          entityType: "category",
          entityId: input.id,
          action: "delete",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),
  }),

  // ==================== SUPPLIERS ====================
  suppliers: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        categoryId: z.number().optional(),
        criticality: z.string().optional(),
        search: z.string().optional(),
        companyId: z.string().optional(),
        groupId: z.number().optional(),
        businessUnitId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        // businessUnitId é alias de groupId (suppliers.groupId = businessUnits.id)
        const filters = input
          ? { ...input, groupId: input.groupId ?? input.businessUnitId }
          : undefined;
        return db.getAllSuppliers(filters);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const supplier = await db.getSupplierById(input.id);
        if (!supplier) throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor n\u00e3o encontrado" });
        return supplier;
      }),

    create: managerProcedure
      .input(supplierSchema)
      .mutation(async ({ input, ctx }) => {
        // Sanitizar CNPJ: remover pontos, barra e hífen
        const sanitizedCnpj = input.cnpj.replace(/[.\/-]/g, "");
        const id = await db.createSupplier({
          ...input,
          cnpj: sanitizedCnpj,
          createdById: ctx.user.id,
        });
        await db.createAuditLog({
          entityType: "supplier",
          entityId: id,
          action: "create",
          changes: input,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        // Create approval workflow
        const workflowId = await db.createWorkflow({
          supplierId: id,
          totalSteps: 2,
          createdById: ctx.user.id,
        });
        await db.createWorkflowStep({
          workflowId,
          stepNumber: 1,
          stepName: "Verificação de Documentos",
        });
        await db.createWorkflowStep({
          workflowId,
          stepNumber: 2,
          stepName: "Aprovação Final",
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({ id: z.number() }).merge(supplierSchema.partial()))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        // Sanitizar CNPJ se fornecido: remover pontos, barra e hífen
        if (data.cnpj) {
          data.cnpj = data.cnpj.replace(/[.\/-]/g, "");
        }
        await db.updateSupplier(id, data);
        await db.createAuditLog({
          entityType: "supplier",
          entityId: id,
          action: "update",
          changes: data,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteSupplier(input.id);
        await db.createAuditLog({
          entityType: "supplier",
          entityId: input.id,
          action: "delete",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.approveSupplier(input.id, ctx.user.id);
        await db.createAuditLog({
          entityType: "supplier",
          entityId: input.id,
          action: "approve",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    reject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.rejectSupplier(input.id);
        await db.createAuditLog({
          entityType: "supplier",
          entityId: input.id,
          action: "reject",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    // Contacts
    getContacts: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierContacts(input.supplierId);
      }),

    createContact: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        name: z.string().min(1),
        role: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSupplierContact(input);
        await db.createAuditLog({
          entityType: "contact",
          entityId: id,
          action: "create",
          changes: input,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    updateContact: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateSupplierContact(id, data);
        return { success: true };
      }),

    deleteContact: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSupplierContact(input.id);
        return { success: true };
      }),

    // ==================== CADASTRO VIA I.A. ====================

    uploadDocsForExtraction: managerProcedure
      .input(z.object({
        files: z.array(z.object({
          base64: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          fileSize: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const uploadedFiles: Array<{ fileUrl: string; fileKey: string; fileName: string; fileSize: number; mimeType: string }> = [];
        for (const file of input.files) {
          const buffer = Buffer.from(file.base64, "base64");
          const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const fileKey = `suppliers/ai-extraction/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;
          const { url: fileUrl } = await storagePut(fileKey, buffer, file.mimeType);
          uploadedFiles.push({ fileUrl, fileKey, fileName: file.fileName, fileSize: file.fileSize, mimeType: file.mimeType });
        }
        return { uploadedFiles };
      }),

    extractFromDocs: managerProcedure
      .input(z.object({
        files: z.array(z.object({
          base64: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          fileUrl: z.string().optional().default(""),
          fileKey: z.string().optional().default(""),
        })),
        groupId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();

        // Upload files to S3 if not already uploaded
        const filesWithUrls = [];
        for (const file of input.files) {
          if (file.fileUrl && file.fileKey) {
            filesWithUrls.push(file);
          } else {
            const buffer = Buffer.from(file.base64, "base64");
            const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
            const fileKey = `suppliers/ai-extraction/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;
            const { url: fileUrl } = await storagePut(fileKey, buffer, file.mimeType);
            filesWithUrls.push({ ...file, fileUrl, fileKey });
          }
        }

        // Create extraction run
        const runId = await db.createSupplierExtractionRun({
          sourceFileUrl: filesWithUrls[0].fileUrl,
          sourceFileKey: filesWithUrls[0].fileKey,
          sourceFileName: filesWithUrls.map(f => f.fileName).join(", "),
          sourceFileMimeType: filesWithUrls[0].mimeType,
          purpose: "supplier_fill",
          status: "processing",
          createdById: ctx.user.id,
        });

        try {
          // Extract text from all files
          const fileTexts: string[] = [];
          for (const file of filesWithUrls) {
            const buffer = Buffer.from(file.base64, "base64");
            const ext = file.fileName.split(".").pop()?.toLowerCase() || "bin";
            const text = await extractTextFromBuffer(buffer, ext);
            if (text) {
              fileTexts.push(`--- DOCUMENTO: ${file.fileName} ---\n${text}`);
            }
          }

          if (fileTexts.length === 0) {
            // Try with LLM file_url for PDFs
            const fileContents: any[] = [];
            for (const file of filesWithUrls) {
              if (file.mimeType === "application/pdf") {
                fileContents.push({
                  type: "file_url" as const,
                  file_url: { url: file.fileUrl, mime_type: "application/pdf" as const },
                });
              }
            }
            if (fileContents.length === 0) {
              await db.updateExtractionRunStatus(runId, "failed", {
                errorMessage: "N\u00e3o foi poss\u00edvel extrair texto dos documentos enviados. Verifique se os arquivos s\u00e3o leg\u00edveis.",
                processingTimeMs: Date.now() - startTime,
              });
              throw new TRPCError({ code: "BAD_REQUEST", message: "N\u00e3o foi poss\u00edvel extrair texto dos documentos enviados." });
            }
            // Use multimodal approach
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: SUPPLIER_EXTRACTION_SYSTEM_PROMPT,
                },
                {
                  role: "user",
                  content: [
                    { type: "text" as const, text: SUPPLIER_EXTRACTION_USER_PROMPT },
                    ...fileContents,
                  ],
                },
              ],
              response_format: SUPPLIER_EXTRACTION_RESPONSE_FORMAT,
            });

            const rawContent = response.choices[0]?.message?.content || "{}";
            const contentStr = typeof rawContent === "string" ? rawContent : "{}";
            const parsed = JSON.parse(contentStr);
            const processingTimeMs = Date.now() - startTime;

            // Save extracted fields
            const extractedFieldsList = buildExtractedFields(runId, parsed);
            await db.createExtractedFieldsBatch(extractedFieldsList);

            // Calculate overall confidence
            const avgConfidence = extractedFieldsList.length > 0
              ? extractedFieldsList.reduce((sum, f) => sum + Number(f.confidence || 0), 0) / extractedFieldsList.length
              : 0;

            await db.updateExtractionRunStatus(runId, "completed", {
              overallConfidence: String(avgConfidence) as any,
              rawResponse: contentStr,
              processingTimeMs,
            });

            return {
              runId,
              extracted: parsed,
              fields: extractedFieldsList,
              overallConfidence: avgConfidence,
              processingTimeMs,
              uploadedFiles: filesWithUrls.map(f => ({ fileUrl: f.fileUrl, fileKey: f.fileKey, fileName: f.fileName, fileSize: 0, mimeType: f.mimeType })),
            };
          }

          // Text-based extraction
          const combinedText = fileTexts.join("\n\n");
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: SUPPLIER_EXTRACTION_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: SUPPLIER_EXTRACTION_USER_PROMPT + "\n\n" + combinedText,
              },
            ],
            response_format: SUPPLIER_EXTRACTION_RESPONSE_FORMAT,
          });

          const rawContent = response.choices[0]?.message?.content || "{}";
          const contentStr = typeof rawContent === "string" ? rawContent : "{}";
          const parsed = JSON.parse(contentStr);
          const processingTimeMs = Date.now() - startTime;

          // Save extracted fields
          const extractedFieldsList = buildExtractedFields(runId, parsed);
          await db.createExtractedFieldsBatch(extractedFieldsList);

          // Calculate overall confidence
          const avgConfidence = extractedFieldsList.length > 0
            ? extractedFieldsList.reduce((sum, f) => sum + Number(f.confidence || 0), 0) / extractedFieldsList.length
            : 0;

          await db.updateExtractionRunStatus(runId, "completed", {
            overallConfidence: String(avgConfidence) as any,
            rawResponse: contentStr,
            processingTimeMs,
          });

          return {
            runId,
            extracted: parsed,
            fields: extractedFieldsList,
            overallConfidence: avgConfidence,
            processingTimeMs,
            uploadedFiles: filesWithUrls.map(f => ({ fileUrl: f.fileUrl, fileKey: f.fileKey, fileName: f.fileName, fileSize: 0, mimeType: f.mimeType })),
          };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          await db.updateExtractionRunStatus(runId, "failed", {
            errorMessage: err?.message || "Erro desconhecido na extra\u00e7\u00e3o",
            processingTimeMs: Date.now() - startTime,
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Erro na extra\u00e7\u00e3o por IA" });
        }
      }),

    saveViaAI: managerProcedure
      .input(z.object({
        supplierData: supplierSchema,
        extractionRunId: z.number(),
        uploadedFiles: z.array(z.object({
          fileUrl: z.string(),
          fileKey: z.string(),
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          documentType: z.string().optional(),
          documentTypeConfidence: z.number().optional(),
        })),
        reviewedFields: z.array(z.object({
          fieldKey: z.string(),
          wasReviewed: z.boolean(),
          confirmedValue: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Sanitizar CNPJ
        const sanitizedCnpj = input.supplierData.cnpj.replace(/[.\/-]/g, "");

        // Create supplier with registrationOrigin = 'ai'
        const supplierId = await db.createSupplier({
          ...input.supplierData,
          cnpj: sanitizedCnpj,
          registrationOrigin: "ai" as any,
          createdById: ctx.user.id,
        });

        // Create approval workflow
        const workflowId = await db.createWorkflow({
          supplierId,
          totalSteps: 2,
          createdById: ctx.user.id,
        });
        await db.createWorkflowStep({ workflowId, stepNumber: 1, stepName: "Verifica\u00e7\u00e3o de Documentos" });
        await db.createWorkflowStep({ workflowId, stepNumber: 2, stepName: "Aprova\u00e7\u00e3o Final" });

        // Link uploaded documents to supplier
        for (const file of input.uploadedFiles) {
          await db.createSupplierDocumentLink({
            supplierId,
            extractionRunId: input.extractionRunId,
            fileUrl: file.fileUrl,
            fileKey: file.fileKey,
            fileName: file.fileName,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            documentType: (file.documentType || "other") as any,
            documentTypeConfidence: file.documentTypeConfidence ? String(file.documentTypeConfidence) as any : null,
            linkedById: ctx.user.id,
          });
        }

        // Update extraction run with supplier reference
        await db.updateExtractionRunStatus(input.extractionRunId, "reviewed", {
          supplierId,
          reviewedById: ctx.user.id,
          reviewedAt: new Date(),
        });

        // Update extracted fields with review info
        if (input.reviewedFields) {
          const existingFields = await db.getExtractedFieldsByRunId(input.extractionRunId);
          for (const rf of input.reviewedFields) {
            const field = existingFields.find(f => f.fieldKey === rf.fieldKey);
            if (field) {
              const dbConn = await db.getDb();
              if (dbConn) {
                const { extractedFields: ef } = await import("../drizzle/schema");
                const { eq } = await import("drizzle-orm");
                await dbConn.update(ef).set({
                  confirmedValue: rf.confirmedValue || field.extractedValue,
                  source: rf.wasReviewed ? "ai_corrected" as any : "ai_confirmed" as any,
                  needsReview: false,
                }).where(eq(ef.id, field.id));
              }
            }
          }
        }

        // Audit log
        await db.createAuditLog({
          entityType: "supplier",
          entityId: supplierId,
          action: "create",
          changes: { ...input.supplierData, registrationOrigin: "ai", extractionRunId: input.extractionRunId },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { supplierId };
      }),
  }),

  // ==================== DOCUMENTS ====================
  documents: router({
    list: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierDocuments(input.supplierId);
      }),

    listAll: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        expirationStatus: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getAllDocuments(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentById(input.id);
      }),

    create: managerProcedure
      .input(documentSchema)
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDocument({
          ...input,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          uploadedById: ctx.user.id,
        });
        await db.createAuditLog({
          entityType: "document",
          entityId: id,
          action: "upload",
          changes: { name: input.name, type: input.type },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        // Criar alerta de expiração somente se o documento vence em até 15 dias (janela crítica)
        if (input.expiresAt) {
          const expirationDate = new Date(input.expiresAt);
          const daysUntilExpiration = Math.ceil(
            (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiration > 0 && daysUntilExpiration <= 15) {
            const severity = daysUntilExpiration <= 3 ? "critical" : daysUntilExpiration <= 7 ? "high" : "medium";
            await db.createAlert({
              supplierId: input.supplierId,
              documentId: id,
              alertType: "expiration",
              severity,
              title: `Documento "${input.name}" expira em ${daysUntilExpiration} dia(s)`,
              description: `O documento expira em ${expirationDate.toLocaleDateString("pt-BR")} (${daysUntilExpiration} dia(s) restante(s))`,
              dueDate: expirationDate,
            });
          }
        }
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        expiresAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateDocument(id, {
          ...data,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteDocument(input.id);
        await db.createAuditLog({
          entityType: "document",
          entityId: input.id,
          action: "delete",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    getExpiring: protectedProcedure
      .input(z.object({ daysAhead: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getExpiringDocuments(input.daysAhead || 30);
      }),

    getUploadUrl: managerProcedure
      .input(z.object({
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `documents/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;
        return { fileKey, contentType: input.contentType };
      }),

    upload: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        name: z.string(),
        type: z.string(),
        fileData: z.string(), // base64 encoded file data
        fileName: z.string(),
        mimeType: z.string(),
        expiresAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload file to S3
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `documents/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Create document record
        const id = await db.createDocument({
          supplierId: input.supplierId,
          name: input.name,
          type: input.type as "contract" | "certificate" | "invoice" | "license" | "insurance" | "registration" | "other",
          fileUrl: url,
          fileKey: fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: fileBuffer.length,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          uploadedById: ctx.user.id,
        });
        
        // Create audit log
        await db.createAuditLog({
          entityType: "document",
          entityId: id,
          action: "upload",
          changes: { name: input.name, type: input.type, fileName: input.fileName },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        
        // Criar alerta de expiração somente se o documento vence em até 15 dias (janela crítica)
        if (input.expiresAt) {
          const expirationDate = new Date(input.expiresAt);
          const daysUntilExpiration = Math.ceil(
            (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiration > 0 && daysUntilExpiration <= 15) {
            const severity = daysUntilExpiration <= 3 ? "critical" : daysUntilExpiration <= 7 ? "high" : "medium";
            await db.createAlert({
              supplierId: input.supplierId,
              documentId: id,
              alertType: "expiration",
              severity,
              title: `Documento "${input.name}" expira em ${daysUntilExpiration} dia(s)`,
              description: `O documento expira em ${expirationDate.toLocaleDateString("pt-BR")} (${daysUntilExpiration} dia(s) restante(s))`,
              dueDate: expirationDate,
            });
          }
        }
        
        return { id, url };
      }),
  }),

  // ==================== WORKFLOWS ====================
  workflows: router({
    list: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierWorkflows(input.supplierId);
      }),

    getBySupplierId: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const workflows = await db.getSupplierWorkflows(input.supplierId);
        return workflows.length > 0 ? workflows[0] : null;
      }),

    getPending: managerProcedure
      .input(z.object({ companyId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getPendingWorkflows(input?.companyId);
      }),

    getSteps: protectedProcedure
      .input(z.object({ workflowId: z.number() }))
      .query(async ({ input }) => {
        return db.getWorkflowSteps(input.workflowId);
      }),

    approveStep: managerProcedure
      .input(z.object({
        stepId: z.number(),
        workflowId: z.number(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateWorkflowStep(input.stepId, {
          status: "approved",
          approvedById: ctx.user.id,
          approvedAt: new Date(),
          comments: input.comments,
        });
        // Check if all steps are approved
        const steps = await db.getWorkflowSteps(input.workflowId);
        const allApproved = steps.every(s => s.step.status === "approved");
        if (allApproved) {
          await db.updateWorkflow(input.workflowId, {
            status: "approved",
            completedAt: new Date(),
          });
        } else {
          const currentStep = steps.findIndex(s => s.step.status === "pending") + 1;
          await db.updateWorkflow(input.workflowId, {
            status: "in_progress",
            currentStep: currentStep || steps.length,
          });
        }
        return { success: true };
      }),

    rejectStep: managerProcedure
      .input(z.object({
        stepId: z.number(),
        workflowId: z.number(),
        comments: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateWorkflowStep(input.stepId, {
          status: "rejected",
          approvedById: ctx.user.id,
          approvedAt: new Date(),
          comments: input.comments,
        });
        await db.updateWorkflow(input.workflowId, {
          status: "rejected",
          completedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ==================== INTERACTIONS ====================
  interactions: router({
    list: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierInteractions(input.supplierId);
      }),

    listRecent: protectedProcedure
      .input(z.object({ limit: z.number().optional(), companyId: z.string().optional(), groupId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getRecentInteractions(input.limit || 50, input.companyId, input.groupId);
      }),

    create: managerProcedure
      .input(interactionSchema)
      .mutation(async ({ input, ctx }) => {
        const id = await db.createInteraction({
          ...input,
          interactionDate: new Date(input.interactionDate),
          followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
          createdById: ctx.user.id,
        });
        await db.createAuditLog({
          entityType: "interaction",
          entityId: id,
          action: "create",
          changes: { type: input.type, subject: input.subject },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        subject: z.string().optional(),
        description: z.string().optional(),
        followUpDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateInteraction(id, {
          ...data,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInteraction(input.id);
        return { success: true };
      }),

    // Upload de anexo com extração de conteúdo por IA
    uploadAttachment: managerProcedure
      .input(z.object({
        interactionId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "bin";
        const fileKey = `interactions/attachments/${Date.now()}-${input.fileName}`;
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          doc: "application/msword",
          txt: "text/plain",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
        };
        const resolvedMime = mimeMap[ext] || input.mimeType || "application/octet-stream";
        const { url: attachmentUrl } = await storagePut(fileKey, buffer, resolvedMime);

        // Extrai texto do arquivo para leitura por IA (somente para formatos suportados)
        let aiExtractedContent: string | undefined;
        const extractableExts = ["pdf", "txt", "md"];
        if (extractableExts.includes(ext)) {
          const rawText = await extractTextFromBuffer(buffer, ext);
          if (rawText && rawText.trim().length > 0) {
            try {
              const response = await invokeLLM({
                messages: [
                  {
                    role: "system",
                    content: "Você é um assistente especializado em análise de documentos. Extraia e resuma o conteúdo principal do documento de forma concisa e estruturada em português.",
                  },
                  {
                    role: "user",
                    content: `Analise este documento e forneça: 1) Um resumo executivo em 2-3 frases, 2) Os pontos principais em tópicos, 3) Datas ou valores relevantes mencionados.\n\nCONTEÚDO:\n${rawText}`,
                  },
                ],
              });
              const rawContent = response.choices[0]?.message?.content;
              aiExtractedContent = typeof rawContent === "string" ? rawContent : undefined;
            } catch (e) {
              console.error("AI extraction failed for interaction attachment:", e);
            }
          }
        }

        // Atualiza a interação com o anexo
        await db.updateInteraction(input.interactionId, {
          attachmentUrl,
          attachmentKey: fileKey,
          attachmentName: input.fileName,
          aiExtractedContent,
        });

        return { attachmentUrl, attachmentName: input.fileName, aiExtractedContent };
      }),
  }),

  // ==================== EVALUATIONS ====================
  evaluations: router({
    list: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierEvaluations(input.supplierId);
      }),

    create: managerProcedure
      .input(evaluationSchema)
      .mutation(async ({ input, ctx }) => {
        // Calculate overall score
        const scores = [
          input.qualityScore,
          input.deliveryScore,
          input.priceScore,
          input.communicationScore,
          input.complianceScore,
        ].filter(s => s !== undefined) as number[];

        const overallScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : undefined;

        const id = await db.createEvaluation({
          ...input,
          qualityScore: input.qualityScore?.toString(),
          deliveryScore: input.deliveryScore?.toString(),
          priceScore: input.priceScore?.toString(),
          communicationScore: input.communicationScore?.toString(),
          complianceScore: input.complianceScore?.toString(),
          overallScore: overallScore?.toFixed(2),
          evaluatedById: ctx.user.id,
        });
        await db.createAuditLog({
          entityType: "evaluation",
          entityId: id,
          action: "create",
          changes: { period: input.evaluationPeriod, overallScore },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        evaluationPeriod: z.string().optional(),
        qualityScore: z.number().min(0).max(100).optional(),
        deliveryScore: z.number().min(0).max(100).optional(),
        priceScore: z.number().min(0).max(100).optional(),
        communicationScore: z.number().min(0).max(100).optional(),
        complianceScore: z.number().min(0).max(100).optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...rest } = input;
        const scores = [
          rest.qualityScore,
          rest.deliveryScore,
          rest.priceScore,
          rest.communicationScore,
          rest.complianceScore,
        ].filter(s => s !== undefined) as number[];
        const overallScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : undefined;
        await db.updateEvaluation(id, {
          ...rest,
          qualityScore: rest.qualityScore?.toString(),
          deliveryScore: rest.deliveryScore?.toString(),
          priceScore: rest.priceScore?.toString(),
          communicationScore: rest.communicationScore?.toString(),
          complianceScore: rest.complianceScore?.toString(),
          overallScore: overallScore?.toFixed(2),
        });
        await db.createAuditLog({
          entityType: "evaluation",
          entityId: id,
          action: "update",
          changes: { overallScore },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteEvaluation(input.id);
        await db.createAuditLog({
          entityType: "evaluation",
          entityId: input.id,
          action: "delete",
          changes: {},
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    getLatest: protectedProcedure
      .input(z.object({ limit: z.number().optional(), companyId: z.string().optional(), groupId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getLatestEvaluations(input.limit || 10, input.companyId, input.groupId);
      }),
  }),

  // ==================== COMPLIANCE ====================
  compliance: router({
    getAlerts: protectedProcedure
      .input(z.object({ companyId: z.string().optional(), groupId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getActiveAlerts(input?.companyId, input?.groupId);
      }),

    resolveAlert: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.resolveAlert(input.id, ctx.user.id);
        return { success: true };
      }),

    createAlert: managerProcedure
      .input(z.object({
        supplierId: z.number().optional(),
        documentId: z.number().optional(),
        alertType: z.enum(["expiration", "missing_document", "compliance_issue", "review_needed"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAlert({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        return { id };
      }),
  }),

  // ==================== AUDIT ====================
  audit: router({
    list: adminProcedure
      .input(z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        userId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAuditLogs(input);
      }),
  }),

  // Alias for compliance.getAuditLogs
  complianceAudit: router({
    getAuditLogs: adminProcedure
      .input(z.object({
        entityType: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAuditLogs(input);
      }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({ companyId: z.string().optional(), groupId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getDashboardStats(input?.companyId, input?.groupId);
      }),

    suppliersByCategory: protectedProcedure
      .input(z.object({ companyId: z.string().optional(), groupId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getSuppliersByCategory(input?.companyId, input?.groupId);
      }),

    suppliersByCriticality: protectedProcedure
      .input(z.object({ companyId: z.string().optional(), groupId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getSuppliersByCriticality(input?.companyId, input?.groupId);
      }),
  }),

  // ==================== ONBOARDING (Public) ====================
  onboarding: router({
    submit: publicProcedure
      .input(supplierSchema)
      .mutation(async ({ input }) => {
        const id = await db.createSupplier({
          ...input,
          status: "pending",
        });
        // Create approval workflow
        const workflowId = await db.createWorkflow({
          supplierId: id,
          totalSteps: 2,
        });
        await db.createWorkflowStep({
          workflowId,
          stepNumber: 1,
          stepName: "Verificação de Documentos",
        });
        await db.createWorkflowStep({
          workflowId,
          stepNumber: 2,
          stepName: "Aprovação Final",
        });
        await db.createAuditLog({
          entityType: "supplier",
          entityId: id,
          action: "create",
          changes: { source: "onboarding", companyName: input.companyName },
        });
        // Send notification for new supplier registration
        await notifications.notifyNewSupplierRegistration(input.companyName, input.cnpj);
        return { id, message: "Cadastro enviado com sucesso! Aguarde a aprovação." };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    checkExpiringDocuments: adminProcedure.mutation(async () => {
      const result = await notifications.checkAndNotifyExpiringDocuments();
      return result;
    }),

    // Notificação específica para documentos que vencem em 7 dias
    checkExpiring7Days: adminProcedure.mutation(async () => {
      return notifications.checkAndNotifyExpiring7Days();
    }),

    // Notificação específica para contratos cuja vigência efetiva vence em 7 dias
    checkExpiringContracts7Days: adminProcedure.mutation(async () => {
      return notifications.checkAndNotifyExpiringContracts7Days();
    }),

    sendTestNotification: adminProcedure.mutation(async () => {
      const { notifyOwner } = await import("./_core/notification");
      const success = await notifyOwner({
        title: "🧪 Teste de Notificação",
        content: "Esta é uma notificação de teste do Sistema de Gestão de Fornecedores do Grupo Arqueo.",
      });
      return { success };
    }),
  }),

  // ==================== REPORTS ====================
  reports: router({
    suppliers: managerProcedure
      .input(z.object({
        format: z.enum(["csv", "json"]),
        status: z.string().optional(),
        categoryId: z.number().optional(),
        criticality: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return reports.generateSuppliersReport({
          format: input.format,
          filters: {
            status: input.status,
            categoryId: input.categoryId,
            criticality: input.criticality,
          },
        });
      }),

    documents: managerProcedure
      .input(z.object({
        format: z.enum(["csv", "json"]),
        type: z.string().optional(),
        expirationStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return reports.generateDocumentsReport({
          format: input.format,
          filters: { status: input.type },
          expirationStatus: input.expirationStatus,
        });
      }),

    evaluations: managerProcedure
      .input(z.object({
        format: z.enum(["csv", "json"]),
      }))
      .mutation(async ({ input }) => {
        return reports.generateEvaluationsReport({
          format: input.format,
        });
      }),

    audit: adminProcedure
      .input(z.object({
        format: z.enum(["csv", "json"]),
        entityType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return reports.generateAuditReport({
          format: input.format,
          entityType: input.entityType,
        });
      }),

    expiringDocuments: managerProcedure
      .input(z.object({
        daysAhead: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return reports.generateExpiringDocumentsReport(input.daysAhead || 30);
      }),
  }),

  // ==================== CONTRACTS ====================
  contracts: router({
    listBySupplier: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        companySlug: z.string().optional(), // Slug da empresa selecionada (segregação por empresa)
      }))
      .query(async ({ input }) => {
        // Retorna contratos com vigência efetiva calculada (aditivo mais recente ou original)
        // Se companySlug fornecido: retorna apenas contratos dessa empresa + contratos all_group
        return db.getContractsBySupplierWithEffectiveEndDate(input.supplierId, input.companySlug);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contract = await db.getContractById(input.id);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });
        const items = await db.getContractItems(input.id);
        // Inclui vigência efetiva calculada
        const effective = await db.getContractEffectiveEndDate(input.id);
        return { contract, items, ...effective };
      }),

    getEffectiveEndDate: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractEffectiveEndDate(input.contractId);
      }),

    getTemplates: protectedProcedure.query(async () => {
      return db.getContractTemplates();
    }),

    create: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        title: z.string().min(1),
        number: z.string().optional(),
        object: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        status: z.enum(["draft", "review", "active", "suspended", "expired", "terminated"]).optional(),
        creationMode: z.enum(["manual", "template", "duplicate", "ai"]).optional(),
        totalValue: z.string().optional(),
        currency: z.string().optional(),
        paymentTerms: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        contractorName: z.string().optional(),
        contractorCnpj: z.string().optional(),
        contractorRepresentative: z.string().optional(),
        content: z.string().optional(),
        notes: z.string().optional(),
        // Segregação por empresa
        companyScope: z.enum(["single", "all_group"]).optional().default("single"),
        contractCompanySlug: z.string().optional(), // Slug da empresa que registra o contrato (ex: "arqueoproject")
        items: z.array(z.object({
          description: z.string(),
          unit: z.string().optional(),
          quantity: z.string().optional(),
          unitPrice: z.string().optional(),
          totalPrice: z.string().optional(),
          notes: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { items, startDate, endDate, ...contractData } = input;
        const id = await db.createContract({
          ...contractData,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          createdById: ctx.user.id,
        });
        if (items && items.length > 0) {
          for (const item of items) {
            await db.createContractItem({ ...item, contractId: id });
          }
        }
        await db.createAuditLog({
          entityType: "contract",
          entityId: id,
          action: "create",
          changes: { title: input.title, mode: input.creationMode },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        number: z.string().optional(),
        object: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        status: z.enum(["draft", "review", "active", "suspended", "expired", "terminated"]).optional(),
        totalValue: z.string().optional(),
        currency: z.string().optional(),
        paymentTerms: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        contractorName: z.string().optional(),
        contractorCnpj: z.string().optional(),
        contractorRepresentative: z.string().optional(),
        content: z.string().optional(),
        notes: z.string().optional(),
        // Segregação por empresa
        companyScope: z.enum(["single", "all_group"]).optional(),
        contractCompanySlug: z.string().nullable().optional(), // Slug da empresa (ex: "arqueoproject")
        items: z.array(z.object({
          description: z.string(),
          unit: z.string().optional(),
          quantity: z.string().optional(),
          unitPrice: z.string().optional(),
          totalPrice: z.string().optional(),
          notes: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, items, startDate, endDate, ...contractData } = input;
        await db.updateContract(id, {
          ...contractData,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        if (items !== undefined) {
          await db.deleteContractItems(id);
          for (const item of items) {
            await db.createContractItem({ ...item, contractId: id });
          }
        }
        await db.createAuditLog({
          entityType: "contract",
          entityId: id,
          action: "update",
          changes: contractData,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteContract(input.id);
        await db.createAuditLog({
          entityType: "contract",
          entityId: input.id,
          action: "delete",
          changes: {},
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    generateWithAI: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        prompt: z.string().min(1, "Descreva o contrato que deseja gerar"),
      }))
      .mutation(async ({ input }) => {
        // Fetch supplier data to enrich the AI prompt
        const supplierData = await db.getSupplierById(input.supplierId);
        const supplier = supplierData?.supplier;

        const systemPrompt = `Você é um especialista jurídico brasileiro especializado em elaboração de contratos empresariais. 
Gere um contrato completo e profissional em português brasileiro, seguindo as normas do Código Civil Brasileiro.
O contrato deve ser estruturado com cláusulas numeradas, linguagem formal e juridicamente adequada.
Retorne APENAS o texto do contrato, sem comentários adicionais.`;

        const userPrompt = `Elabore um contrato com as seguintes informações:

Fornecedor (CONTRATADA):
- Razão Social: ${supplier?.companyName || "[NOME DA EMPRESA]"}
- CNPJ: ${supplier?.cnpj || "[CNPJ]"}
- Endereço: ${supplier ? `${supplier.street || ""}, ${supplier.city || ""} - ${supplier.state || ""}` : "[ENDEREÇO]"}

Contratante (CONTRATANTE):
- Grupo Arqueo Participações
- CNPJ: [CNPJ DO GRUPO ARQUEO]

Descrição do contrato solicitado:
${input.prompt}

Estruture o contrato com:
1. Identificação das partes
2. Objeto do contrato
3. Prazo de vigência
4. Valor e forma de pagamento
5. Obrigações das partes
6. Confidencialidade
7. Rescisão
8. Foro
9. Assinaturas`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content || "";
        const content = typeof rawContent === "string" ? rawContent : "";

        // Extract a title from the first line or prompt
        const firstLine = content.split("\n").find((l: string) => l.trim().length > 0) || "";
        const title = firstLine.length > 100 ? firstLine.substring(0, 100) : firstLine || `Contrato - ${supplier?.companyName || "Fornecedor"}`;

        return { content, suggestedTitle: title.replace(/^#+\s*/, "").trim() };
      }),

    createTemplate: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createContractTemplate({
          ...input,
          createdById: ctx.user.id,
        });
        return { id };
      }),

    // ==================== PLACEHOLDERS ====================
    extractPlaceholders: protectedProcedure
      .input(z.object({ templateContent: z.string() }))
      .query(({ input }) => {
        return db.extractPlaceholders(input.templateContent);
      }),

    fillFromTemplate: managerProcedure
      .input(z.object({
        templateId: z.number(),
        supplierId: z.number(),
        companyId: z.number().optional(),
        customValues: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Busca template
        const allTemplates = await db.getAllContractTemplates();
        const template = allTemplates.find(t => t.id === input.templateId);
        if (!template || !template.content) throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });

        // Busca dados do sistema
        const supplierData = await db.getSupplierById(input.supplierId);
        const contacts = await db.getSupplierContacts(input.supplierId);
        let company = null;
        if (input.companyId) {
          company = await db.getCompanyById(input.companyId);
        }

        // Mapeia dados do sistema para placeholders
        const systemData = db.mapSystemDataToPlaceholders({
          supplier: supplierData?.supplier,
          company,
          contacts,
        });

        // Mescla com valores customizados (customValues tem prioridade)
        const customVals = (input.customValues || {}) as Record<string, string>;
        const allValues: Record<string, string> = { ...systemData, ...customVals };

        // Preenche placeholders
        const { filledContent, unfilledPlaceholders } = db.fillPlaceholders(template.content, allValues);

        return {
          filledContent,
          unfilledPlaceholders,
          placeholders: db.extractPlaceholders(template.content),
          systemValues: systemData,
        };
      }),

    // ==================== VERSIONS (VERSIONAMENTO) ====================
    listVersions: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractVersions(input.contractId);
      }),

    createVersion: managerProcedure
      .input(z.object({
        contractId: z.number(),
        changeDescription: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });

        const latestVersion = await db.getLatestVersionNumber(input.contractId);
        const newVersion = latestVersion + 1;

        const id = await db.createContractVersion({
          contractId: input.contractId,
          versionNumber: newVersion,
          content: contract.content,
          changeDescription: input.changeDescription || `Versão ${newVersion}`,
          title: contract.title,
          totalValue: contract.totalValue,
          startDate: contract.startDate,
          endDate: contract.endDate,
          createdById: ctx.user.id,
        });

        await db.createAuditLog({
          entityType: "contract_version",
          entityId: id,
          action: "create",
          changes: { contractId: input.contractId, version: newVersion, description: input.changeDescription },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { id, versionNumber: newVersion };
      }),

    // ==================== SIGNERS (SIGNATÁRIOS) ====================
    listSigners: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractSigners(input.contractId);
      }),

    addSigner: managerProcedure
      .input(z.object({
        contractId: z.number(),
        name: z.string().min(1).refine(
          (name) => name.trim().split(/\s+/).filter(w => w.length >= 2).length >= 2,
          "Informe o nome completo (nome e sobrenome)"
        ),
        email: z.string().email(),
        cpfCnpj: z.string().optional(),
        role: z.enum(["contractor", "contracted", "witness", "guarantor"]),
        signOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createContractSigner(input);
        await db.createAuditLog({
          entityType: "contract_signer",
          entityId: id,
          action: "create",
          changes: { name: input.name, email: input.email, role: input.role },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    updateSigner: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        cpfCnpj: z.string().optional(),
        role: z.enum(["contractor", "contracted", "witness", "guarantor"]).optional(),
        signOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContractSigner(id, data);
        return { success: true };
      }),

    removeSigner: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteContractSigner(input.id);
        await db.createAuditLog({
          entityType: "contract_signer",
          entityId: input.id,
          action: "delete",
          changes: {},
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    // ==================== CLICKSIGN INTEGRATION ====================
    isClicksignConfigured: protectedProcedure
      .query(async () => {
        return { configured: clicksign.isClicksignConfigured() };
      }),

    getSignatureStatus: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
        const signers = await db.getContractSigners(input.contractId);
        const events = await db.getContractClicksignEvents(input.contractId);
        return {
          signatureStatus: contract.signatureStatus || "not_sent",
          clicksignEnvelopeId: contract.clicksignEnvelopeId,
          clicksignDocumentId: contract.clicksignDocumentId,
          sendAttemptCount: contract.sendAttemptCount || 0,
          lastSendAttemptAt: contract.lastSendAttemptAt,
          lastSendError: contract.lastSendError,
          signers: signers.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            status: s.status,
            signedAt: s.signedAt,
            clicksignSignerId: s.clicksignSignerId,
            lastNotifiedAt: s.lastNotifiedAt,
          })),
          events,
        };
      }),

    sendToClicksign: managerProcedure
      .input(z.object({
        contractId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });

        // Validações de pré-envio
        const signers = await db.getContractSigners(input.contractId);
        if (signers.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Adicione ao menos um signatário antes de enviar para assinatura." });
        }

        // Verificar se todos os signatários têm email
        const signersWithoutEmail = signers.filter(s => !s.email || s.email.trim().length === 0);
        if (signersWithoutEmail.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Signatário(s) sem e-mail: ${signersWithoutEmail.map(s => s.name).join(", ")}` });
        }

        // Verificar se Clicksign está configurado
        if (!clicksign.isClicksignConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Clicksign não configurado. Configure a variável CLICKSIGN_API_KEY nas configurações do sistema." });
        }

        // Verificar se já não foi enviado e está pendente
        if (contract.signatureStatus === "sent" || contract.signatureStatus === "partially_signed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este contrato já foi enviado para assinatura. Use 'Reenviar' para notificar novamente os signatários." });
        }

        // Detectar se é reenvio após cancelamento para rastreabilidade
        const resentFromCancelled = contract.signatureStatus === "cancelled";

        // Marcar como "sending" antes de iniciar
        await db.updateContract(input.contractId, {
          signatureStatus: "sending" as any,
          lastSendAttemptAt: new Date(),
          sendAttemptCount: (contract.sendAttemptCount || 0) + 1,
          lastSendError: null,
        });

        // Salvar versão antes de enviar
        const latestVersion = await db.getLatestVersionNumber(input.contractId);
        await db.createContractVersion({
          contractId: input.contractId,
          versionNumber: latestVersion + 1,
          content: contract.content,
          changeDescription: `Versão enviada para assinatura Clicksign (tentativa ${(contract.sendAttemptCount || 0) + 1})`,
          title: contract.title,
          totalValue: contract.totalValue,
          startDate: contract.startDate,
          endDate: contract.endDate,
          createdById: ctx.user.id,
        });

        // Chamar API real do Clicksign
        const result = await clicksign.sendContractToClicksign({
          contractTitle: contract.title,
          contractContent: contract.content || "",
          contractMeta: {
            number: contract.number,
            object: contract.object,
            contractorName: contract.contractorName,
            contractorCnpj: contract.contractorCnpj,
            totalValue: contract.totalValue,
            currency: contract.currency,
            startDate: contract.startDate,
            endDate: contract.endDate,
            paymentTerms: contract.paymentTerms,
          },
          signers: signers.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            cpfCnpj: s.cpfCnpj,
            role: s.role,
            signOrder: s.signOrder || 1,
          })),
        });

        if (!result.success) {
          // Registrar falha
          await db.createContractClicksignEvent({
            contractId: input.contractId,
            eventType: "send_failed",
            clicksignEnvelopeId: result.envelopeId || null,
            clicksignDocumentId: result.documentId || null,
            errorMessage: result.error,
            httpStatus: result.httpStatus,
            requestId: result.requestId,
            eventData: {
              step: result.step,
              error: result.error,
              sentBy: ctx.user.email,
              attemptNumber: (contract.sendAttemptCount || 0) + 1,
            },
          });

          await db.updateContract(input.contractId, {
            signatureStatus: "send_failed" as any,
            lastSendError: `[${result.step}] ${result.error}`,
          });

          await db.createAuditLog({
            entityType: "contract",
            entityId: input.contractId,
            action: "update",
            changes: { action: "clicksign_send_failed", step: result.step, error: result.error },
            userId: ctx.user.id,
            userEmail: ctx.user.email,
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Falha no envio ao Clicksign (etapa: ${result.step}): ${result.error}`,
          });
        }

        // Sucesso: atualizar contrato com IDs do Clicksign
        await db.updateContract(input.contractId, {
          clicksignEnvelopeId: result.envelopeId,
          clicksignDocumentId: result.documentId,
          signatureStatus: "sent" as any,
          status: "review",
          lastSendError: null,
        });

        // Atualizar signatários com IDs do Clicksign
        if (result.signerMappings) {
          for (const mapping of result.signerMappings) {
            await db.updateContractSigner(mapping.localSignerId, {
              clicksignSignerId: mapping.clicksignSignerId,
              clicksignRequirementId: mapping.clicksignRequirementId,
              lastNotifiedAt: new Date(),
            });
          }
        }

        // Registrar eventos de sucesso
        await db.createContractClicksignEvent({
          contractId: input.contractId,
          clicksignEnvelopeId: result.envelopeId,
          clicksignDocumentId: result.documentId,
          eventType: "envelope_activated",
          eventData: {
            envelopeId: result.envelopeId,
            documentId: result.documentId,
            signerMappings: result.signerMappings,
            sentBy: ctx.user.email,
            attemptNumber: (contract.sendAttemptCount || 0) + 1,
            resentFromCancelledEnvelope: resentFromCancelled,
          },
        });

        await db.createContractClicksignEvent({
          contractId: input.contractId,
          clicksignEnvelopeId: result.envelopeId,
          eventType: "notification_sent",
          eventData: {
            signerCount: signers.length,
            signers: signers.map(s => ({ name: s.name, email: s.email })),
            resentFromCancelledEnvelope: resentFromCancelled,
          },
        });

        await db.createAuditLog({
          entityType: "contract",
          entityId: input.contractId,
          action: "update",
          changes: {
            action: resentFromCancelled ? "resent_after_cancellation" : "sent_to_clicksign",
            envelopeId: result.envelopeId,
            documentId: result.documentId,
            signerCount: signers.length,
            attemptNumber: (contract.sendAttemptCount || 0) + 1,
            resentFromCancelledEnvelope: resentFromCancelled,
            integrationResponseSnapshot: {
              envelopeId: result.envelopeId,
              documentId: result.documentId,
              signerMappings: result.signerMappings,
            },
          },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return {
          success: true,
          envelopeId: result.envelopeId,
          documentId: result.documentId,
          signerMappings: result.signerMappings,
          resentFromCancelledEnvelope: resentFromCancelled,
          message: resentFromCancelled
            ? `Contrato reenviado com sucesso após cancelamento para ${signers.length} signatário(s) via Clicksign. Novo envelope gerado.`
            : `Contrato enviado com sucesso para ${signers.length} signatário(s) via Clicksign.`,
        };
      }),

    resendNotification: managerProcedure
      .input(z.object({
        contractId: z.number(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });

        if (!contract.clicksignEnvelopeId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este contrato ainda não foi enviado para o Clicksign." });
        }

        if (!clicksign.isClicksignConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Clicksign não configurado." });
        }

        const result = await clicksign.resendSignerNotification(
          contract.clicksignEnvelopeId,
          input.message || `Lembrete: por favor assine o documento "${contract.title}".`,
        );

        if (!result.success) {
          await db.createContractClicksignEvent({
            contractId: input.contractId,
            clicksignEnvelopeId: contract.clicksignEnvelopeId,
            eventType: "send_failed",
            errorMessage: result.error?.message,
            httpStatus: result.error?.status,
            requestId: result.requestId,
            eventData: { step: "resend_notification", error: result.error?.message },
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Falha ao reenviar notificação: ${result.error?.message}`,
          });
        }

        // Atualizar lastNotifiedAt de todos os signatários pendentes
        const signers = await db.getContractSigners(input.contractId);
        for (const signer of signers.filter(s => s.status === "pending")) {
          await db.updateContractSigner(signer.id, { lastNotifiedAt: new Date() });
        }

        await db.createContractClicksignEvent({
          contractId: input.contractId,
          clicksignEnvelopeId: contract.clicksignEnvelopeId,
          eventType: "resend",
          eventData: {
            resentBy: ctx.user.email,
            resentAt: new Date().toISOString(),
            signerCount: signers.filter(s => s.status === "pending").length,
          },
        });

        await db.createAuditLog({
          entityType: "contract",
          entityId: input.contractId,
          action: "update",
          changes: { action: "clicksign_resend_notification" },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { success: true, message: "Notificação reenviada com sucesso para signatários pendentes." };
      }),

    cancelClicksign: managerProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND" });

        if (!contract.clicksignEnvelopeId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Contrato não possui envelope Clicksign." });
        }

        if (!clicksign.isClicksignConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Clicksign não configurado." });
        }

        const cancelledEnvelopeId = contract.clicksignEnvelopeId;
        const cancelledDocumentId = contract.clicksignDocumentId;
        const cancelledAt = new Date().toISOString();

        const result = await clicksign.cancelEnvelope(cancelledEnvelopeId);

        // Limpar IDs externos e marcar como cancelado para liberar novo envio
        await db.updateContract(input.contractId, {
          signatureStatus: "cancelled" as any,
          clicksignEnvelopeId: null,
          clicksignDocumentId: null,
          lastSendError: null,
        });

        // Resetar todos os signatários para pending e limpar IDs externos do Clicksign
        const signers = await db.getContractSigners(input.contractId);
        for (const signer of signers) {
          await db.updateContractSigner(signer.id, {
            status: "pending",
            clicksignSignerId: null,
            clicksignRequirementId: null,
            signedAt: null,
            lastNotifiedAt: null,
          });
        }

        await db.createContractClicksignEvent({
          contractId: input.contractId,
          clicksignEnvelopeId: cancelledEnvelopeId,
          clicksignDocumentId: cancelledDocumentId,
          eventType: "envelope_cancelled",
          eventData: {
            cancelledBy: ctx.user.email,
            cancelledAt,
            cancelledEnvelopeId,
            cancelledDocumentId,
            signersReset: signers.length,
            clicksignResponse: result.success ? "ok" : result.error?.message,
            resentFromCancelledEnvelope: false,
          },
        });

        await db.createAuditLog({
          entityType: "contract",
          entityId: input.contractId,
          action: "update",
          changes: {
            action: "clicksign_cancelled",
            cancelledBy: ctx.user.email,
            cancelledAt,
            cancelledEnvelopeId,
            cancelledDocumentId,
            signersReset: signers.length,
            integrationResponseSnapshot: result.success ? "ok" : result.error?.message,
          },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { success: true, message: "Envelope cancelado. O contrato pode ser reenviado para assinatura." };
      }),

    syncClicksignStatus: managerProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND" });

        if (!contract.clicksignEnvelopeId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Contrato não possui envelope Clicksign." });
        }

        if (!clicksign.isClicksignConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Clicksign não configurado." });
        }

        const result = await clicksign.getEnvelopeDetails(contract.clicksignEnvelopeId);
        if (!result.success || !result.data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Falha ao consultar status: ${result.error?.message}`,
          });
        }

        // Record sync event
        await db.createContractClicksignEvent({
          contractId: input.contractId,
          clicksignEnvelopeId: contract.clicksignEnvelopeId,
          eventType: "webhook_received",
          eventData: { source: "manual_sync", response: result.data, syncBy: ctx.user.email },
        });

        return {
          success: true,
          envelopeData: result.data,
          message: "Status sincronizado com Clicksign.",
        };
      }),

    listClicksignEvents: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractClicksignEvents(input.contractId);
      }),

    // ==================== LISTAR TODOS OS CONTRATOS (VISÃO GERAL) ====================
    listAll: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        contractType: z.string().optional(),
        supplierId: z.number().optional(),
        groupId: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getAllContracts(input);
      }),

    // ==================== GERAR PDF DO CONTRATO ====================
    generatePDF: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input }) => {
        const { execFile } = await import("child_process");
        const { writeFile, readFile, unlink } = await import("fs/promises");
        const { tmpdir } = await import("os");
        const path = await import("path");

        const result = await db.getContractWithDetails(input.contractId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });
        const { contract, items } = result;

        const esc = (s: string | null | undefined) =>
          (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const formatDate = (d: Date | string | null | undefined) =>
          d ? new Date(d).toLocaleDateString("pt-BR") : "—";
        const formatCurrency = (v: string | null | undefined) =>
          v ? `R$ ${parseFloat(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

        const statusLabels: Record<string, string> = {
          draft: "Rascunho", review: "Em Revisão", active: "Ativo",
          suspended: "Suspenso", expired: "Expirado", terminated: "Encerrado",
        };
        const typeLabels: Record<string, string> = {
          service: "Prestação de Serviços", supply: "Fornecimento",
          lease: "Locação", consulting: "Consultoria",
          maintenance: "Manutenção", other: "Outro",
        };

        const itemsHtml = items.length > 0
          ? `<table class="items-table">
              <thead><tr>
                <th style="text-align:left">Descrição</th>
                <th style="text-align:right">Qtd</th>
                <th style="text-align:right">Unitário</th>
                <th style="text-align:right">Total</th>
              </tr></thead>
              <tbody>${items.map((i: any, idx: number) => `
                <tr class="${idx % 2 === 0 ? "even" : "odd"}">
                  <td>${esc(i.description)}</td>
                  <td style="text-align:right">${esc(String(i.quantity || "—"))}</td>
                  <td style="text-align:right">${formatCurrency(i.unitPrice)}</td>
                  <td style="text-align:right">${formatCurrency(i.totalPrice)}</td>
                </tr>`).join("")}
              </tbody></table>`
          : "";

        const contentHtml = contract.content
          ? esc(contract.content).replace(/\n/g, "<br/>")
          : "<em>Sem conteúdo registrado.</em>";

        const safeTitle = esc(contract.title);
        const safeNumber = contract.number ? `#${esc(contract.number)} &nbsp;|&nbsp; ` : "";
        const safeType = esc(typeLabels[contract.contractType || ""] || "");
        const safeStatus = esc(statusLabels[contract.status || ""] || contract.status || "");
        const safeContractorName = esc(contract.contractorName || "—");
        const safeContractorCnpj = contract.contractorCnpj ? `CNPJ: ${esc(contract.contractorCnpj)}` : "";
        const safeContractorRep = esc(contract.contractorRepresentative || "(Dados do fornecedor)");
        const safeObject = contract.object ? `<div class="section"><h2>Objeto</h2><p>${esc(contract.object)}</p></div>` : "";
        const safeNotes = contract.notes ? `<div class="section"><h2>Observações</h2><p>${esc(contract.notes)}</p></div>` : "";
        const safeContent = contract.content ? `<div class="section"><h2>Conteúdo do Contrato</h2><div class="content-box">${contentHtml}</div></div>` : "";
        const safeItems = items.length > 0 ? `<div class="section"><h2>Itens do Contrato</h2>${itemsHtml}</div>` : "";
        const generatedAt = new Date().toLocaleString("pt-BR");

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    @page { size: A4; margin: 20mm 18mm 20mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; }
    .header { background: #7c1a3a; color: #fff; padding: 20pt 24pt 16pt 24pt; margin-bottom: 0; }
    .header h1 { font-size: 16pt; font-weight: 700; margin-bottom: 4pt; letter-spacing: 0.3pt; }
    .header .meta { font-size: 9pt; opacity: 0.85; }
    .header .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 3pt; padding: 1pt 6pt; font-size: 8.5pt; font-weight: 600; }
    .section { padding: 14pt 24pt; border-bottom: 1pt solid #e8e0e3; }
    .section:last-child { border-bottom: none; }
    .section h2 { font-size: 8pt; color: #7c1a3a; text-transform: uppercase; letter-spacing: 1pt; font-weight: 700; margin-bottom: 10pt; padding-bottom: 4pt; border-bottom: 1.5pt solid #e8e0e3; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
    .field label { font-size: 7.5pt; color: #888; text-transform: uppercase; letter-spacing: 0.5pt; display: block; margin-bottom: 2pt; }
    .field span { font-size: 10.5pt; font-weight: 600; color: #1a1a1a; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
    .party { background: #f8f4f5; border-left: 3pt solid #7c1a3a; border-radius: 3pt; padding: 10pt 12pt; }
    .party .role { font-size: 7.5pt; color: #7c1a3a; text-transform: uppercase; letter-spacing: 0.5pt; font-weight: 700; margin-bottom: 4pt; }
    .party .name { font-size: 11pt; font-weight: 700; color: #1a1a1a; margin-bottom: 2pt; }
    .party .cnpj { font-size: 9pt; color: #555; }
    .content-box { background: #fafafa; border: 1pt solid #e8e0e3; border-radius: 3pt; padding: 12pt; line-height: 1.8; font-size: 10pt; white-space: pre-wrap; word-break: break-word; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 6pt; }
    .items-table thead tr { background: #7c1a3a; color: #fff; }
    .items-table th { padding: 5pt 8pt; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.3pt; }
    .items-table td { padding: 5pt 8pt; border-bottom: 0.5pt solid #e8e0e3; }
    .items-table tr.even td { background: #fafafa; }
    .items-table tr.odd td { background: #fff; }
    .footer { padding: 10pt 24pt; font-size: 8pt; color: #aaa; text-align: center; border-top: 1pt solid #e8e0e3; margin-top: 8pt; }
    p { line-height: 1.7; font-size: 10.5pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${safeTitle}</h1>
    <div class="meta">${safeNumber}${safeType}${safeType && safeStatus ? " &nbsp;|&nbsp; " : ""}<span class="badge">${safeStatus}</span></div>
  </div>
  <div class="section">
    <h2>Identificação</h2>
    <div class="grid-2">
      <div class="field"><label>Valor Total</label><span>${formatCurrency(contract.totalValue)}</span></div>
      <div class="field"><label>Condições de Pagamento</label><span>${esc(contract.paymentTerms || "—")}</span></div>
      <div class="field"><label>Início</label><span>${formatDate(contract.startDate)}</span></div>
      <div class="field"><label>Término</label><span>${formatDate(contract.endDate)}</span></div>
    </div>
  </div>
  ${safeObject}
  <div class="section">
    <h2>Partes</h2>
    <div class="parties">
      <div class="party">
        <div class="role">Contratante</div>
        <div class="name">${safeContractorName}</div>
        <div class="cnpj">${safeContractorCnpj}</div>
      </div>
      <div class="party">
        <div class="role">Contratada</div>
        <div class="name">${safeContractorRep}</div>
      </div>
    </div>
  </div>
  ${safeContent}
  ${safeItems}
  ${safeNotes}
  <div class="footer">Gerado em ${generatedAt} &mdash; Arqueo Fornecedores &mdash; Documento gerado eletronicamente</div>
</body>
</html>`;

        // Write HTML to temp file, convert with WeasyPrint, read PDF, cleanup
        const ts = Date.now();
        const htmlPath = path.join(tmpdir(), `contract-${ts}.html`);
        const pdfPath = path.join(tmpdir(), `contract-${ts}.pdf`);

        await writeFile(htmlPath, html, "utf8");

        // Use clean env to avoid PYTHONPATH conflicts from the Node.js process
        const cleanEnv = { HOME: "/home/ubuntu", PATH: "/usr/bin:/usr/local/bin:/bin" };
        await new Promise<void>((resolve, reject) => {
          execFile("/usr/bin/python3.11", ["-m", "weasyprint", htmlPath, pdfPath], { timeout: 30000, env: cleanEnv }, (err) => {
            if (err) reject(new Error(`WeasyPrint error: ${err.message}`));
            else resolve();
          });
        });

        const pdfBuffer = await readFile(pdfPath);
        await unlink(htmlPath).catch(() => {});
        await unlink(pdfPath).catch(() => {});

        const safeFilename = `contrato-${contract.number || contract.id}-${contract.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.pdf`;

        return {
          pdf: pdfBuffer.toString("base64"),
          filename: safeFilename,
          contractTitle: contract.title,
        };
      }),
  }),

  // ==================== AMENDMENTS (ADITIVOS) ====================
  amendments: router({
    listByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getAmendmentsByContract(input.contractId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const amendment = await db.getAmendmentById(input.id);
        if (!amendment) throw new TRPCError({ code: "NOT_FOUND", message: "Aditivo não encontrado" });
        const milestones = await db.getMilestonesByAmendment(input.id);
        return { amendment, milestones };
      }),

    create: managerProcedure
      .input(z.object({
        contractId: z.number(),
        title: z.string().min(1),
        number: z.string().optional(),
        amendmentType: z.enum(["financial", "scope", "term", "mixed"]),
        status: z.enum(["draft", "review", "active", "terminated"]).optional(),
        description: z.string().optional(),
        valueChange: z.string().optional(),
        newTotalValue: z.string().optional(),
        newEndDate: z.string().optional(),
        content: z.string().optional(),
        notes: z.string().optional(),
        signedAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { newEndDate, signedAt, ...rest } = input;
        const id = await db.createAmendment({
          ...rest,
          newEndDate: newEndDate ? new Date(newEndDate) : undefined,
          signedAt: signedAt ? new Date(signedAt) : undefined,
          createdById: ctx.user.id,
        });
        await db.createAuditLog({
          entityType: "contract_amendment",
          entityId: id,
          action: "create",
          changes: { title: input.title, type: input.amendmentType },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        number: z.string().optional(),
        amendmentType: z.enum(["financial", "scope", "term", "mixed"]).optional(),
        status: z.enum(["draft", "review", "active", "terminated"]).optional(),
        description: z.string().optional(),
        valueChange: z.string().optional(),
        newTotalValue: z.string().optional(),
        newEndDate: z.string().optional(),
        content: z.string().optional(),
        notes: z.string().optional(),
        signedAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, newEndDate, signedAt, ...rest } = input;
        await db.updateAmendment(id, {
          ...rest,
          newEndDate: newEndDate ? new Date(newEndDate) : undefined,
          signedAt: signedAt ? new Date(signedAt) : undefined,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteAmendment(input.id);
        await db.createAuditLog({
          entityType: "contract_amendment",
          entityId: input.id,
          action: "delete",
          changes: {},
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    extractFromPDF: managerProcedure
      .input(z.object({
        contractId: z.number(),
        pdfBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Upload PDF to S3
        const buffer = Buffer.from(input.pdfBase64, "base64");
        const fileKey = `amendments/pdf/${Date.now()}-${input.fileName}`;
        const { url: pdfUrl } = await storagePut(fileKey, buffer, "application/pdf");

        // Extract text from PDF
        const extractedText = await extractTextFromBuffer(buffer, "pdf");
        const textContent = extractedText
          ? `\n\nCONTEÚDO DO ADITIVO:\n${extractedText}`
          : "\n\n(Não foi possível extrair texto do PDF. Analise com base nas informações disponíveis.)";

        // Use AI to extract amendment data
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de aditivos contratuais brasileiros. Analise o aditivo contratual fornecido e extraia as informações estruturadas. Retorne APENAS JSON válido sem markdown.`,
            },
            {
              role: "user",
              content: `Analise este aditivo contratual e extraia as seguintes informações em JSON:${textContent}\n\nRetorne JSON com a estrutura:\n{\n  "title": "título do aditivo (ex: Primeiro Aditivo ao Contrato CPST Nº 102/10-2025)",\n  "number": "número do aditivo se houver (ex: ADT-001)",\n  "amendmentType": "financial|scope|term|mixed - classifique: financial se altera valores, scope se altera escopo/objeto, term se altera prazo/vigência, mixed se altera mais de um aspecto",\n  "description": "descrição resumida do objeto do aditivo",\n  "valueChange": "variação de valor em número (positivo para acréscimo, negativo para redução, somente dígitos e ponto decimal, ou string vazia se não aplicável)",\n  "newTotalValue": "novo valor total do contrato após o aditivo em número (somente dígitos e ponto decimal, ou string vazia se não informado)",\n  "newEndDate": "nova data de término no formato YYYY-MM-DD ou string vazia se não altera prazo",\n  "content": "texto completo ou resumo detalhado das cláusulas do aditivo",\n  "signedAt": "data de assinatura do aditivo no formato YYYY-MM-DD ou string vazia",\n  "milestones": [\n    {\n      "title": "título do marco financeiro",\n      "plannedValue": "valor previsto em número",\n      "dueDate": "data YYYY-MM-DD",\n      "description": "descrição do marco"\n    }\n  ],\n  "summary": "resumo executivo do aditivo em 2-3 frases"\n}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "amendment_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  number: { type: "string" },
                  amendmentType: { type: "string" },
                  description: { type: "string" },
                  valueChange: { type: "string" },
                  newTotalValue: { type: "string" },
                  newEndDate: { type: "string" },
                  content: { type: "string" },
                  signedAt: { type: "string" },
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        plannedValue: { type: "string" },
                        dueDate: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "plannedValue", "dueDate", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["title", "number", "amendmentType", "description", "valueChange", "newTotalValue", "newEndDate", "content", "signedAt", "milestones", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : "{}";
        let extracted: any = {};
        try {
          extracted = JSON.parse(contentStr);
        } catch {
          extracted = { title: input.fileName.replace(".pdf", ""), summary: "Não foi possível extrair os dados automaticamente." };
        }

        return { extracted, pdfUrl };
      }),
  }),

  // ==================== FINANCIAL MILESTONES ====================
  milestones: router({
    listByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return db.getMilestonesByContract(input.contractId);
      }),

    listByAmendment: protectedProcedure
      .input(z.object({ amendmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getMilestonesByAmendment(input.amendmentId);
      }),

    create: managerProcedure
      .input(z.object({
        contractId: z.number(),
        amendmentId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        plannedValue: z.string().min(1),
        paidValue: z.string().optional(),
        dueDate: z.string(),
        paidAt: z.string().optional(),
        paymentDeadlineDays: z.number().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { dueDate, paidAt, ...rest } = input;
        const id = await db.createMilestone({
          ...rest,
          dueDate: new Date(dueDate),
          paidAt: paidAt ? new Date(paidAt) : undefined,
          createdById: ctx.user.id,
        });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        plannedValue: z.string().optional(),
        paidValue: z.string().optional(),
        dueDate: z.string().optional(),
        paidAt: z.string().optional(),
        paymentDeadlineDays: z.number().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, dueDate, paidAt, ...rest } = input;
        await db.updateMilestone(id, {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          paidAt: paidAt ? new Date(paidAt) : undefined,
        });
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMilestone(input.id);
        return { success: true };
      }),
  }),

  // ==================== TEMPLATE MANAGEMENT ====================
  templates: router({
    listAll: protectedProcedure.query(async () => {
      return db.getAllContractTemplates();
    }),

    create: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createContractTemplate({ ...input, createdById: ctx.user.id });
        return { id };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        content: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContractTemplate(id, data);
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContractTemplate(input.id);
        return { success: true };
      }),

    generateWithAI: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]),
        description: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const typeLabels: Record<string, string> = {
          service: "Prestação de Serviços",
          supply: "Fornecimento",
          lease: "Locação",
          consulting: "Consultoria",
          maintenance: "Manutenção",
          other: "Outro",
        };
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista jurídico brasileiro. Crie um template de contrato reutilizável do tipo "${typeLabels[input.contractType]}". 
Use marcadores como [NOME_EMPRESA], [CNPJ], [VALOR], [DATA_INICIO], [DATA_FIM], [OBJETO] para campos variáveis.
O template deve ser completo, com todas as cláusulas padrão para este tipo de contrato.
Retorne APENAS o texto do template, sem comentários.`,
            },
            {
              role: "user",
              content: `Crie um template de contrato de ${typeLabels[input.contractType]}:\n${input.description}`,
            },
          ],
        });
        const rawContent = response.choices[0]?.message?.content || "";
        const content = typeof rawContent === "string" ? rawContent : "";
        const id = await db.createContractTemplate({
          name: input.name,
          description: input.description,
          contractType: input.contractType,
          content,
          createdById: ctx.user.id,
        });
        return { id, content };
      }),

    uploadWord: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contractType: z.enum(["service", "supply", "lease", "consulting", "maintenance", "other"]).optional(),
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `templates/word/${Date.now()}-${safeName}`;
        const contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        const { url: fileUrl } = await storagePut(fileKey, buffer, contentType);
        const id = await db.createContractTemplate({
          name: input.name,
          description: input.description || `Template importado de ${input.fileName}`,
          contractType: input.contractType,
          content: `[Arquivo Word] ${input.fileName}\n\nEste template foi importado como arquivo Word (.docx). Faça o download para visualizar o conteúdo completo.`,
          fileUrl,
          fileName: input.fileName,
          createdById: ctx.user.id,
        });
        return { id, fileUrl };
      }),

    extractFromPDF: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        contractId: z.number().optional(),
        pdfBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Upload PDF to S3 first
        const buffer = Buffer.from(input.pdfBase64, "base64");
        const fileKey = `contracts/pdf/${Date.now()}-${input.fileName}`;
        const { url: pdfUrl } = await storagePut(fileKey, buffer, "application/pdf");

        // Extract text from PDF for LLM processing
        const extractedText = await extractTextFromBuffer(buffer, "pdf");
        const textContent = extractedText
          ? `\n\nCONTEÚDO DO CONTRATO:\n${extractedText}`
          : "\n\n(Não foi possível extrair texto do PDF. Analise com base nas informações disponíveis.)";

        // Use AI to extract contract data
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de contratos brasileiros. Analise o contrato fornecido e extraia as informações estruturadas. Retorne APENAS JSON válido sem markdown.`,
            },
            {
              role: "user",
              content: `Analise este contrato e extraia as seguintes informações em JSON:${textContent}\n\nRetorne JSON com a estrutura:\n{
  "title": "título do contrato",
  "number": "número do contrato se houver",
  "contractType": "service|supply|lease|consulting|maintenance|other",
  "object": "objeto do contrato",
  "totalValue": "valor total em número (somente dígitos e ponto decimal)",
  "startDate": "data início no formato YYYY-MM-DD ou null",
  "endDate": "data fim no formato YYYY-MM-DD ou null",
  "paymentTerms": "condições de pagamento",
  "contractorName": "nome(s) do(s) contratante(s) - se houver múltiplos, liste todos separados por vírgula",
  "contractorCnpj": "CNPJ(s) do(s) contratante(s) - se houver múltiplos, liste todos separados por vírgula no formato XX.XXX.XXX/XXXX-XX",
  "risks": ["risco 1", "risco 2"],
  "milestones": [
    {
      "title": "título do marco",
      "plannedValue": "valor em número",
      "dueDate": "data YYYY-MM-DD",
      "description": "descrição"
    }
  ],
  "summary": "resumo executivo do contrato em 2-3 frases"
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "contract_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  number: { type: "string" },
                  contractType: { type: "string" },
                  object: { type: "string" },
                  totalValue: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  paymentTerms: { type: "string" },
                  contractorName: { type: "string" },
                  contractorCnpj: { type: "string" },
                  risks: { type: "array", items: { type: "string" } },
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        plannedValue: { type: "string" },
                        dueDate: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "plannedValue", "dueDate", "description"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["title", "number", "contractType", "object", "totalValue", "startDate", "endDate", "paymentTerms", "contractorName", "contractorCnpj", "risks", "milestones", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : "{}";
        let extracted: any = {};
        try {
          extracted = JSON.parse(contentStr);
        } catch {
          extracted = { title: input.fileName.replace(".pdf", ""), summary: "Não foi possível extrair os dados automaticamente." };
        }

         return { extracted, pdfUrl };
      }),

    analyzeFileForAutofill: managerProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        templateId: z.number(),
        templateName: z.string(),
        templateContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Upload file to S3
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "bin";
        const fileKey = `contracts/autofill/${Date.now()}-${input.fileName}`;
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          doc: "application/msword",
          txt: "text/plain",
        };
        const resolvedMime = mimeMap[ext] || input.mimeType || "application/octet-stream";
        const { url: fileUrl } = await storagePut(fileKey, buffer, resolvedMime);

        // Extract text from file for LLM processing
        const extractedText = await extractTextFromBuffer(buffer, ext);
        const fileTextContent = extractedText
          ? `\n\nCONTEÚDO DO ARQUIVO:\n${extractedText}`
          : "\n\n(Não foi possível extrair texto do arquivo. Analise com base nas informações disponíveis.)";

        // Build AI prompt based on template context
        const templateContext = input.templateContent
          ? `\n\nO template selecionado é "${input.templateName}" e possui a seguinte estrutura:\n${input.templateContent.substring(0, 3000)}...`
          : `\n\nO template selecionado é "${input.templateName}".`;

        const systemPrompt = `Você é um especialista em análise de documentos contratuais brasileiros. Analise o arquivo fornecido e extraia dados para preencher um contrato baseado no template indicado.

REGRAS CRÍTICAS:
- Extraia APENAS dados presentes no documento. NUNCA invente ou alucie informações.
- Se um campo não estiver claramente no documento, retorne string vazia "" e marque confidence como "low".
- Não invente CNPJs, valores, datas, nomes ou cláusulas.
- Seja conservador: prefira deixar vazio a inventar.${templateContext}`;

        const userPrompt = `Analise este documento e extraia os dados para preencher o formulário de contrato. Retorne JSON com a estrutura abaixo:
{
  "title": "título sugerido para o contrato",
  "number": "número do contrato se encontrado",
  "contractType": "service|supply|lease|consulting|maintenance|other",
  "object": "objeto/escopo do contrato",
  "totalValue": "valor total em número (somente dígitos e ponto decimal, ex: 150000.00)",
  "startDate": "data início YYYY-MM-DD ou vazio",
  "endDate": "data fim YYYY-MM-DD ou vazio",
  "paymentTerms": "condições de pagamento",
  "contractorName": "nome da contratante",
  "contractorCnpj": "CNPJ da contratante (somente números)",
  "contracteeName": "nome da contratada",
  "contracteeCnpj": "CNPJ da contratada (somente números)",
  "legalRepresentative": "representante legal",
  "deliverables": "entregáveis principais",
  "notes": "informações complementares relevantes",
  "missingFields": ["lista de campos exigidos pelo template que não foram encontrados no documento"],
  "confidence": "high|medium|low",
  "confidenceNotes": "observações sobre a confiança da extração",
  "summary": "resumo executivo em 2-3 frases do que foi encontrado"
}`;

        const messages: any[] = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: userPrompt + fileTextContent,
          },
        ];

        const response = await invokeLLM({
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "contract_autofill",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  number: { type: "string" },
                  contractType: { type: "string" },
                  object: { type: "string" },
                  totalValue: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  paymentTerms: { type: "string" },
                  contractorName: { type: "string" },
                  contractorCnpj: { type: "string" },
                  contracteeName: { type: "string" },
                  contracteeCnpj: { type: "string" },
                  legalRepresentative: { type: "string" },
                  deliverables: { type: "string" },
                  notes: { type: "string" },
                  missingFields: { type: "array", items: { type: "string" } },
                  confidence: { type: "string" },
                  confidenceNotes: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["title", "number", "contractType", "object", "totalValue", "startDate", "endDate", "paymentTerms", "contractorName", "contractorCnpj", "contracteeName", "contracteeCnpj", "legalRepresentative", "deliverables", "notes", "missingFields", "confidence", "confidenceNotes", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : "{}";
        let extracted: any = {};
        try {
          extracted = JSON.parse(contentStr);
        } catch {
          return {
            success: false,
            error: "Não foi possível processar o arquivo. Tente novamente ou use um formato diferente.",
            extracted: null,
          };
        }

        return { success: true, extracted, fileUrl };
      }),

    // ==================== TEMPLATE AUTO-INSERT ====================
    analyzeFileForTemplate: managerProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "bin";
        const fileKey = `templates/autofill/${Date.now()}-${input.fileName}`;
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          doc: "application/msword",
          txt: "text/plain",
        };
        const resolvedMime = mimeMap[ext] || input.mimeType || "application/octet-stream";
        const { url: fileUrl } = await storagePut(fileKey, buffer, resolvedMime);

        // Extract text from file for LLM processing
        const templateExtractedText = await extractTextFromBuffer(buffer, ext);
        const templateTextContent = templateExtractedText
          ? `\n\nCONTEÚDO DO ARQUIVO:\n${templateExtractedText}`
          : "\n\n(Não foi possível extrair texto do arquivo. Analise com base nas informações disponíveis.)";

        const systemPrompt = `Você é um especialista em análise de documentos contratuais brasileiros. Analise o arquivo fornecido e extraia dados para preencher um TEMPLATE de contrato.
REGRAS CRÍTICAS:
- Extraia APENAS dados presentes no documento. NUNCA invente ou alucie informações.
- Se um campo não estiver claramente no documento, retorne string vazia "" e marque confidence como "low".
- Para o campo "content", preserve a estrutura jurídica e formalidade do texto original.
- Substitua dados específicos de partes por placeholders como [NOME_EMPRESA], [CNPJ], [VALOR], [DATA_INICIO], [DATA_FIM], [OBJETO].
- Seja conservador: prefira deixar vazio a inventar.`;

        const userPrompt = `Analise este documento e extraia os dados para preencher um template de contrato. Retorne JSON com a estrutura abaixo:
{
  "name": "nome sugerido para o template (ex: Contrato de Prestação de Serviços de TI)",
  "contractType": "service|supply|lease|consulting|maintenance|other",
  "description": "descrição curta e profissional do template (máx 120 caracteres)",
  "content": "conteúdo completo do template preservando estrutura jurídica, substituindo dados específicos por placeholders [NOME_EMPRESA], [CNPJ], [VALOR], [DATA_INICIO], [DATA_FIM], [OBJETO]",
  "confidence": "high|medium|low",
  "confidenceNotes": "observações sobre a confiança da extração",
  "summary": "resumo do que foi encontrado no arquivo em 2-3 frases",
  "missingFields": ["campos que não puderam ser identificados no documento"]
}`;

        const messages: any[] = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: userPrompt + templateTextContent,
          },
        ];

        const response = await invokeLLM({
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "template_autofill",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  contractType: { type: "string" },
                  description: { type: "string" },
                  content: { type: "string" },
                  confidence: { type: "string" },
                  confidenceNotes: { type: "string" },
                  summary: { type: "string" },
                  missingFields: { type: "array", items: { type: "string" } },
                },
                required: ["name", "contractType", "description", "content", "confidence", "confidenceNotes", "summary", "missingFields"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : "{}";
        let extracted: any = {};
        try {
          extracted = JSON.parse(contentStr);
        } catch {
          return {
            success: false,
            error: "Não foi possível processar o arquivo. Tente novamente ou use um formato diferente.",
            extracted: null,
          };
        }
        return { success: true, extracted, fileUrl };
      }),

    // ==================== TEMPLATE FIELDS ====================
    getFields: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        return db.getTemplateFields(input.templateId);
      }),

    saveFields: managerProcedure
      .input(z.object({
        templateId: z.number(),
        fields: z.array(z.object({
          id: z.number().optional(),
          fieldKey: z.string().min(1),
          label: z.string().min(1),
          fieldType: z.enum(["text", "number", "date", "currency", "textarea", "select"]).default("text"),
          isRequired: z.boolean().default(true),
          defaultValue: z.string().optional(),
          description: z.string().optional(),
          selectOptions: z.any().optional(),
          sortOrder: z.number().default(0),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.deleteTemplateFieldsByTemplateId(input.templateId);
        for (const field of input.fields) {
          await db.createTemplateField({
            templateId: input.templateId,
            fieldKey: field.fieldKey,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            defaultValue: field.defaultValue || null,
            description: field.description || null,
            selectOptions: field.selectOptions || null,
            sortOrder: field.sortOrder,
          });
        }
        return { success: true };
      }),

    // ==================== GERAR CONTRATO A PARTIR DE TEMPLATE ====================
    generateContract: protectedProcedure
      .input(z.object({
        templateId: z.number().int().positive(),
        supplierId: z.number().int().positive(),
        filledFields: z.record(z.string(), z.string()),
        filledFieldsOrigin: z.record(z.string(), z.string()).optional(),
        aiConfidenceScore: z.number().optional(),
        extractionRunId: z.number().optional(),
        idempotencyKey: z.string().optional(), // proteção contra duplo clique
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate required fields
        if (!input.templateId) throw new TRPCError({ code: "BAD_REQUEST", message: "Template não selecionado." });
        if (!input.supplierId) throw new TRPCError({ code: "BAD_REQUEST", message: "Fornecedor não selecionado." });

        let contractId: number;
        try {
          contractId = await db.generateContractFromTemplate({
            templateId: input.templateId,
            supplierId: input.supplierId,
            filledFields: input.filledFields,
            filledFieldsOrigin: input.filledFieldsOrigin || {},
            aiConfidenceScore: input.aiConfidenceScore,
            extractionRunId: input.extractionRunId,
            createdById: ctx.user?.id,
          });
        } catch (err: any) {
          // Surface real MySQL error for debugging
          const sqlMsg = err.cause?.sqlMessage || err.cause?.message || "";
          const fullMsg = sqlMsg ? `${err.message} | SQL: ${sqlMsg}` : err.message;
          console.error("[generateContract] Error:", fullMsg, err.cause);
          throw new TRPCError({
            code: err.message?.includes("não encontrado") ? "NOT_FOUND" :
                  err.message?.includes("inativo") ? "BAD_REQUEST" :
                  err.message?.includes("sem conteúdo") ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: fullMsg || "Erro ao gerar contrato.",
          });
        }

        if (!contractId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao persistir contrato. Tente novamente." });

        // Audit log
        await db.createAuditLog({
          entityType: "contract",
          entityId: contractId,
          action: "create",
          changes: { templateId: input.templateId, supplierId: input.supplierId, mode: "template", aiConfidenceScore: input.aiConfidenceScore },
          userId: ctx.user?.id,
          userEmail: ctx.user?.email,
        });

        return { contractId, supplierId: input.supplierId };
      }),

       // ==================== EXTRAÇÃO POR IA VIA PDF PARA PREENCHIMENTO ===========================
    extractFromPdf: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        templateId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "bin";
        const fileKey = `extraction-runs/${Date.now()}-${input.fileName}`;
        const { url: fileUrl } = await storagePut(fileKey, buffer, input.mimeType);
        const runId = await db.createExtractionRun({
          sourceFileUrl: fileUrl,
          sourceFileKey: fileKey,
          sourceFileName: input.fileName,
          sourceFileMimeType: input.mimeType,
          purpose: "both",
          templateId: input.templateId || null,
          status: "processing",
          createdById: ctx.user?.id,
        });
        if (!runId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar extraction run" });
        const startTime = Date.now();
        try {
          const text = await extractTextFromBuffer(buffer, ext);
          if (!text || text.trim().length < 10) {
            await db.updateExtractionRun(runId, { status: "failed", errorMessage: "Nao foi possivel extrair texto do documento." });
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nao foi possivel extrair texto do documento. Tente um arquivo PDF ou TXT." });
          }
          let templateFieldsInfo = "";
          if (input.templateId) {
            const fields = await db.getTemplateFields(input.templateId);
            if (fields.length > 0) {
              templateFieldsInfo = `\n\nCAMPOS DO TEMPLATE PARA PREENCHIMENTO:\n${fields.map(f => `- ${f.fieldKey}: ${f.label} (${f.fieldType}, ${f.isRequired ? "obrigatorio" : "opcional"})`).join("\n")}`;
            }
          }
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voce e um especialista em analise de documentos contratuais e cadastrais brasileiros. Extraia TODOS os dados relevantes do documento fornecido. RETORNE APENAS dados que existem no documento. NUNCA invente informacoes. Para cada campo extraido, atribua um score de confianca: "high" (>90%), "medium" (60-90%), "low" (<60%). Categorize cada campo como: "supplier" (dados do fornecedor), "contract" (dados contratuais), "financial" (valores/pagamentos), "legal" (clausulas/prazos), "other".${templateFieldsInfo}`,
              },
              {
                role: "user",
                content: `Extraia todos os dados relevantes do seguinte documento:\n\n${text.substring(0, 12000)}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "contract_extraction",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fieldKey: { type: "string", description: "Chave do campo em snake_case" },
                          fieldLabel: { type: "string", description: "Label legivel em portugues" },
                          value: { type: "string", description: "Valor extraido" },
                          confidence: { type: "string", enum: ["high", "medium", "low"] },
                          category: { type: "string", enum: ["supplier", "contract", "financial", "legal", "other"] },
                        },
                        required: ["fieldKey", "fieldLabel", "value", "confidence", "category"],
                        additionalProperties: false,
                      },
                    },
                    overallConfidence: { type: "number", description: "Score geral de confianca 0-100" },
                    summary: { type: "string", description: "Resumo do documento em 2-3 frases" },
                  },
                  required: ["fields", "overallConfidence", "summary"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = response.choices?.[0]?.message?.content;
          const contentStr = typeof rawContent === "string" ? rawContent : "{}";
          let extracted: any;
          try {
            extracted = JSON.parse(contentStr);
          } catch {
            await db.updateExtractionRun(runId, { status: "failed", errorMessage: "Falha ao processar resposta da IA" });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao processar resposta da IA" });
          }
          const processingTimeMs = Date.now() - startTime;
          const confidenceMap: Record<string, number> = { high: 95, medium: 75, low: 40 };
          const fieldsToInsert = (extracted.fields || []).map((f: any) => ({
            extractionRunId: runId,
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            extractedValue: f.value,
            confidence: String(confidenceMap[f.confidence] || 50),
            source: "ai" as const,
            category: f.category || "other",
            needsReview: f.confidence !== "high",
          }));
          await db.createExtractedFields(fieldsToInsert);
          await db.updateExtractionRun(runId, {
            status: "completed",
            overallConfidence: String(extracted.overallConfidence || 0),
            rawResponse: contentStr,
            processingTimeMs,
          });
          const savedFields = await db.getExtractedFieldsByRun(runId);
          return {
            runId,
            fields: savedFields,
            overallConfidence: extracted.overallConfidence,
            summary: extracted.summary,
            fileUrl,
          };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          await db.updateExtractionRun(runId, { status: "failed", errorMessage: err.message || "Erro desconhecido" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Erro na extracao" });
        }
      }),

    // ==================== CONFIRMAR CAMPOS EXTRAIDOS ====================
    confirmExtractedFields: protectedProcedure
      .input(z.object({
        extractionRunId: z.number(),
        fields: z.array(z.object({
          id: z.number(),
          confirmedValue: z.string(),
          source: z.enum(["ai_confirmed", "ai_corrected", "manual"]),
        })),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.confirmExtractedFields(input.extractionRunId, input.fields);
        if (input.reviewNotes) {
          await db.updateExtractionRun(input.extractionRunId, {
            reviewedById: ctx.user?.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          });
        }
        return { success: true };
      }),

    // ==================== OBTER EXTRACTION RUN ====================
    getExtractionRun: protectedProcedure
      .input(z.object({ runId: z.number() }))
      .query(async ({ input }) => {
        const run = await db.getExtractionRun(input.runId);
        if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Extraction run nao encontrada" });
        const fields = await db.getExtractedFieldsByRun(input.runId);
        return { ...run, fields };
      }),

    // ==================== CONTAR TEMPLATES + CONTRATOS POR UNIDADE ====================
    countByBusinessUnit: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        const templatesCount = await db.countTemplates();
        const contractsCount = await db.countContractsByBusinessUnit(input.businessUnitId);
        return { templates: templatesCount, contracts: contractsCount };
      }),

  }),
  // ==================== EXPORT ====================
  export: router({
    suppliers: managerProcedure
      .input(z.object({
        format: z.enum(["excel", "pdf"]),
        filters: z.object({
          categoryId: z.number().optional(),
          status: z.string().optional(),
          criticality: z.string().optional(),
          searchTerm: z.string().optional(),
        }).optional(),
        fields: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get suppliers with filters
        const result = await db.getAllSuppliers({
          categoryId: input.filters?.categoryId,
          status: input.filters?.status,
          criticality: input.filters?.criticality,
          search: input.filters?.searchTerm,
        });
        
        // Extract supplier objects
        const suppliers = result.map((r) => r.supplier);

        // Generate export
        const buffer = input.format === "excel"
          ? await exportService.exportToExcel(suppliers, input)
          : await exportService.exportToPDF(suppliers, input);

        // Return base64 encoded buffer
        return {
          data: buffer.toString("base64"),
          filename: `fornecedores_${new Date().toISOString().split('T')[0]}.${input.format === "excel" ? "xlsx" : "pdf"}`,
          mimeType: input.format === "excel" 
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
        };
      }),
  }),

  // ==================== BUSINESS UNITS ====================
  businessUnits: router({
    list: protectedProcedure.query(async () => {
      return db.listBusinessUnits();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessUnitById(input.id);
      }),

    getCompanies: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        return db.listCompaniesByUnit(input.businessUnitId);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createBusinessUnit({ ...input, createdById: ctx.user.id });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateBusinessUnit(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBusinessUnit(input.id);
        return { success: true };
      }),
  }),

  // ==================== COMPANIES ====================
  companies: router({
    listByUnit: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        return db.listCompaniesByUnit(input.businessUnitId);
      }),

    listAll: protectedProcedure.query(async () => {
      return db.listAllCompanies();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCompanyById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        businessUnitId: z.number(),
        legalName: z.string().min(1),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createCompany({ ...input, createdById: ctx.user.id });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        legalName: z.string().min(1).optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        logoUrl: z.string().optional(),
        businessUnitId: z.number().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateCompany(id, data);
      }),

     delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompany(input.id);
        return { success: true };
      }),
  }),

  // ==================== SUPPLIER LINKS (VÍNCULOS) ====================
  // ==================== SUPPLIER COMPANY LINKS (VÍNCULOS v6.0) ====================
  supplierCompanyLinks: router({
    // Lista vínculos de um fornecedor
    getBySupplier: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierCompanyLinks(input.supplierId);
      }),

    // Lista fornecedores vinculados a uma empresa
    getByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return db.getSuppliersByCompanyLink(input.companyId);
      }),

    // Lista fornecedores por área de negócio
    getByBusinessUnit: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        return db.getSuppliersByBusinessUnit(input.businessUnitId);
      }),
    // Conta fornecedores por área de negócio
    countByBusinessUnit: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        return db.countSuppliersByBusinessUnit(input.businessUnitId);
      }),
    // Contar fornecedores por companyId string (campo direto na tabela suppliers)
    countByCompanyStringId: protectedProcedure
      .input(z.object({ companyId: z.string() }))
      .query(async ({ input }) => {
        return db.countSuppliersByCompanyStringId(input.companyId);
      }),

    // Stats consolidados para home da central de fornecedores
    unitStats: protectedProcedure
      .input(z.object({ businessUnitId: z.number() }))
      .query(async ({ input }) => {
        const [suppliers, categories, templates, usersCount, auditCount] = await Promise.all([
          db.countSuppliersByBusinessUnit(input.businessUnitId),
          db.countCategories(),
          db.countContractTemplates(),
          db.countUsers(),
          db.countAuditLogs(),
        ]);
        return { suppliers, categories, templates, users: usersCount, audit: auditCount };
      }),

    // Criar vínculo
    create: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        companyId: z.number(),
        businessUnitId: z.number().optional(),
        categoryId: z.number().optional(),
        criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
        serviceScope: z.string().optional(),
        internalResponsibleId: z.number().optional(),
        internalNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar duplicata
        const exists = await db.checkSupplierCompanyLinkExists(input.supplierId, input.companyId);
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este fornecedor já está vinculado a esta empresa.",
          });
        }

        const id = await db.createSupplierCompanyLink({
          supplierId: input.supplierId,
          companyId: input.companyId,
          businessUnitId: input.businessUnitId,
          categoryId: input.categoryId,
          criticality: input.criticality || "medium",
          serviceScope: input.serviceScope,
          internalResponsibleId: input.internalResponsibleId,
          homologationStatus: "pending",
          status: "active",
          internalNotes: input.internalNotes,
          linkedById: ctx.user.id,
        });

        await db.createAuditLog({
          entityType: "supplier_company_link",
          entityId: id,
          action: "create",
          changes: { supplierId: input.supplierId, companyId: input.companyId },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { id, success: true };
      }),

    // Atualizar vínculo
    update: managerProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
        serviceScope: z.string().optional(),
        internalResponsibleId: z.number().optional(),
        homologationStatus: z.enum(["pending", "in_progress", "approved", "rejected", "suspended"]).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        internalNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.homologationStatus === "approved") {
          updateData.homologatedAt = new Date();
          updateData.homologatedById = ctx.user.id;
        }
        await db.updateSupplierCompanyLink(id, updateData);
        await db.createAuditLog({
          entityType: "supplier_company_link",
          entityId: id,
          action: "update",
          changes: data,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),

    // Desativar vínculo (soft delete)
    deactivate: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteSupplierCompanyLink(input.id);
        await db.createAuditLog({
          entityType: "supplier_company_link",
          entityId: input.id,
          action: "delete",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),
  }),

  // ==================== BASE GERAL ====================
  baseGeral: router({
    // Buscar fornecedor por CNPJ na base geral
    findByCnpj: protectedProcedure
      .input(z.object({ cnpj: z.string() }))
      .query(async ({ input }) => {
        return db.findSupplierByCnpj(input.cnpj);
      }),

    // Listar todos os fornecedores da base geral
    list: protectedProcedure
      .query(async () => {
        return db.getAllSuppliersBaseGeral();
      }),
  }),

  // ==================== BUSCA GLOBAL ====================
  globalSearch: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().min(2), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.globalSearch(input.query, input.limit);
      }),
  }),

  // ==================== EXTRAÇÃO IA ====================
  aiExtraction: router({
    // Extrair dados de fornecedor a partir de documento
    extractSupplierData: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Extrair texto do documento
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "";
        const text = await extractTextFromBuffer(buffer, ext);

        if (!text || text.trim().length < 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível extrair texto do documento. Tente um arquivo PDF ou TXT.",
          });
        }

        // Usar LLM para extrair dados estruturados
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em extrair dados cadastrais de fornecedores a partir de documentos.
Extraia os seguintes campos quando disponíveis. Retorne APENAS JSON válido, sem markdown.
Campos: companyName, tradeName, cnpj, stateRegistration, municipalRegistration, email, phone, website, street, number, complement, neighborhood, city, state, zipCode, country, bankName, bankAgency, bankAccount, bankAccountType (checking ou savings), pixKey, legalRepresentatives (array de {name, cpf, role}).
Se um campo não for encontrado, omita-o do JSON. Sanitize o CNPJ para apenas números.`,
            },
            {
              role: "user",
              content: `Extraia os dados do fornecedor a partir do seguinte documento:\n\n${text.substring(0, 8000)}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "supplier_extraction",
              strict: false,
              schema: {
                type: "object",
                properties: {
                  companyName: { type: "string" },
                  tradeName: { type: "string" },
                  cnpj: { type: "string" },
                  stateRegistration: { type: "string" },
                  municipalRegistration: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  website: { type: "string" },
                  street: { type: "string" },
                  number: { type: "string" },
                  complement: { type: "string" },
                  neighborhood: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zipCode: { type: "string" },
                  country: { type: "string" },
                  bankName: { type: "string" },
                  bankAgency: { type: "string" },
                  bankAccount: { type: "string" },
                  bankAccountType: { type: "string" },
                  pixKey: { type: "string" },
                  legalRepresentatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        cpf: { type: "string" },
                        role: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        let extracted;
        try {
          extracted = JSON.parse(content);
        } catch {
          extracted = {};
        }

        // Verificar se já existe na base geral
        let existingSupplier = null;
        if (extracted.cnpj) {
          existingSupplier = await db.findSupplierByCnpj(extracted.cnpj);
        }

        return {
          extracted,
          existingSupplier,
          fieldsFound: Object.keys(extracted).filter(k => extracted[k] !== null && extracted[k] !== undefined && extracted[k] !== ""),
        };
      }),
  }),

  // ==================== SUPPLIER LINKS (LEGADO) ====================
  supplierLinks: router({
    // Lista vínculos de um fornecedor específico
    getBySupplier: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierLinks(input.supplierId);
      }),

    // Lista fornecedores vinculados a uma empresa destino
    getByTargetCompany: protectedProcedure
      .input(z.object({ targetCompanyId: z.string() }))
      .query(async ({ input }) => {
        return db.getLinksByTargetCompany(input.targetCompanyId);
      }),

    // Lista fornecedores de uma empresa (diretos + vinculados)
    getSuppliersByCompanyWithLinks: protectedProcedure
      .input(z.object({ companyId: z.string() }))
      .query(async ({ input }) => {
        return db.getSuppliersByCompanyWithLinks(input.companyId);
      }),

    // Cria um novo vínculo entre fornecedor e empresa destino
    // Regras: mesmo grupo, não duplicar, empresa destino ≠ empresa origem
    create: managerProcedure
      .input(z.object({
        supplierId: z.number(),
        targetCompanyId: z.string().min(1),
        targetCompanyName: z.string().min(1),
        sourceCompanyId: z.string().min(1),
        sourceCompanyName: z.string().min(1),
        groupName: z.string().min(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validação: empresa destino não pode ser igual à empresa origem
        if (input.targetCompanyId === input.sourceCompanyId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A empresa de destino não pode ser a mesma que a empresa de origem.",
          });
        }

        // Validação: verificar se o vínculo já existe
        const alreadyLinked = await db.checkSupplierLinkExists(input.supplierId, input.targetCompanyId);
        if (alreadyLinked) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Este fornecedor já está vinculado à empresa "${input.targetCompanyName}".`,
          });
        }

        // Cria o vínculo
        const id = await db.createSupplierLink({
          supplierId: input.supplierId,
          targetCompanyId: input.targetCompanyId,
          targetCompanyName: input.targetCompanyName,
          sourceCompanyId: input.sourceCompanyId,
          sourceCompanyName: input.sourceCompanyName,
          groupName: input.groupName,
          notes: input.notes,
          linkedById: ctx.user.id,
          linkedByEmail: ctx.user.email || undefined,
          linkedByName: ctx.user.name || undefined,
          status: "active",
        });

        // Registra auditoria
        await db.createAuditLog({
          entityType: "supplier_link",
          entityId: id,
          action: "create",
          changes: {
            supplierId: input.supplierId,
            sourceCompany: input.sourceCompanyName,
            targetCompany: input.targetCompanyName,
            group: input.groupName,
          },
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });

        return { id, success: true };
      }),

    // Desativa um vínculo (soft delete)
    deactivate: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deactivateSupplierLink(input.id);
        await db.createAuditLog({
          entityType: "supplier_link",
          entityId: input.id,
          action: "delete",
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        });
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
