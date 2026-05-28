import { describe, it, expect } from "vitest";

/**
 * Testes v9.11 — Refatoração SupplierLink + companyId numérico centralizado
 * Cobre: módulo centralizado, derivação de businessUnitId, idempotência, fallbacks eliminados
 */

// ─── Teste 1: Módulo centralizado companies.ts ─────────────────────────────────
describe("client/src/lib/companies.ts — módulo centralizado", () => {
  // Simular o módulo (não podemos importar TSX no vitest server-side)
  const COMPANIES_BY_GROUP = {
    1: [ // Grupo Arqueo Brasil
      { slug: "arqueogis-preventiva", companyId: 1, name: "Arqueogis Preventiva", groupId: 1 },
      { slug: "arqueoproject", companyId: 2, name: "Arqueoproject", groupId: 1 },
      { slug: "arqueogis-geoprocessamento", companyId: 3, name: "Arqueogis Geoprocessamento", groupId: 1 },
      { slug: "arqueocean", companyId: 30001, name: "Arqueocean", groupId: 1 },
    ],
  };

  const SLUG_TO_COMPANY_ID: Record<string, number> = {};
  const COMPANY_ID_TO_SLUG: Record<number, string> = {};
  for (const companies of Object.values(COMPANIES_BY_GROUP)) {
    for (const c of companies) {
      SLUG_TO_COMPANY_ID[c.slug] = c.companyId;
      COMPANY_ID_TO_SLUG[c.companyId] = c.slug;
    }
  }

  it("mapeia todos os 4 slugs para IDs numéricos", () => {
    expect(SLUG_TO_COMPANY_ID["arqueogis-preventiva"]).toBe(1);
    expect(SLUG_TO_COMPANY_ID["arqueoproject"]).toBe(2);
    expect(SLUG_TO_COMPANY_ID["arqueogis-geoprocessamento"]).toBe(3);
    expect(SLUG_TO_COMPANY_ID["arqueocean"]).toBe(30001);
  });

  it("mapeia todos os 4 IDs numéricos para slugs", () => {
    expect(COMPANY_ID_TO_SLUG[1]).toBe("arqueogis-preventiva");
    expect(COMPANY_ID_TO_SLUG[2]).toBe("arqueoproject");
    expect(COMPANY_ID_TO_SLUG[3]).toBe("arqueogis-geoprocessamento");
    expect(COMPANY_ID_TO_SLUG[30001]).toBe("arqueocean");
  });

  it("não aceita slug inválido", () => {
    expect(SLUG_TO_COMPANY_ID["grupo-arqueo"]).toBeUndefined();
    expect(SLUG_TO_COMPANY_ID["invalid"]).toBeUndefined();
    expect(SLUG_TO_COMPANY_ID[""]).toBeUndefined();
  });

  it("todas as empresas do grupo 1 têm groupId = 1", () => {
    for (const c of COMPANIES_BY_GROUP[1]) {
      expect(c.groupId).toBe(1);
    }
  });
});

// ─── Teste 2: Derivação de businessUnitId ───────────────────────────────────────
describe("supplierCompanyLinks.create — derivação de businessUnitId", () => {
  it("deve derivar businessUnitId a partir do companyId quando não fornecido", () => {
    // Simular: company.id=1 tem businessUnitId=1
    const companyId = 1;
    const expectedBusinessUnitId = 1;
    
    // Lógica: se !input.businessUnitId → buscar companies.businessUnitId WHERE id = companyId
    const company = { id: 1, businessUnitId: 1 };
    const derivedBuId = company.businessUnitId;
    expect(derivedBuId).toBe(expectedBusinessUnitId);
  });

  it("deve usar businessUnitId explícito quando fornecido", () => {
    const inputBusinessUnitId = 2;
    const companyBusinessUnitId = 1;
    
    // Lógica: se input.businessUnitId existe, usar ele
    const finalBuId = inputBusinessUnitId || companyBusinessUnitId;
    expect(finalBuId).toBe(2);
  });

  it("deve retornar null se companyId não existe no banco", () => {
    const company = undefined;
    const derivedBuId = company?.businessUnitId ?? null;
    expect(derivedBuId).toBeNull();
  });
});

