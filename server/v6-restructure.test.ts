import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Reestruturação v6.0 — Base Geral + Vínculos + Busca Global", () => {
  describe("Router supplierCompanyLinks", () => {
    it("deve ter a procedure getBySupplier", () => {
      expect(appRouter.supplierCompanyLinks.getBySupplier).toBeDefined();
    });

    it("deve ter a procedure getByCompany", () => {
      expect(appRouter.supplierCompanyLinks.getByCompany).toBeDefined();
    });

    it("deve ter a procedure getByBusinessUnit", () => {
      expect(appRouter.supplierCompanyLinks.getByBusinessUnit).toBeDefined();
    });

    it("deve ter a procedure create", () => {
      expect(appRouter.supplierCompanyLinks.create).toBeDefined();
    });

    it("deve ter a procedure update", () => {
      expect(appRouter.supplierCompanyLinks.update).toBeDefined();
    });

    it("deve ter a procedure deactivate", () => {
      expect(appRouter.supplierCompanyLinks.deactivate).toBeDefined();
    });
  });

  describe("Router baseGeral", () => {
    it("deve ter a procedure findByCnpj", () => {
      expect(appRouter.baseGeral.findByCnpj).toBeDefined();
    });

    it("deve ter a procedure list", () => {
      expect(appRouter.baseGeral.list).toBeDefined();
    });
  });

  describe("Router globalSearch", () => {
    it("deve ter a procedure search", () => {
      expect(appRouter.globalSearch.search).toBeDefined();
    });
  });

  describe("Router aiExtraction", () => {
    it("deve ter a procedure extractSupplierData", () => {
      expect(appRouter.aiExtraction.extractSupplierData).toBeDefined();
    });
  });

  describe("Funções de banco de dados", () => {
    it("deve exportar getSupplierCompanyLinks", async () => {
      const db = await import("./db");
      expect(typeof db.getSupplierCompanyLinks).toBe("function");
    });

    it("deve exportar createSupplierCompanyLink", async () => {
      const db = await import("./db");
      expect(typeof db.createSupplierCompanyLink).toBe("function");
    });

    it("deve exportar updateSupplierCompanyLink", async () => {
      const db = await import("./db");
      expect(typeof db.updateSupplierCompanyLink).toBe("function");
    });

    it("deve exportar deleteSupplierCompanyLink", async () => {
      const db = await import("./db");
      expect(typeof db.deleteSupplierCompanyLink).toBe("function");
    });

    it("deve exportar getSuppliersByCompanyLink", async () => {
      const db = await import("./db");
      expect(typeof db.getSuppliersByCompanyLink).toBe("function");
    });

    it("deve exportar getSuppliersByBusinessUnit", async () => {
      const db = await import("./db");
      expect(typeof db.getSuppliersByBusinessUnit).toBe("function");
    });

    it("deve exportar checkSupplierCompanyLinkExists", async () => {
      const db = await import("./db");
      expect(typeof db.checkSupplierCompanyLinkExists).toBe("function");
    });

    it("deve exportar findSupplierByCnpj", async () => {
      const db = await import("./db");
      expect(typeof db.findSupplierByCnpj).toBe("function");
    });

    it("deve exportar getAllSuppliersBaseGeral", async () => {
      const db = await import("./db");
      expect(typeof db.getAllSuppliersBaseGeral).toBe("function");
    });

    it("deve exportar globalSearch", async () => {
      const db = await import("./db");
      expect(typeof db.globalSearch).toBe("function");
    });
  });
});
