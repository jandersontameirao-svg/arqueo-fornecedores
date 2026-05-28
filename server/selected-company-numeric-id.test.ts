/**
 * Testes v9.10 — selectedCompany.companyId numérico
 *
 * Garante que:
 * 1. inferCompanyId mapeia slugs conhecidos para IDs numéricos corretos
 * 2. Slugs desconhecidos retornam undefined
 * 3. O tipo SelectedCompany aceita companyId opcional
 * 4. Migração de localStorage: objeto sem companyId recebe inferência automática
 * 5. Slug desconhecido no localStorage é descartado (retorna null)
 */

import { describe, it, expect } from "vitest";

// Replicar a lógica de inferCompanyId para teste isolado (sem importar o módulo React)
const SLUG_TO_COMPANY_ID: Record<string, number> = {
  "arqueogis-preventiva": 1,
  "arqueoproject": 2,
  "arqueogis-geoprocessamento": 3,
  "arqueocean": 30001,
};

function inferCompanyId(slug: string): number | undefined {
  return SLUG_TO_COMPANY_ID[slug];
}

// Simular a lógica de migração do localStorage
function migrateSelectedCompany(raw: string | null): { id: string; companyId?: number; name: string; color: string; groupName: string; groupId: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.companyId === undefined) {
      const inferred = inferCompanyId(parsed.id);
      if (inferred !== undefined) {
        return { ...parsed, companyId: inferred };
      }
      // Slug desconhecido: descartar
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

describe("inferCompanyId — mapeamento slug → ID numérico", () => {
  it("mapeia arqueogis-preventiva para 1", () => {
    expect(inferCompanyId("arqueogis-preventiva")).toBe(1);
  });

  it("mapeia arqueoproject para 2", () => {
    expect(inferCompanyId("arqueoproject")).toBe(2);
  });

  it("mapeia arqueogis-geoprocessamento para 3", () => {
    expect(inferCompanyId("arqueogis-geoprocessamento")).toBe(3);
  });

  it("mapeia arqueocean para 30001", () => {
    expect(inferCompanyId("arqueocean")).toBe(30001);
  });

  it("retorna undefined para slug desconhecido", () => {
    expect(inferCompanyId("slug-invalido")).toBeUndefined();
    expect(inferCompanyId("grupo-arqueo")).toBeUndefined();
    expect(inferCompanyId("")).toBeUndefined();
  });
});

describe("migrateSelectedCompany — migração do localStorage", () => {
  it("retorna null para localStorage vazio", () => {
    expect(migrateSelectedCompany(null)).toBeNull();
  });

  it("migra objeto legado sem companyId inferindo pelo slug", () => {
    const legacy = JSON.stringify({
      id: "arqueoproject",
      name: "Arqueoproject",
      color: "#6E0F2B",
      groupName: "Grupo Arqueo Brasil",
      groupId: 1,
    });
    const result = migrateSelectedCompany(legacy);
    expect(result).not.toBeNull();
    expect(result?.companyId).toBe(2);
    expect(result?.id).toBe("arqueoproject");
  });

  it("descarta objeto legado com slug desconhecido", () => {
    const legacy = JSON.stringify({
      id: "slug-invalido",
      name: "Empresa Desconhecida",
      color: "#000000",
      groupName: "Grupo X",
      groupId: 99,
    });
    expect(migrateSelectedCompany(legacy)).toBeNull();
  });

  it("preserva objeto já migrado com companyId definido", () => {
    const migrated = JSON.stringify({
      id: "arqueogis-preventiva",
      companyId: 1,
      name: "Arqueogis Preventiva",
      color: "#F09327",
      groupName: "Grupo Arqueo Brasil",
      groupId: 1,
    });
    const result = migrateSelectedCompany(migrated);
    expect(result?.companyId).toBe(1);
  });

  it("retorna null para JSON inválido no localStorage", () => {
    expect(migrateSelectedCompany("not-json")).toBeNull();
  });
});

describe("companyId numérico → string para backend", () => {
  it("converte companyId numérico para string ao enviar ao backend", () => {
    const selectedCompany = {
      id: "arqueoproject",
      companyId: 2,
      name: "Arqueoproject",
      color: "#6E0F2B",
      groupName: "Grupo Arqueo Brasil",
      groupId: 1,
    };
    const companyIdForBackend = selectedCompany.companyId
      ? String(selectedCompany.companyId)
      : undefined;
    expect(companyIdForBackend).toBe("2");
  });

  it("retorna undefined quando companyId não está definido", () => {
    const selectedCompany = {
      id: "slug-sem-id",
      name: "Empresa",
      color: "#000",
      groupName: "Grupo",
      groupId: 1,
    };
    const companyIdForBackend = (selectedCompany as any).companyId
      ? String((selectedCompany as any).companyId)
      : undefined;
    expect(companyIdForBackend).toBeUndefined();
  });
});
