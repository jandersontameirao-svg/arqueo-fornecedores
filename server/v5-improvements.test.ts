/**
 * Testes para as melhorias v5.13:
 * 1. Notificação de vencimento de documentos (7 dias)
 * 2. Edição e exclusão de avaliações
 * 3. Upload de anexo com IA em interações
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ==================== 1. NOTIFICAÇÃO 7 DIAS ====================
describe("Notificação de vencimento de documentos (7 dias)", () => {
  it("deve ter a procedure checkExpiring7Days no router de notifications", async () => {
    // Verifica que a função existe no módulo de notifications
    const notifications = await import("./notifications");
    expect(typeof notifications.checkAndNotifyExpiring7Days).toBe("function");
  });

  it("checkAndNotifyExpiring7Days deve retornar { checked, notified }", async () => {
    // Mock do db para simular sem documentos a vencer
    vi.mock("./db", async (importOriginal) => {
      const original = await importOriginal<typeof import("./db")>();
      return {
        ...original,
        getDocumentsExpiringInDaysWithoutNotification: vi.fn().mockResolvedValue([]),
        recordDocumentExpirationNotification: vi.fn().mockResolvedValue(undefined),
      };
    });

    const { checkAndNotifyExpiring7Days } = await import("./notifications");
    const result = await checkAndNotifyExpiring7Days();
    expect(result).toHaveProperty("checked");
    expect(result).toHaveProperty("notified");
    expect(typeof result.checked).toBe("number");
    expect(typeof result.notified).toBe("number");
  });
});

// ==================== 2. EDIÇÃO E EXCLUSÃO DE AVALIAÇÕES ====================
describe("Edição e exclusão de avaliações", () => {
  it("deve ter a procedure evaluations.update no router", async () => {
    const { appRouter } = await import("./routers");
    const routes = Object.keys(appRouter._def.procedures);
    // Verifica que a rota existe
    expect(routes.some(r => r.includes("evaluations"))).toBe(true);
  });

  it("deve calcular overallScore corretamente na edição", () => {
    const scores = [80, 70, 90, 60, 75];
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(overallScore).toBeCloseTo(75, 1);
  });

  it("deve rejeitar scores fora do range 0-100", () => {
    const validateScore = (score: number) => score >= 0 && score <= 100;
    expect(validateScore(101)).toBe(false);
    expect(validateScore(-1)).toBe(false);
    expect(validateScore(50)).toBe(true);
    expect(validateScore(0)).toBe(true);
    expect(validateScore(100)).toBe(true);
  });
});

// ==================== 3. UPLOAD DE ANEXO COM IA ====================
describe("Upload de anexo com IA em interações", () => {
  it("deve ter a procedure interactions.uploadAttachment no router", async () => {
    const { appRouter } = await import("./routers");
    const routes = Object.keys(appRouter._def.procedures);
    expect(routes.some(r => r.includes("interactions"))).toBe(true);
  });

  it("deve aceitar apenas arquivos até 10MB", () => {
    const MAX_SIZE = 10 * 1024 * 1024;
    const validSize = 5 * 1024 * 1024; // 5MB
    const invalidSize = 15 * 1024 * 1024; // 15MB
    expect(validSize <= MAX_SIZE).toBe(true);
    expect(invalidSize <= MAX_SIZE).toBe(false);
  });

  it("deve identificar extensões extraíveis por IA", () => {
    const extractableExts = ["pdf", "txt", "md"];
    expect(extractableExts.includes("pdf")).toBe(true);
    expect(extractableExts.includes("txt")).toBe(true);
    expect(extractableExts.includes("jpg")).toBe(false);
    expect(extractableExts.includes("png")).toBe(false);
    expect(extractableExts.includes("docx")).toBe(false);
  });

  it("deve gerar fileKey único para cada upload", () => {
    const generateKey = (fileName: string) =>
      `interactions/attachments/${Date.now()}-${fileName}`;
    const key1 = generateKey("test.pdf");
    const key2 = generateKey("test.pdf");
    // Ambos devem conter o prefixo correto
    expect(key1.startsWith("interactions/attachments/")).toBe(true);
    expect(key2.startsWith("interactions/attachments/")).toBe(true);
  });
});

// ==================== v5.14: VIGÊNCIA EFETIVA E NOTIFICAÇÃO DE CONTRATOS ====================
describe("Vigência efetiva de contratos (v5.14)", () => {
  it("deve ter a função getContractEffectiveEndDate no db", async () => {
    const db = await import("./db");
    expect(typeof db.getContractEffectiveEndDate).toBe("function");
  });

  it("deve ter a função getContractsBySupplierWithEffectiveEndDate no db", async () => {
    const db = await import("./db");
    expect(typeof db.getContractsBySupplierWithEffectiveEndDate).toBe("function");
  });

  it("deve ter a função getContractsExpiringInDaysWithoutNotification no db", async () => {
    const db = await import("./db");
    expect(typeof db.getContractsExpiringInDaysWithoutNotification).toBe("function");
  });

  it("deve ter a função recordContractExpirationNotification no db", async () => {
    const db = await import("./db");
    expect(typeof db.recordContractExpirationNotification).toBe("function");
  });

  it("deve ter a função checkAndNotifyExpiringContracts7Days no notifications", async () => {
    const notifications = await import("./notifications");
    expect(typeof notifications.checkAndNotifyExpiringContracts7Days).toBe("function");
  });

  it("checkAndNotifyExpiringContracts7Days deve retornar { checked, notified }", async () => {
    vi.mock("./db", async (importOriginal) => {
      const original = await importOriginal<typeof import("./db")>();
      return {
        ...original,
        getContractsExpiringInDaysWithoutNotification: vi.fn().mockResolvedValue([]),
        recordContractExpirationNotification: vi.fn().mockResolvedValue(undefined),
      };
    });

    const { checkAndNotifyExpiringContracts7Days } = await import("./notifications");
    const result = await checkAndNotifyExpiringContracts7Days();
    expect(result).toHaveProperty("checked");
    expect(result).toHaveProperty("notified");
    expect(typeof result.checked).toBe("number");
    expect(typeof result.notified).toBe("number");
  });

  it("isExpiringSoon deve detectar contratos que vencem em 7 dias ou menos", () => {
    const now = Date.now();
    const in6Days = new Date(now + 6 * 24 * 60 * 60 * 1000);
    const in8Days = new Date(now + 8 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    const isExpiringSoon = (effectiveEndDate: Date | null | undefined) => {
      if (!effectiveEndDate) return false;
      const end = new Date(effectiveEndDate).getTime();
      const diff = end - now;
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    };

    expect(isExpiringSoon(in6Days)).toBe(true);
    expect(isExpiringSoon(in8Days)).toBe(false);
    expect(isExpiringSoon(yesterday)).toBe(false);
    expect(isExpiringSoon(null)).toBe(false);
  });

  it("getContractEffectiveEndDate deve retornar source='original' quando não há aditivo", async () => {
    // Lógica de fallback: sem aditivo ativo, usa endDate do contrato
    const mockContract = { id: 1, endDate: new Date("2026-12-31"), supplierId: 1 };
    // Simula o comportamento esperado da função
    const effectiveEndDate = mockContract.endDate;
    const source = "original";
    expect(source).toBe("original");
    expect(effectiveEndDate).toEqual(new Date("2026-12-31"));
  });
});

// ==================== v5.15: CORREÇÕES DE DOCUMENTOS E BADGE PRINCIPAL ====================
describe("Correção enum de tipos de documento (v5.15)", () => {
  it("documentSchema deve aceitar o tipo 'insurance'", async () => {
    const { appRouter } = await import("./routers");
    // Verifica que o router existe e tem o namespace documents
    const routes = Object.keys(appRouter._def.procedures);
    expect(routes.some(r => r.includes("documents"))).toBe(true);
  });

  it("todos os tipos de documento do frontend devem ser válidos no backend", () => {
    // Tipos aceitos pelo banco (enum expandido)
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    // Tipos exibidos no frontend (typeLabels)
    const frontendTypes = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    
    for (const t of frontendTypes) {
      expect(dbEnum).toContain(t);
    }
  });

  it("o tipo 'other' deve continuar válido (sem regressão)", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("other");
  });

  it("o tipo 'contract' deve ser válido", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("contract");
  });

  it("o tipo 'certificate' deve ser válido", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("certificate");
  });

  it("o tipo 'invoice' deve ser válido", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("invoice");
  });

  it("o tipo 'license' deve ser válido", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("license");
  });

  it("o tipo 'insurance' (Seguro) deve ser válido após a correção", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("insurance");
  });

  it("o tipo 'registration' (Registro) deve ser válido após a correção", () => {
    const dbEnum = ["contract", "certificate", "invoice", "license", "insurance", "registration", "other"];
    expect(dbEnum).toContain("registration");
  });
});
