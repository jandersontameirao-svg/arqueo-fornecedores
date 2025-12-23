import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the database module
vi.mock("./db", () => ({
  getExpiringDocuments: vi.fn().mockResolvedValue([
    {
      document: {
        id: 1,
        name: "Contrato de Serviços",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      supplier: {
        id: 1,
        companyName: "Fornecedor Teste",
      },
    },
  ]),
}));

import {
  notifyDocumentExpiring,
  notifyDocumentExpired,
  notifyApprovalPending,
  notifyNewSupplierRegistration,
  notifyComplianceAlert,
  checkAndNotifyExpiringDocuments,
} from "./notifications";

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifyDocumentExpiring", () => {
    it("sends notification for expiring document", async () => {
      const result = await notifyDocumentExpiring(
        "Fornecedor Teste",
        "Contrato de Serviços",
        new Date("2025-01-15"),
        7
      );

      expect(result).toBe(true);
    });
  });

  describe("notifyDocumentExpired", () => {
    it("sends notification for expired document", async () => {
      const result = await notifyDocumentExpired(
        "Fornecedor Teste",
        "Certidão Negativa",
        new Date("2024-12-20")
      );

      expect(result).toBe(true);
    });
  });

  describe("notifyApprovalPending", () => {
    it("sends notification for pending approval", async () => {
      const result = await notifyApprovalPending(
        "Fornecedor Teste",
        "Verificação de Documentos",
        1
      );

      expect(result).toBe(true);
    });
  });

  describe("notifyNewSupplierRegistration", () => {
    it("sends notification for new supplier registration", async () => {
      const result = await notifyNewSupplierRegistration(
        "Nova Empresa LTDA",
        "12.345.678/0001-90"
      );

      expect(result).toBe(true);
    });
  });

  describe("notifyComplianceAlert", () => {
    it("sends notification for compliance alert with low severity", async () => {
      const result = await notifyComplianceAlert(
        "Documento pendente",
        "Fornecedor Teste",
        "low"
      );

      expect(result).toBe(true);
    });

    it("sends notification for compliance alert with critical severity", async () => {
      const result = await notifyComplianceAlert(
        "Fornecedor bloqueado",
        "Fornecedor Teste",
        "critical",
        "Fornecedor com pendências graves"
      );

      expect(result).toBe(true);
    });
  });

  describe("checkAndNotifyExpiringDocuments", () => {
    it("checks and notifies for expiring documents", async () => {
      const result = await checkAndNotifyExpiringDocuments();

      expect(result).toBeDefined();
      expect(result.checked).toBeGreaterThanOrEqual(0);
      expect(result.notified).toBeGreaterThanOrEqual(0);
    });
  });
});