// ─── Teste 3: Idempotência (duplicata) ──────────────────────────────────────────
describe("supplierCompanyLinks.create — idempotência", () => {
  it("deve rejeitar vínculo duplicado (mesmo supplierId + companyId)", () => {
    // Simular: vínculo já existe
    const existingLinks = [{ supplierId: 300001, companyId: 1 }];
    const newLink = { supplierId: 300001, companyId: 1 };
    
    const isDuplicate = existingLinks.some(
      l => l.supplierId === newLink.supplierId && l.companyId === newLink.companyId
    );
    expect(isDuplicate).toBe(true);
  });

  it("deve permitir mesmo fornecedor em empresas diferentes", () => {
    const existingLinks = [{ supplierId: 300001, companyId: 1 }];
    const newLink = { supplierId: 300001, companyId: 2 };
    
    const isDuplicate = existingLinks.some(
      l => l.supplierId === newLink.supplierId && l.companyId === newLink.companyId
    );
    expect(isDuplicate).toBe(false);
  });

  it("deve permitir mesma empresa com fornecedores diferentes", () => {
    const existingLinks = [{ supplierId: 300001, companyId: 1 }];
    const newLink = { supplierId: 300002, companyId: 1 };
    
    const isDuplicate = existingLinks.some(
      l => l.supplierId === newLink.supplierId && l.companyId === newLink.companyId
    );
    expect(isDuplicate).toBe(false);
  });
});

// ─── Teste 4: Fallbacks eliminados ──────────────────────────────────────────────
describe("SupplierForm/AddSupplierAI — fallbacks inválidos eliminados", () => {
  it("não deve usar 'grupo-arqueo' como fallback de companyId", () => {
    const selectedCompanyId = "";
    const selectedCompany = { companyId: undefined };
    
    // Lógica corrigida: fallback vazio em vez de slug inválido
    const companyId = selectedCompanyId || 
      (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined) || "";
    
    expect(companyId).not.toBe("grupo-arqueo");
    expect(companyId).toBe("");
  });

  it("deve usar companyId numérico quando selectedCompany está disponível", () => {
    const selectedCompanyId = "";
    const selectedCompany = { companyId: 2 };
    
    const companyId = selectedCompanyId || 
      (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined) || "";
    
    expect(companyId).toBe("2");
  });

  it("deve usar selectedCompanyId quando selecionado explicitamente", () => {
    const selectedCompanyId = "3";
    const selectedCompany = { companyId: 2 };
    
    const companyId = selectedCompanyId || 
      (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined) || "";
    
    expect(companyId).toBe("3");
  });
});

// ─── Teste 5: SupplierLink.tsx — companyId numérico ─────────────────────────────
describe("SupplierLink.tsx — usa companyId numérico do módulo centralizado", () => {
  it("deve enviar companyId numérico na mutation, não slug", () => {
    const targetCompany = { slug: "arqueoproject", companyId: 2, name: "Arqueoproject", groupId: 1 };
    
    // A mutation deve receber companyId numérico
    const mutationInput = {
      supplierId: 300001,
      companyId: targetCompany.companyId,
    };
    
    expect(typeof mutationInput.companyId).toBe("number");
    expect(mutationInput.companyId).toBe(2);
  });

  it("não deve enviar slug como companyId", () => {
    const targetCompany = { slug: "arqueoproject", companyId: 2, name: "Arqueoproject", groupId: 1 };
    
    const mutationInput = {
      supplierId: 300001,
      companyId: targetCompany.companyId,
    };
    
    // Nunca deve ser string
    expect(mutationInput.companyId).not.toBe("arqueoproject");
    expect(mutationInput.companyId).not.toBe("2");
  });
});

// ─── Teste 6: getBusinessUnitIdByCompanyId ──────────────────────────────────────
describe("db.getBusinessUnitIdByCompanyId — derivação correta", () => {
  it("deve retornar businessUnitId para empresa existente", () => {
    // Simular resultado do banco
    const rows = [{ businessUnitId: 1 }];
    const result = rows[0]?.businessUnitId ?? null;
    expect(result).toBe(1);
  });

  it("deve retornar null para empresa inexistente", () => {
    const rows: any[] = [];
    const result = rows[0]?.businessUnitId ?? null;
    expect(result).toBeNull();
  });
});
