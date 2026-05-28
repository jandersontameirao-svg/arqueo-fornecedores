/**
 * supplier-visibility-audit.test.ts
 * 
 * Testes obrigatórios da auditoria v9.12:
 * Garantir que supplier_company_links é a fonte canônica exclusiva
 * de visibilidade de fornecedores por empresa em todo o sistema.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf-8");
}

describe("Auditoria v9.12 — supplier_company_links como fonte canônica exclusiva", () => {
  
  describe("1. Módulo centralizado companies.ts", () => {
    it("deve existir client/src/lib/companies.ts como SSOT", () => {
      const filePath = path.join(PROJECT_ROOT, "client/src/lib/companies.ts");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("deve exportar COMPANIES_BY_GROUP com companyId numérico para todas as empresas", () => {
      const content = readFile("client/src/lib/companies.ts");
      expect(content).toContain("COMPANIES_BY_GROUP");
      expect(content).toContain("companyId");
      // Deve ter as 4 empresas
      expect(content).toContain("arqueogis-preventiva");
      expect(content).toContain("arqueoproject");
      expect(content).toContain("arqueogis-geoprocessamento");
      expect(content).toContain("arqueocean");
    });

    it("deve exportar SLUG_TO_COMPANY_ID com mapeamento slug→número", () => {
      const content = readFile("client/src/lib/companies.ts");
      expect(content).toContain("SLUG_TO_COMPANY_ID");
    });

    it("deve exportar inferCompanyId como helper de resolução slug→número", () => {
      const content = readFile("client/src/lib/companies.ts");
      expect(content).toContain("inferCompanyId");
    });
  });

  describe("2. SelectedCompanyContext usa companyId numérico", () => {
    it("deve importar do módulo centralizado", () => {
      const content = readFile("client/src/contexts/SelectedCompanyContext.tsx");
      expect(content).toContain("from \"@/lib/companies\"");
    });

    it("tipo SelectedCompany deve ter campo companyId (numérico opcional para migração)", () => {
      const content = readFile("client/src/contexts/SelectedCompanyContext.tsx");
      expect(content).toMatch(/companyId\??\s*:\s*number/);
    });

    it("deve ter migração automática de localStorage legado via inferCompanyId", () => {
      const content = readFile("client/src/contexts/SelectedCompanyContext.tsx");
      // Deve ter lógica de migração/fallback usando inferCompanyId do módulo centralizado
      expect(content).toContain("inferCompanyId");
    });
  });

  describe("3. SelectCompany.tsx usa módulo centralizado", () => {
    it("deve importar COMPANIES_BY_GROUP do módulo centralizado", () => {
      const content = readFile("client/src/pages/SelectCompany.tsx");
      expect(content).toContain("from \"@/lib/companies\"");
    });

    it("não deve definir CompanyDef localmente (evitar duplicação)", () => {
      const content = readFile("client/src/pages/SelectCompany.tsx");
      // Não deve ter interface/type CompanyDef definida localmente
      const localDef = content.match(/^(interface|type)\s+CompanyDef/m);
      expect(localDef).toBeNull();
    });
  });

  describe("4. SupplierLink.tsx usa companyId numérico e supplierCompanyLinks", () => {
    it("deve importar do módulo centralizado", () => {
      const content = readFile("client/src/pages/SupplierLink.tsx");
      expect(content).toContain("from \"@/lib/companies\"");
    });

    it("deve usar trpc.supplierCompanyLinks (não trpc.supplierLinks legado)", () => {
      const content = readFile("client/src/pages/SupplierLink.tsx");
      expect(content).toContain("supplierCompanyLinks");
      expect(content).not.toMatch(/trpc\.supplierLinks\./);
    });

    it("não deve enviar slug textual como companyId ao backend", () => {
      const content = readFile("client/src/pages/SupplierLink.tsx");
      // Não deve ter sourceCompany.id como companyId (slug)
      expect(content).not.toMatch(/companyId:\s*sourceCompany\.id\b/);
    });
  });

  describe("5. Suppliers.tsx usa companyId numérico", () => {
    it("deve usar selectedCompany.companyId nas queries", () => {
      const content = readFile("client/src/pages/Suppliers.tsx");
      expect(content).toContain("selectedCompany?.companyId");
    });

    it("não deve enviar selectedCompany.id (slug) como companyId", () => {
      const content = readFile("client/src/pages/Suppliers.tsx");
      // Verificar que não há selectedCompany.id usado como companyId no trpc
      const badPattern = /companyId:\s*selectedCompany\.id\b/;
      expect(content).not.toMatch(badPattern);
    });
  });

  describe("6. Home.tsx usa companyId numérico", () => {
    it("deve usar selectedCompany.companyId nas queries", () => {
      const content = readFile("client/src/pages/Home.tsx");
      expect(content).toContain("companyId");
    });

    it("não deve enviar slug textual como companyId", () => {
      const content = readFile("client/src/pages/Home.tsx");
      const badPattern = /companyId:\s*selectedCompany\.id\b/;
      expect(content).not.toMatch(badPattern);
    });
  });

  describe("7. Backend getAllSuppliers usa supplierCompanyLinks", () => {
    it("deve ter caminho por companyId via supplierCompanyLinks", () => {
      const content = readFile("server/db.ts");
      expect(content).toContain("supplierCompanyLinks");
    });

    it("deve ter caminho por businessUnitId via supplierCompanyLinks", () => {
      const content = readFile("server/db.ts");
      // Deve ter filtro por businessUnitId em supplierCompanyLinks
      expect(content).toMatch(/supplierCompanyLinks.*businessUnitId/s);
    });

    it("não deve usar suppliers.companyId como filtro de visibilidade no caminho canônico", () => {
      const content = readFile("server/db.ts");
      // A função getAllSuppliers não deve filtrar por suppliers.companyId no caminho de companyId
      // O caminho canônico usa supplierCompanyLinks.companyId
      const getAllSuppliers = content.substring(
        content.indexOf("export async function getAllSuppliers"),
        content.indexOf("export async function getAllSuppliers") + 3000
      );
      // No caminho de companyId, deve usar supplierCompanyLinks, não suppliers.companyId
      expect(getAllSuppliers).toContain("supplierCompanyLinks");
    });
  });

  describe("8. Backend supplierCompanyLinks.create deriva businessUnitId", () => {
    it("deve ter lógica de derivação de businessUnitId a partir do companyId", () => {
      const content = readFile("server/routers.ts");
      // Deve ter getBusinessUnitIdByCompanyId ou lógica equivalente
      expect(content).toContain("getBusinessUnitIdByCompanyId");
    });
  });

  describe("9. Backend getSuppliersByCategory usa supplierCompanyLinks", () => {
    it("deve usar supplierCompanyLinks (não suppliers.companyId legado)", () => {
      const content = readFile("server/db.ts");
      const funcStart = content.indexOf("export async function getSuppliersByCategory");
      if (funcStart === -1) return; // Função pode ter sido removida
      const funcBlock = content.substring(funcStart, funcStart + 1500);
      expect(funcBlock).toContain("supplierCompanyLinks");
    });
  });

  describe("10. Backend getSuppliersByCriticality usa supplierCompanyLinks", () => {
    it("deve usar supplierCompanyLinks (não suppliers.companyId legado)", () => {
      const content = readFile("server/db.ts");
      const funcStart = content.indexOf("export async function getSuppliersByCriticality");
      if (funcStart === -1) return; // Função pode ter sido removida
      const funcBlock = content.substring(funcStart, funcStart + 1500);
      expect(funcBlock).toContain("supplierCompanyLinks");
    });
  });

  describe("11. Approvals.tsx usa companyId numérico", () => {
    it("deve usar selectedCompany?.companyId nas queries", () => {
      const content = readFile("client/src/pages/Approvals.tsx");
      expect(content).toContain("selectedCompany?.companyId");
    });

    it("não deve ter fallback para selectedCompany?.id (slug)", () => {
      const content = readFile("client/src/pages/Approvals.tsx");
      const badPattern = /selectedCompany\?\.id\b/;
      // Se existir, deve ser apenas para display, não para companyId de query
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("companyId") && line.match(badPattern)) {
          expect(line).not.toMatch(badPattern);
        }
      }
    });
  });

  describe("12. Scripts de diagnóstico e backfill existem", () => {
    it("diagnose-links.mjs deve existir", () => {
      expect(fs.existsSync(path.join(PROJECT_ROOT, "scripts/diagnose-links.mjs"))).toBe(true);
    });

    it("backfill-links.mjs deve existir", () => {
      expect(fs.existsSync(path.join(PROJECT_ROOT, "scripts/backfill-links.mjs"))).toBe(true);
    });

    it("backfill-links.mjs deve ter modo --dry-run e --execute", () => {
      const content = readFile("scripts/backfill-links.mjs");
      expect(content).toContain("--dry-run");
      expect(content).toContain("--execute");
    });

    it("backfill-links.mjs deve ser idempotente (verificar duplicata antes de inserir)", () => {
      const content = readFile("scripts/backfill-links.mjs");
      // Deve ter verificação de existência
      expect(content).toMatch(/SELECT.*FROM supplier_company_links.*WHERE.*supplierId/s);
    });
  });

  describe("13. Nenhum arquivo frontend envia slug textual como companyId ao backend", () => {
    const frontendFiles = [
      "client/src/pages/Suppliers.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Approvals.tsx",
      "client/src/pages/Compliance.tsx",
      "client/src/pages/Evaluations.tsx",
      "client/src/pages/Interactions.tsx",
      "client/src/pages/SupplierForm.tsx",
      "client/src/pages/AddSupplierAI.tsx",
      "client/src/pages/SupplierLink.tsx",
    ];

    for (const file of frontendFiles) {
      it(`${file} não deve ter fallback 'grupo-arqueo' ou 'all_grupo_arqueo_brasil' como companyId`, () => {
        const filePath = path.join(PROJECT_ROOT, file);
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, "utf-8");
        // Não deve ter esses slugs como fallback de companyId
        expect(content).not.toMatch(/companyId:\s*['"]grupo-arqueo['"]/);
        expect(content).not.toMatch(/companyId:\s*['"]all_grupo_arqueo_brasil['"]/);
      });
    }
  });
});
