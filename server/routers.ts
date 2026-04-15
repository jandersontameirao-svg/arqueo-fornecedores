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
import { invokeLLM } from "./_core/llm";

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
});

const documentSchema = z.object({
  supplierId: z.number(),
  name: z.string().min(1, "Nome do documento é obrigatório"),
  type: z.enum(["contract", "certificate", "invoice", "license", "other"]),
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
      }).optional())
      .query(async ({ input }) => {
        return db.getAllSuppliers(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierById(input.id);
      }),

    create: managerProcedure
      .input(supplierSchema)
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSupplier({
          ...input,
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
        // Create expiration alert if document has expiration date
        if (input.expiresAt) {
          await db.createAlert({
            supplierId: input.supplierId,
            documentId: id,
            alertType: "expiration",
            severity: "medium",
            title: `Documento "${input.name}" expira em breve`,
            description: `O documento expira em ${input.expiresAt}`,
            dueDate: new Date(input.expiresAt),
          });
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
          type: input.type as "contract" | "certificate" | "invoice" | "license" | "other",
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
        
        // Create expiration alert if document has expiration date
        if (input.expiresAt) {
          const expirationDate = new Date(input.expiresAt);
          await db.createAlert({
            supplierId: input.supplierId,
            documentId: id,
            alertType: "expiration",
            severity: "medium",
            title: `Documento "${input.name}" expira em breve`,
            description: `O documento expira em ${expirationDate.toLocaleDateString("pt-BR")}`,
            dueDate: expirationDate,
          });
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

    getPending: managerProcedure.query(async () => {
      return db.getPendingWorkflows();
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
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getRecentInteractions(input.limit || 50);
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

    getLatest: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getLatestEvaluations(input.limit || 10);
      }),
  }),

  // ==================== COMPLIANCE ====================
  compliance: router({
    getAlerts: protectedProcedure.query(async () => {
      return db.getActiveAlerts();
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
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),

    suppliersByCategory: protectedProcedure.query(async () => {
      return db.getSuppliersByCategory();
    }),

    suppliersByCriticality: protectedProcedure.query(async () => {
      return db.getSuppliersByCriticality();
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
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractsBySupplier(input.supplierId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contract = await db.getContractById(input.id);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });
        const items = await db.getContractItems(input.id);
        return { contract, items };
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

        // Use AI to extract contract data
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de contratos brasileiros. Analise o contrato fornecido e extraia as informações estruturadas. Retorne APENAS JSON válido sem markdown.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: `Analise este contrato PDF e extraia as seguintes informações em JSON:\n{
  "title": "título do contrato",
  "number": "número do contrato se houver",
  "contractType": "service|supply|lease|consulting|maintenance|other",
  "object": "objeto do contrato",
  "totalValue": "valor total em número (somente dígitos e ponto decimal)",
  "startDate": "data início no formato YYYY-MM-DD ou null",
  "endDate": "data fim no formato YYYY-MM-DD ou null",
  "paymentTerms": "condições de pagamento",
  "contractorName": "nome do contratante",
  "contractorCnpj": "CNPJ do contratante",
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
                {
                  type: "file" as const,
                  file_url: { url: pdfUrl, mime_type: "application/pdf" as const },
                },
              ],
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

        const isTextFile = ["txt"].includes(ext);
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: isTextFile
              ? userPrompt + "\n\nConteúdo do arquivo:\n" + buffer.toString("utf-8").substring(0, 8000)
              : [
                  { type: "text", text: userPrompt },
                   { type: "file", file_url: { url: fileUrl, mime_type: resolvedMime } },
                ],
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

        const isTextFile = ["txt"].includes(ext);
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: isTextFile
              ? userPrompt + "\n\nConteúdo do arquivo:\n" + buffer.toString("utf-8").substring(0, 10000)
              : [
                  { type: "text", text: userPrompt },
                  { type: "file", file_url: { url: fileUrl, mime_type: resolvedMime } },
                ],
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
});

export type AppRouter = typeof appRouter;
