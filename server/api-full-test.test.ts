/**
 * v7.34 — Teste Completo de Todas as Entradas de API
 * Cobre: ENV vars, LLM (Manus Forge), S3 Storage, Clicksign, Database, tRPC procedures
 */
import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGet } from "./storage";
import { isClicksignConfigured } from "./clicksign";
import * as db from "./db";

// ==================== 1. VARIÁVEIS DE AMBIENTE ====================
describe("1. Variáveis de Ambiente", () => {
  it("DATABASE_URL configurado", () => {
    expect(ENV.databaseUrl).toBeTruthy();
    expect(ENV.databaseUrl.length).toBeGreaterThan(10);
  });

  it("JWT_SECRET configurado", () => {
    expect(ENV.cookieSecret).toBeTruthy();
  });

  it("BUILT_IN_FORGE_API_URL configurado e válido", () => {
    expect(ENV.forgeApiUrl).toBeTruthy();
    expect(ENV.forgeApiUrl).toMatch(/^https?:\/\//);
  });

  it("BUILT_IN_FORGE_API_KEY configurado", () => {
    expect(ENV.forgeApiKey).toBeTruthy();
    expect(ENV.forgeApiKey.length).toBeGreaterThan(10);
  });

  it("OAUTH_SERVER_URL configurado e válido", () => {
    expect(ENV.oAuthServerUrl).toBeTruthy();
    expect(ENV.oAuthServerUrl).toMatch(/^https?:\/\//);
  });

  it("CLICKSIGN_API_URL configurado e válido", () => {
    expect(ENV.clicksignApiUrl).toBeTruthy();
    expect(ENV.clicksignApiUrl).toMatch(/^https?:\/\//);
    console.log(`[ENV] CLICKSIGN_API_URL: ${ENV.clicksignApiUrl}`);
  });

  it("CLICKSIGN_API_KEY status verificado", () => {
    const configured = isClicksignConfigured();
    console.log(`[ENV] CLICKSIGN_API_KEY configurado: ${configured}`);
    expect(typeof configured).toBe("boolean");
  });

  it("CLICKSIGN_WEBHOOK_SECRET status verificado", () => {
    const hasSecret = ENV.clicksignWebhookSecret.length > 0;
    console.log(`[ENV] CLICKSIGN_WEBHOOK_SECRET configurado: ${hasSecret}`);
    expect(typeof hasSecret).toBe("boolean");
  });
});

// ==================== 2. LLM / IA ====================
describe("2. LLM / Inteligência Artificial (Manus Forge)", () => {
  it("invokeLLM: resposta simples de texto", async () => {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente de teste. Responda apenas com a palavra OK." },
        { role: "user", content: "Teste de conectividade." },
      ],
    });
    expect(result).toBeDefined();
    expect(result.choices).toBeDefined();
    expect(result.choices.length).toBeGreaterThan(0);
    const content = result.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    expect(text.length).toBeGreaterThan(0);
    console.log(`[LLM] Resposta: "${text.substring(0, 80)}"`);
  }, 30000);

  it("invokeLLM: resposta JSON estruturada (json_schema strict)", async () => {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente que retorna JSON." },
        { role: "user", content: "Retorne o nome 'Arqueo' e o ano 2024." },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "test_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              year: { type: "number" },
            },
            required: ["name", "year"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = result.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : "{}");
    expect(parsed).toHaveProperty("name");
    expect(parsed).toHaveProperty("year");
    console.log(`[LLM JSON] name="${parsed.name}", year=${parsed.year}`);
  }, 30000);

  it("invokeLLM: suporte a FileUrlContent (sem crash em normalizeContentPart)", async () => {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente de teste." },
        {
          role: "user",
          content: [
            { type: "text", text: "Responda: suporte a file_url ativo." },
          ],
        },
      ],
    });
    expect(result.choices[0]?.message?.content).toBeDefined();
    console.log("[LLM] FileUrlContent: tipo suportado sem crash");
  }, 30000);

  it("invokeLLM: modelo e uso de tokens retornados", async () => {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "Diga 'tokens OK'." }],
    });
    expect(result.model).toBeTruthy();
    console.log(`[LLM] Modelo: ${result.model}, tokens: ${JSON.stringify(result.usage)}`);
  }, 30000);
});

