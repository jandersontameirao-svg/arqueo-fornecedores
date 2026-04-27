import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createManagerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-manager",
    email: "manager@example.com",
    name: "Test Manager",
    loginMethod: "manus",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user",
    email: "user@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createAnonContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("suppliers.extractFromDocs", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.extractFromDocs({
        files: [{ base64: "dGVzdA==", fileName: "test.txt", mimeType: "text/plain" }],
      })
    ).rejects.toThrow();
  });

  it("rejects regular users (requires manager role)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.extractFromDocs({
        files: [{ base64: "dGVzdA==", fileName: "test.txt", mimeType: "text/plain" }],
      })
    ).rejects.toThrow(/restrito/i);
  });

  it("validates input requires at least one file", async () => {
    const { ctx } = createManagerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.extractFromDocs({
        files: [],
      })
    ).rejects.toThrow();
  });
});

describe("suppliers.saveViaAI", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.saveViaAI({
        supplierData: {
          companyName: "Test Corp",
          cnpj: "12345678000199",
          email: "test@test.com",
        },
        extractionRunId: 1,
        uploadedFiles: [],
      })
    ).rejects.toThrow();
  });

  it("rejects regular users (requires manager role)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.saveViaAI({
        supplierData: {
          companyName: "Test Corp",
          cnpj: "12345678000199",
          email: "test@test.com",
        },
        extractionRunId: 1,
        uploadedFiles: [],
      })
    ).rejects.toThrow(/restrito/i);
  });

  it("validates required fields in supplierData", async () => {
    const { ctx } = createManagerContext();
    const caller = appRouter.createCaller(ctx);

    // Missing companyName
    await expect(
      caller.suppliers.saveViaAI({
        supplierData: {
          companyName: "",
          cnpj: "12345678000199",
          email: "test@test.com",
        },
        extractionRunId: 1,
        uploadedFiles: [],
      })
    ).rejects.toThrow();

    // Missing cnpj
    await expect(
      caller.suppliers.saveViaAI({
        supplierData: {
          companyName: "Test Corp",
          cnpj: "",
          email: "test@test.com",
        },
        extractionRunId: 1,
        uploadedFiles: [],
      })
    ).rejects.toThrow();

    // Invalid email
    await expect(
      caller.suppliers.saveViaAI({
        supplierData: {
          companyName: "Test Corp",
          cnpj: "12345678000199",
          email: "invalid",
        },
        extractionRunId: 1,
        uploadedFiles: [],
      })
    ).rejects.toThrow();
  });
});

describe("suppliers.uploadDocsForExtraction", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.uploadDocsForExtraction({
        files: [{ base64: "dGVzdA==", fileName: "test.pdf", mimeType: "application/pdf", fileSize: 100 }],
      })
    ).rejects.toThrow();
  });

  it("rejects regular users (requires manager role)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suppliers.uploadDocsForExtraction({
        files: [{ base64: "dGVzdA==", fileName: "test.pdf", mimeType: "application/pdf", fileSize: 100 }],
      })
    ).rejects.toThrow(/restrito/i);
  });
});

describe("buildExtractedFields (via extraction constants)", () => {
  it("SUPPLIER_EXTRACTION constants are properly defined", () => {
    // Verify the router has the expected procedures
    const supplierRouter = appRouter._def.procedures;
    expect(supplierRouter).toBeDefined();
    
    // Check that suppliers procedures exist
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("suppliers.extractFromDocs");
    expect(procedures).toContain("suppliers.saveViaAI");
    expect(procedures).toContain("suppliers.uploadDocsForExtraction");
  });
});
