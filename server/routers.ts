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
});

export type AppRouter = typeof appRouter;
