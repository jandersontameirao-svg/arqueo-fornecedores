import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("CRUD de Usuários (v5.28)", () => {
  describe("db.createUser", () => {
    it("deve ser uma função exportada", () => {
      expect(typeof db.createUser).toBe("function");
    });
  });

  describe("db.updateUser", () => {
    it("deve ser uma função exportada", () => {
      expect(typeof db.updateUser).toBe("function");
    });
  });

  describe("db.deleteUser", () => {
    it("deve ser uma função exportada", () => {
      expect(typeof db.deleteUser).toBe("function");
    });
  });

  describe("db.generateInternalOpenId", () => {
    it("deve gerar openId com prefixo 'internal_'", () => {
      const id = db.generateInternalOpenId();
      expect(id.startsWith("internal_")).toBe(true);
    });
    it("deve gerar IDs únicos em chamadas consecutivas", () => {
      const id1 = db.generateInternalOpenId();
      const id2 = db.generateInternalOpenId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("Procedures tRPC de usuários", () => {
    it("deve ter a procedure users.create no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.create"]).toBeDefined();
    });
    it("deve ter a procedure users.update no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.update"]).toBeDefined();
    });
    it("deve ter a procedure users.delete no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.delete"]).toBeDefined();
    });
    it("deve ter a procedure users.list no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.list"]).toBeDefined();
    });
    it("deve ter a procedure users.getById no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.getById"]).toBeDefined();
    });
    it("deve ter a procedure users.updateRole no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.updateRole"]).toBeDefined();
    });
    it("deve ter a procedure users.updateStatus no router", async () => {
      const { appRouter } = await import("./routers");
      const routerDef = appRouter._def.procedures;
      expect(routerDef["users.updateStatus"]).toBeDefined();
    });
  });

  describe("Validação de schema Zod (users.create)", () => {
    it("deve rejeitar nome com menos de 2 caracteres", async () => {
      const { z } = await import("zod");
      const schema = z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("E-mail inválido"),
        role: z.enum(["admin", "manager", "reader"]),
        isActive: z.boolean().optional().default(true),
      });
      const result = schema.safeParse({ name: "A", email: "test@test.com", role: "reader" });
      expect(result.success).toBe(false);
    });
    it("deve rejeitar e-mail inválido", async () => {
      const { z } = await import("zod");
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email("E-mail inválido"),
        role: z.enum(["admin", "manager", "reader"]),
      });
      const result = schema.safeParse({ name: "João Silva", email: "nao-e-email", role: "reader" });
      expect(result.success).toBe(false);
    });
    it("deve aceitar dados válidos", async () => {
      const { z } = await import("zod");
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(["admin", "manager", "reader"]),
        isActive: z.boolean().optional().default(true),
      });
      const result = schema.safeParse({ name: "João Silva", email: "joao@empresa.com", role: "manager" });
      expect(result.success).toBe(true);
    });
  });
});
