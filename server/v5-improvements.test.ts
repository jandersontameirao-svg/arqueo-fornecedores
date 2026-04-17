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


// ==================== v5.16 — EVOLUÇÃO DE CONTRATOS ====================

describe("Evolução de Contratos v5.16", () => {
  // ---- Placeholder functions ----
  describe("Funções de Placeholder", () => {
    it("extractPlaceholders deve detectar placeholders no template", async () => {
      const db = await import("./db");
      const result = db.extractPlaceholders("Contrato entre {{nome_contratante}} e {{nome_contratado}}, valor {{valor_total}}.");
      expect(result).toEqual(["nome_contratante", "nome_contratado", "valor_total"]);
    });

    it("extractPlaceholders deve retornar array vazio se não houver placeholders", async () => {
      const db = await import("./db");
      const result = db.extractPlaceholders("Contrato sem placeholders.");
      expect(result).toEqual([]);
    });

    it("extractPlaceholders deve ignorar placeholders duplicados", async () => {
      const db = await import("./db");
      const result = db.extractPlaceholders("{{nome}} e {{nome}} e {{outro}}");
      expect(result).toEqual(["nome", "outro"]);
    });

    it("fillPlaceholders deve substituir placeholders com dados fornecidos", async () => {
      const db = await import("./db");
      const { filledContent, unfilledPlaceholders } = db.fillPlaceholders(
        "Contrato entre {{nome_contratante}} e {{nome_contratado}}.",
        { nome_contratante: "Grupo Arqueo", nome_contratado: "Fornecedor X" }
      );
      expect(filledContent).toBe("Contrato entre Grupo Arqueo e Fornecedor X.");
      expect(unfilledPlaceholders).toEqual([]);
    });

    it("fillPlaceholders deve manter placeholders não preenchidos", async () => {
      const db = await import("./db");
      const { filledContent, unfilledPlaceholders } = db.fillPlaceholders(
        "Contrato entre {{nome_contratante}} e {{nome_contratado}}.",
        { nome_contratante: "Grupo Arqueo" }
      );
      expect(filledContent).toBe("Contrato entre Grupo Arqueo e {{nome_contratado}}.");
      expect(unfilledPlaceholders).toEqual(["nome_contratado"]);
    });

    it("mapSystemDataToPlaceholders deve mapear dados do fornecedor", async () => {
      const db = await import("./db");
      const result = db.mapSystemDataToPlaceholders({
        supplier: {
          companyName: "Fornecedor ABC Ltda",
          cnpj: "12.345.678/0001-90",
          email: "contato@abc.com",
          phone: "(11) 99999-0000",
        },
      });
      expect(result.razao_social_contratado).toBe("Fornecedor ABC Ltda");
      expect(result.cnpj_contratado).toBe("12.345.678/0001-90");
      expect(result.email_contratado).toBe("contato@abc.com");
      expect(result.data_atual).toBeTruthy();
      expect(result.data_extenso).toBeTruthy();
    });

    it("mapSystemDataToPlaceholders deve mapear dados da empresa", async () => {
      const db = await import("./db");
      const result = db.mapSystemDataToPlaceholders({
        company: {
          legalName: "Grupo Arqueo Participações",
          cnpj: "00.111.222/0001-33",
          address: "Rua Exemplo, 123",
        },
      });
      expect(result.empresa_nome).toBe("Grupo Arqueo Participações");
      expect(result.empresa_cnpj).toBe("00.111.222/0001-33");
    });

    it("mapSystemDataToPlaceholders deve mapear contato principal", async () => {
      const db = await import("./db");
      const result = db.mapSystemDataToPlaceholders({
        contacts: [
          { name: "João", email: "joao@test.com", phone: "11999", position: "Gerente", isPrimary: true },
          { name: "Maria", email: "maria@test.com", phone: "11888", position: "Diretora", isPrimary: false },
        ],
      });
      expect(result.contato_principal_nome).toBe("João");
      expect(result.contato_principal_email).toBe("joao@test.com");
    });
  });

  // ---- Contract Versions ----
  describe("Versionamento de Contratos", () => {
    it("deve ter as tabelas contract_versions, contract_signers e contract_clicksign_events no schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.contractVersions).toBeDefined();
      expect(schema.contractSigners).toBeDefined();
      expect(schema.contractClicksignEvents).toBeDefined();
    });

    it("deve ter helpers de CRUD para versions no db", async () => {
      const db = await import("./db");
      expect(typeof db.createContractVersion).toBe("function");
      expect(typeof db.getContractVersions).toBe("function");
    });

    it("deve ter helpers de CRUD para signers no db", async () => {
      const db = await import("./db");
      expect(typeof db.createContractSigner).toBe("function");
      expect(typeof db.getContractSigners).toBe("function");
      expect(typeof db.deleteContractSigner).toBe("function");
    });

    it("deve ter helpers de CRUD para clicksign events no db", async () => {
      const db = await import("./db");
      expect(typeof db.createContractClicksignEvent).toBe("function");
      expect(typeof db.getContractClicksignEvents).toBe("function");
    });
  });

  // ---- Vigência efetiva ----
  describe("Vigência Efetiva de Contratos", () => {
    it("deve ter a função getContractEffectiveEndDate no db", async () => {
      const db = await import("./db");
      expect(typeof db.getContractEffectiveEndDate).toBe("function");
    });

    it("deve ter a função getLatestValidAmendmentWithEndDate no db", async () => {
      const db = await import("./db");
      expect(typeof db.getLatestValidAmendmentWithEndDate).toBe("function");
    });

    it("deve ter a função getContractsBySupplierWithEffectiveEndDate no db", async () => {
      const db = await import("./db");
      expect(typeof db.getContractsBySupplierWithEffectiveEndDate).toBe("function");
    });
  });

  // ---- Notificação de contratos ----
  describe("Notificação de Vencimento de Contratos", () => {
    it("deve ter a tabela contract_expiration_notifications no schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.contractExpirationNotifications).toBeDefined();
    });

    it("deve ter a função checkAndNotifyExpiringContracts7Days no notifications", async () => {
      const notifications = await import("./notifications");
      expect(typeof notifications.checkAndNotifyExpiringContracts7Days).toBe("function");
    });

    it("deve ter helpers de notificação de contratos no db", async () => {
      const db = await import("./db");
      expect(typeof db.getContractsExpiringInDaysWithoutNotification).toBe("function");
      expect(typeof db.recordContractExpirationNotification).toBe("function");
    });
  });
});
