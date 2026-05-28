/**
 * Módulo centralizado de definição de empresas do Grupo Arqueo.
 * Fonte canônica para slug, companyId numérico, nome, cor e businessUnitId.
 * 
 * REGRA: O slug (id) é apenas visual/roteamento.
 *        O backend SEMPRE recebe companyId numérico.
 */

export interface CompanyDef {
  id: string;              // slug visual (ex: "arqueoproject")
  companyId: number;       // ID numérico real na tabela companies
  name: string;            // nome de exibição
  color: string;           // cor hex da empresa
  description?: string;    // descrição curta
  logoUrl?: string;        // URL do logo (se houver)
  businessUnitId?: number; // ID da unidade de negócio pai (quando conhecido)
}

export interface CompanyGroup {
  name: string;
  companies: CompanyDef[];
}

// ─── Definição canônica das empresas por grupo ──────────────────────────────────

export const COMPANIES_BY_GROUP: Record<string, CompanyDef[]> = {
  "Grupo Arqueo Brasil": [
    {
      id: "arqueogis-preventiva",
      companyId: 1,
      name: "Arqueogis Preventiva",
      color: "#F09327",
      description: "Arqueologia preventiva e licenciamento ambiental",
    },
    {
      id: "arqueoproject",
      companyId: 2,
      name: "Arqueoproject",
      color: "#6E0F2B",
      description: "Gestão e execução de projetos arqueológicos",
    },
    {
      id: "arqueogis-geoprocessamento",
      companyId: 3,
      name: "Arqueogis Geoprocessamento",
      color: "#D4A017",
      description: "Geoprocessamento e análise espacial",
    },
    {
      id: "arqueocean",
      companyId: 30001,
      name: "Arqueocean",
      color: "#3178C1",
      description: "Arqueologia subaquática e oceanografia",
    },
  ],
  "Foods and Drinks": [
    {
      id: "vinho24hbsb",
      companyId: 99999, // placeholder — sem registro real no banco ainda
      name: "Vinho24hBSB",
      color: "#6E0F2B",
      description: "Distribuição e varejo de vinhos e bebidas",
      logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028979380/tpVGXZuyboWbtFfx.png",
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Nomes dos grupos que possuem seleção de empresa */
export const GROUP_NAMES = Object.keys(COMPANIES_BY_GROUP);

/** Verifica se um grupo possui empresas para seleção */
export function hasCompanySelection(groupName: string): boolean {
  return GROUP_NAMES.some(
    (g) => groupName.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(groupName.toLowerCase())
  );
}

/** Retorna as empresas de um grupo pelo nome (busca parcial) */
export function getCompaniesForGroup(groupName: string): CompanyDef[] {
  const key = GROUP_NAMES.find(
    (g) => groupName.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(groupName.toLowerCase())
  );
  return key ? COMPANIES_BY_GROUP[key] : [];
}

/** Busca uma empresa por slug */
export function getCompanyBySlug(slug: string): CompanyDef | undefined {
  for (const companies of Object.values(COMPANIES_BY_GROUP)) {
    const found = companies.find((c) => c.id === slug);
    if (found) return found;
  }
  return undefined;
}

/** Busca uma empresa por companyId numérico */
export function getCompanyById(companyId: number): CompanyDef | undefined {
  for (const companies of Object.values(COMPANIES_BY_GROUP)) {
    const found = companies.find((c) => c.companyId === companyId);
    if (found) return found;
  }
  return undefined;
}

/** Mapa slug → companyId numérico (para migração de localStorage) */
export const SLUG_TO_COMPANY_ID: Record<string, number> = Object.fromEntries(
  Object.values(COMPANIES_BY_GROUP)
    .flat()
    .map((c) => [c.id, c.companyId])
);

/** Infere companyId numérico a partir do slug */
export function inferCompanyId(slug: string): number | undefined {
  return SLUG_TO_COMPANY_ID[slug];
}

/** Retorna todas as empresas de todos os grupos (flat) */
export function getAllCompanies(): CompanyDef[] {
  return Object.values(COMPANIES_BY_GROUP).flat();
}

/** Verifica se uma empresa tem companyId numérico válido (não placeholder) */
export function hasValidCompanyId(company: CompanyDef): boolean {
  return company.companyId > 0 && company.companyId < 90000;
}
