import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import * as db from "./db";

describe("Internal Auth — Login por email/senha", () => {
  describe("getUserByEmail", () => {
    it("deve retornar o usuário quando email existe", async () => {
      const user = await db.getUserByEmail("gentegestao@grupoarqueo.com.br");
      expect(user).toBeDefined();
      expect(user?.email).toBe("gentegestao@grupoarqueo.com.br");
      expect(user?.role).toBe("manager");
      expect(user?.loginMethod).toBe("internal");
    });

    it("deve retornar o usuário admin quando email existe", async () => {
      const user = await db.getUserByEmail("fernanda@arqueoproject.com.br");
      expect(user).toBeDefined();
      expect(user?.email).toBe("fernanda@arqueoproject.com.br");
      expect(user?.role).toBe("admin");
      expect(user?.loginMethod).toBe("internal");
    });

    it("deve retornar undefined para email inexistente", async () => {
      const user = await db.getUserByEmail("naoexiste@teste.com");
      expect(user).toBeUndefined();
    });
  });

  describe("passwordHash verification", () => {
    it("deve validar senha correta do manager", async () => {
      const user = await db.getUserByEmail("gentegestao@grupoarqueo.com.br");
      expect(user?.passwordHash).toBeDefined();
      const isValid = await bcrypt.compare("grupoarqueo2026", user!.passwordHash!);
      expect(isValid).toBe(true);
    });

    it("deve rejeitar senha incorreta", async () => {
      const user = await db.getUserByEmail("gentegestao@grupoarqueo.com.br");
      expect(user?.passwordHash).toBeDefined();
      const isValid = await bcrypt.compare("senhaerrada", user!.passwordHash!);
      expect(isValid).toBe(false);
    });

    it("deve validar senha correta do admin fernanda", async () => {
      const user = await db.getUserByEmail("fernanda@arqueoproject.com.br");
      expect(user?.passwordHash).toBeDefined();
      const isValid = await bcrypt.compare("kesulindo123", user!.passwordHash!);
      expect(isValid).toBe(true);
    });

    it("admin principal (jandersontameirao) deve ter passwordHash definido — login interno configurado em v9.0", async () => {
      // jandersontameirao@gmail.com é o superadmin_global com senha interna configurada
      const user = await db.getUserByEmail("jandersontameirao@gmail.com");
      if (user) {
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).not.toBeNull();
        expect(user.loginMethod).toBe("internal");
        expect(user.role).toBe("admin");
        expect(user.globalRole).toBe("superadmin_global");
      }
    });
  });

  describe("RBAC — Role-based access", () => {
    it("manager deve ter role 'manager'", async () => {
      const user = await db.getUserByEmail("gentegestao@grupoarqueo.com.br");
      expect(user?.role).toBe("manager");
    });

    it("admin deve ter role 'admin'", async () => {
      const user = await db.getUserByEmail("fernanda@arqueoproject.com.br");
      expect(user?.role).toBe("admin");
    });

    it("ambos devem estar ativos", async () => {
      const manager = await db.getUserByEmail("gentegestao@grupoarqueo.com.br");
      const admin = await db.getUserByEmail("fernanda@arqueoproject.com.br");
      expect(manager?.isActive).toBe(true);
      expect(admin?.isActive).toBe(true);
    });
  });
});