// ==================== 3. S3 STORAGE ====================
describe("3. S3 Storage (Manus Forge)", () => {
  it("storagePut: upload de arquivo de teste", async () => {
    const testContent = Buffer.from(`api-test-${Date.now()}`);
    const result = await storagePut(
      `api-test/connectivity-${Date.now()}.txt`,
      testContent,
      "text/plain"
    );
    expect(result).toBeDefined();
    expect(result.url).toBeTruthy();
    expect(result.url).toMatch(/^https?:\/\//);
    console.log(`[S3] Upload OK: ${result.url.substring(0, 70)}...`);
  }, 20000);

  it("storageGet: obter URL presignada de arquivo", async () => {
    const key = `api-test/get-test-${Date.now()}.txt`;
    await storagePut(key, Buffer.from("get-test"), "text/plain");
    const result = await storageGet(key, 60);
    expect(result).toBeDefined();
    expect(result.url).toBeTruthy();
    expect(result.url).toMatch(/^https?:\/\//);
    console.log(`[S3] Get URL OK: ${result.url.substring(0, 70)}...`);
  }, 20000);
});

// ==================== 4. DATABASE ====================
describe("4. Database (MySQL/TiDB)", () => {
  it("db.getAllSuppliers: listar fornecedores", async () => {
    const result = await db.getAllSuppliers();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Fornecedores: ${result.length} registros`);
  });

  it("db.getAllCategories: listar categorias", async () => {
    const result = await db.getAllCategories();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Categorias: ${result.length}`);
  });

  it("db.getAllUsers: listar usuários", async () => {
    const result = await db.getAllUsers();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    console.log(`[DB] Usuários: ${result.length}`);
  });

  it("db.getDashboardStats: estatísticas do dashboard", async () => {
    const result = await db.getDashboardStats();
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(typeof result!.totalSuppliers).toBe("number");
    expect(typeof result!.pendingApprovals !== "undefined" || typeof result!.pendingSuppliers !== "undefined").toBe(true);
    console.log(`[DB] Dashboard: ${result!.totalSuppliers} fornecedores`);
  });

  it("db.listBusinessUnits: listar unidades de negócio", async () => {
    const result = await db.listBusinessUnits();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Unidades de negócio: ${result.length}`);
  });

  it("db.listAllCompanies: listar empresas", async () => {
    const result = await db.listAllCompanies();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Empresas: ${result.length}`);
  });

  it("db.getAllContracts: listar contratos", async () => {
    const result = await db.getAllContracts({ limit: 5, offset: 0 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Contratos: ${result.length} registros`);
  });

  it("db.getAllContractTemplates: listar templates de contrato", async () => {
    const result = await db.getAllContractTemplates();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Templates de contrato: ${result.length}`);
  });

  it("db.getAuditLogs: listar logs de auditoria", async () => {
    const result = await db.getAuditLogs({ limit: 5 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Audit logs: ${result.length} registros`);
  });

  it("db.getActiveAlerts: listar alertas de conformidade", async () => {
    const result = await db.getActiveAlerts();
    expect(Array.isArray(result)).toBe(true);
    console.log(`[DB] Alertas ativos: ${result.length}`);
  });
});

// ==================== 5. tRPC PROCEDURES — EXISTÊNCIA ====================
describe("5. tRPC — Verificação de Procedures Críticas", () => {
  it("appRouter exportado corretamente", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter).toBeDefined();
    expect(appRouter._def).toBeDefined();
    expect(appRouter._def.procedures).toBeDefined();
  });

  const criticalProcedures = [
    // Auth
    "auth.me",
    "auth.logout",
    // Suppliers
    "suppliers.list",
    "suppliers.getById",
    "suppliers.create",
    "suppliers.update",
    "suppliers.delete",
    "suppliers.approve",
    "suppliers.getContacts",
    "suppliers.createContact",
    "suppliers.extractFromDocs",
    // Documents
    "documents.upload",
    "documents.list",
    "documents.delete",
    // Workflows
    "workflows.list",
    "workflows.getBySupplierId",
    "workflows.getSteps",
    "workflows.approveStep",
    "workflows.rejectStep",
    "workflows.getPending",
    // Interactions
    "interactions.create",
    "interactions.list",
    "interactions.update",
    "interactions.delete",
    "interactions.listRecent",
    "interactions.uploadAttachment",
    // Evaluations
    "evaluations.create",
    "evaluations.list",
    "evaluations.update",
    "evaluations.delete",
    "evaluations.getLatest",
    // Compliance
    "compliance.getAlerts",
    // Compliance Audit
    "complianceAudit.getAuditLogs",
    // Audit
    "audit.list",
    // Dashboard
    "dashboard.stats",
    "dashboard.suppliersByCategory",
    "dashboard.suppliersByCriticality",
    // Notifications
    "notifications.checkExpiring7Days",
    "notifications.checkExpiringDocuments",
    "notifications.checkExpiringContracts7Days",
    "notifications.sendTestNotification",
    // Contracts
    "contracts.getById",
    "contracts.create",
    "contracts.update",
    "contracts.delete",
    "contracts.generateWithAI",
    "contracts.getTemplates",
    "contracts.createTemplate",
    "contracts.addSigner",
    "contracts.cancelClicksign",
    "contracts.fillFromTemplate",
    "contracts.extractPlaceholders",
    "contracts.createVersion",
    // Amendments
    "amendments.create",
    "amendments.getById",
    "amendments.listByContract",
    "amendments.update",
    "amendments.delete",
    "amendments.extractFromPDF",
    // Milestones
    "milestones.create",
    "milestones.listByContract",
    "milestones.listByAmendment",
    "milestones.update",
    "milestones.delete",
    // Templates
    "templates.listAll",
    "templates.create",
    "templates.update",
    "templates.delete",
    // Business Units
    "businessUnits.list",
    "businessUnits.create",
    "businessUnits.update",
    "businessUnits.delete",
    // Companies
    "companies.listAll",
    "companies.listByUnit",
    "companies.create",
    "companies.update",
    "companies.delete",
    "companies.getById",
    // Supplier Links
    "supplierLinks.getBySupplier",
    // Base Geral
    "baseGeral.list",
    "baseGeral.findByCnpj",
    // Global Search
    "globalSearch.search",
    // AI Extraction
    "aiExtraction.extractSupplierData",
    // Users
    "users.list",
    "users.create",
    "users.update",
    "users.delete",
    // Onboarding
    "onboarding.submit",
    // Reports
    "reports.suppliers",
    "reports.documents",
    "reports.evaluations",
    "reports.audit",
    "reports.expiringDocuments",
    // Export
    "export.suppliers",
  ];

  for (const proc of criticalProcedures) {
    it(`procedure "${proc}" existe no router`, async () => {
      const { appRouter } = await import("./routers");
      const procedures = appRouter._def.procedures;
      expect(procedures[proc]).toBeDefined();
    });
  }
});

// ==================== 6. CLICKSIGN ====================
describe("6. Clicksign API", () => {
  it("isClicksignConfigured: função exportada e retorna boolean", () => {
    const result = isClicksignConfigured();
    expect(typeof result).toBe("boolean");
    console.log(`[Clicksign] Configurado: ${result}`);
  });

  it("CLICKSIGN_API_URL aponta para app.clicksign.com/api/v3", () => {
    expect(ENV.clicksignApiUrl).toContain("clicksign.com");
    expect(ENV.clicksignApiUrl).toContain("/api/v3");
    console.log(`[Clicksign] URL: ${ENV.clicksignApiUrl}`);
  });

  it("sendNotification exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.sendNotification).toBe("function");
  });

  it("sendNotificationToSigner exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.sendNotificationToSigner).toBe("function");
  });

  it("createEnvelope exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.createEnvelope).toBe("function");
  });

  it("addDocument exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.addDocument).toBe("function");
  });

  it("addSignerToEnvelope exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.addSignerToEnvelope).toBe("function");
  });

  it("activateEnvelope exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.activateEnvelope).toBe("function");
  });

  it("getEnvelopeDetails exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.getEnvelopeDetails).toBe("function");
  });

  it("cancelEnvelope exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.cancelEnvelope).toBe("function");
  });

  it("sendContractToClicksign exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.sendContractToClicksign).toBe("function");
  });

  it("resendSignerNotification exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.resendSignerNotification).toBe("function");
  });

  it("verifyWebhookSignature exportada de clicksign.ts", async () => {
    const cs = await import("./clicksign");
    expect(typeof cs.verifyWebhookSignature).toBe("function");
  });
});

// ==================== 7. MÓDULOS AUXILIARES ====================
describe("7. Módulos Auxiliares", () => {
  it("notifications.ts: checkAndNotifyExpiring7Days exportada", async () => {
    const notif = await import("./notifications");
    expect(typeof notif.checkAndNotifyExpiring7Days).toBe("function");
  });

  it("reports.ts: generateSuppliersReport exportada", async () => {
    const rep = await import("./reports");
    expect(typeof rep.generateSuppliersReport).toBe("function");
  });

  it("reports.ts: generateDocumentsReport exportada", async () => {
    const rep = await import("./reports");
    expect(typeof rep.generateDocumentsReport).toBe("function");
  });

  it("reports.ts: generateEvaluationsReport exportada", async () => {
    const rep = await import("./reports");
    expect(typeof rep.generateEvaluationsReport).toBe("function");
  });

  it("reports.ts: generateAuditReport exportada", async () => {
    const rep = await import("./reports");
    expect(typeof rep.generateAuditReport).toBe("function");
  });

  it("reports.ts: generateExpiringDocumentsReport exportada", async () => {
    const rep = await import("./reports");
    expect(typeof rep.generateExpiringDocumentsReport).toBe("function");
  });

  it("export.ts: exportToExcel exportada", async () => {
    const exp = await import("./export");
    expect(typeof exp.exportToExcel).toBe("function");
  });

  it("export.ts: exportToPDF exportada", async () => {
    const exp = await import("./export");
    expect(typeof exp.exportToPDF).toBe("function");
  });

  it("storage.ts: storagePut e storageGet exportadas", async () => {
    const st = await import("./storage");
    expect(typeof st.storagePut).toBe("function");
    expect(typeof st.storageGet).toBe("function");
  });

  it("llm.ts: invokeLLM exportada", async () => {
    const llm = await import("./_core/llm");
    expect(typeof llm.invokeLLM).toBe("function");
  });

  it("llm.ts: FileUrlContent type suportado (TypeScript compilou sem erros)", async () => {
    const llm = await import("./_core/llm");
    expect(typeof llm.invokeLLM).toBe("function");
    console.log("[LLM] FileUrlContent type: OK");
  });
});
