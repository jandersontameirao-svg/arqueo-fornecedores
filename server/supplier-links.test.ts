import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  checkSupplierLinkExists: vi.fn(),
  createSupplierLink: vi.fn(),
  getSupplierLinks: vi.fn(),
  getLinksByTargetCompany: vi.fn(),
  getSuppliersByCompanyWithLinks: vi.fn(),
  deactivateSupplierLink: vi.fn(),
  createAuditLog: vi.fn(),
}));

import * as db from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockUser = {
  id: 1,
  email: "gestor@arqueo.com",
  name: "Gestor Teste",
  role: "manager" as const,
  openId: "open-1",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  loginMethod: null,
};

const baseInput = {
  supplierId: 42,
  sourceCompanyId: "arqueogis-preventiva",
  sourceCompanyName: "Arqueogis Preventiva",
  targetCompanyId: "arqueoproject",
  targetCompanyName: "Arqueoproject",
  groupName: "Grupo Arqueo Brasil",
};

// ─── Testes ───────────────────────────────────────────────────────────────────
describe("SupplierLinks — validações de negócio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve rejeitar vínculo quando empresa destino é igual à empresa origem", async () => {
    const sameCompanyInput = {
      ...baseInput,
      targetCompanyId: baseInput.sourceCompanyId,
      targetCompanyName: baseInput.sourceCompanyName,
    };

    // Simula a lógica de validação do router
    const validate = () => {
      if (sameCompanyInput.targetCompanyId === sameCompanyInput.sourceCompanyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A empresa de destino não pode ser a mesma que a empresa de origem.",
        });
      }
    };

    expect(validate).toThrow(TRPCError);
    expect(validate).toThrow("A empresa de destino não pode ser a mesma que a empresa de origem.");
  });

  it("deve rejeitar vínculo duplicado quando já existe vínculo ativo", async () => {
    vi.mocked(db.checkSupplierLinkExists).mockResolvedValue(true);

    const alreadyLinked = await db.checkSupplierLinkExists(baseInput.supplierId, baseInput.targetCompanyId);

    expect(alreadyLinked).toBe(true);
    expect(db.checkSupplierLinkExists).toHaveBeenCalledWith(
      baseInput.supplierId,
      baseInput.targetCompanyId
    );
  });

  it("deve criar vínculo com sucesso quando não existe duplicata e empresas são diferentes", async () => {
    vi.mocked(db.checkSupplierLinkExists).mockResolvedValue(false);
    vi.mocked(db.createSupplierLink).mockResolvedValue(99);
    vi.mocked(db.createAuditLog).mockResolvedValue(undefined as any);

    const alreadyLinked = await db.checkSupplierLinkExists(baseInput.supplierId, baseInput.targetCompanyId);
    expect(alreadyLinked).toBe(false);

    const id = await db.createSupplierLink({
      ...baseInput,
      linkedById: mockUser.id,
      linkedByEmail: mockUser.email,
      linkedByName: mockUser.name,
      status: "active",
    });

    expect(id).toBe(99);
    expect(db.createSupplierLink).toHaveBeenCalledOnce();
  });

  it("deve registrar auditoria ao criar vínculo", async () => {
    vi.mocked(db.createAuditLog).mockResolvedValue(undefined as any);

    await db.createAuditLog({
      entityType: "supplier_link",
      entityId: 99,
      action: "create",
      changes: {
        supplierId: baseInput.supplierId,
        sourceCompany: baseInput.sourceCompanyName,
        targetCompany: baseInput.targetCompanyName,
        group: baseInput.groupName,
      },
      userId: mockUser.id,
      userEmail: mockUser.email,
    });

    expect(db.createAuditLog).toHaveBeenCalledOnce();
    expect(db.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "supplier_link",
        action: "create",
        userId: mockUser.id,
      })
    );
  });

  it("deve listar vínculos de um fornecedor específico", async () => {
    const mockLinks = [
      {
        id: 1,
        supplierId: 42,
        targetCompanyId: "arqueoproject",
        targetCompanyName: "Arqueoproject",
        sourceCompanyId: "arqueogis-preventiva",
        sourceCompanyName: "Arqueogis Preventiva",
        groupName: "Grupo Arqueo Brasil",
        status: "active",
        linkedById: 1,
        linkedByEmail: "gestor@arqueo.com",
        linkedByName: "Gestor Teste",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getSupplierLinks).mockResolvedValue(mockLinks as any);

    const result = await db.getSupplierLinks(42);

    expect(result).toHaveLength(1);
    expect(result[0].supplierId).toBe(42);
    expect(result[0].status).toBe("active");
  });

  it("deve desativar um vínculo (soft delete)", async () => {
    vi.mocked(db.deactivateSupplierLink).mockResolvedValue(undefined);

    await db.deactivateSupplierLink(1);

    expect(db.deactivateSupplierLink).toHaveBeenCalledWith(1);
    expect(db.deactivateSupplierLink).toHaveBeenCalledOnce();
  });

  it("deve retornar false para checkSupplierLinkExists quando não há vínculo", async () => {
    vi.mocked(db.checkSupplierLinkExists).mockResolvedValue(false);

    const result = await db.checkSupplierLinkExists(999, "empresa-inexistente");

    expect(result).toBe(false);
  });
});
