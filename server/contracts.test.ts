import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getContractsBySupplier: vi.fn().mockResolvedValue([]),
  getContractById: vi.fn().mockResolvedValue(null),
  createContract: vi.fn().mockResolvedValue(1),
  updateContract: vi.fn().mockResolvedValue(undefined),
  deleteContract: vi.fn().mockResolvedValue(undefined),
  getContractItems: vi.fn().mockResolvedValue([]),
  createContractItem: vi.fn().mockResolvedValue(1),
  deleteContractItems: vi.fn().mockResolvedValue(undefined),
  getContractTemplates: vi.fn().mockResolvedValue([]),
  createContractTemplate: vi.fn().mockResolvedValue(1),
}));

import * as db from "./db";

describe("Contract DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getContractsBySupplier returns empty array when no contracts", async () => {
    const result = await db.getContractsBySupplier(1);
    expect(result).toEqual([]);
    expect(db.getContractsBySupplier).toHaveBeenCalledWith(1);
  });

  it("getContractById returns null when contract not found", async () => {
    const result = await db.getContractById(999);
    expect(result).toBeNull();
  });

  it("createContract returns new id", async () => {
    const id = await db.createContract({
      supplierId: 1,
      title: "Contrato de Teste",
      creationMode: "manual",
      status: "draft",
    } as any);
    expect(id).toBe(1);
  });

  it("updateContract calls with correct params", async () => {
    await db.updateContract(1, { title: "Novo Título" });
    expect(db.updateContract).toHaveBeenCalledWith(1, { title: "Novo Título" });
  });

  it("deleteContract calls with correct id", async () => {
    await db.deleteContract(1);
    expect(db.deleteContract).toHaveBeenCalledWith(1);
  });

  it("getContractTemplates returns empty array when no templates", async () => {
    const result = await db.getContractTemplates();
    expect(result).toEqual([]);
  });

  it("createContractTemplate returns new id", async () => {
    const id = await db.createContractTemplate({
      name: "Template Padrão",
      content: "Conteúdo do template",
      contractType: "service",
    } as any);
    expect(id).toBe(1);
  });
});
