import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Users,
  ArrowRight,
} from "lucide-react";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useSelectedCompany, type SelectedCompany } from "@/contexts/SelectedCompanyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// ─── Definição estática das empresas por grupo ────────────────────────────────
interface CompanyDef {
  id: string;
  name: string;
  color: string;
  description?: string;
  logoUrl?: string;
}

const COMPANIES_BY_GROUP: Record<string, CompanyDef[]> = {
  "Grupo Arqueo Brasil": [
    { id: "arqueogis-preventiva", name: "Arqueogis Preventiva", color: "#F09327", description: "Arqueologia preventiva e licenciamento ambiental" },
    { id: "arqueoproject", name: "Arqueoproject", color: "#6E0F2B", description: "Gestão e execução de projetos arqueológicos" },
    { id: "arqueogis-geoprocessamento", name: "Arqueogis Geoprocessamento", color: "#D4A017", description: "Geoprocessamento e análise espacial" },
    { id: "arqueocean", name: "Arqueocean", color: "#3178C1", description: "Arqueologia subaquática e oceanografia" },
  ],
  "Foods and Drinks": [
    { id: "vinho24hbsb", name: "Vinho24hBSB", color: "#6E0F2B", description: "Distribuição e varejo de vinhos e bebidas", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028979380/tpVGXZuyboWbtFfx.png" },
  ],
};

const GROUPS_WITH_COMPANY_SELECTION = Object.keys(COMPANIES_BY_GROUP);

export function hasCompanySelection(groupName: string): boolean {
  return GROUPS_WITH_COMPANY_SELECTION.some(
    (g) => groupName.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(groupName.toLowerCase())
  );
}

export function getCompaniesForGroup(groupName: string): CompanyDef[] {
  const key = GROUPS_WITH_COMPANY_SELECTION.find(
    (g) => groupName.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(groupName.toLowerCase())
  );
  return key ? COMPANIES_BY_GROUP[key] : [];
}

// ─── Card individual de empresa (usado na vista Empresas) ─────────────────────
function CompanyCard({
  company,
  groupName,
  groupId,
  onSelect,
}: {
  company: CompanyDef;
  groupName: string;
  groupId: number;
  onSelect: (c: SelectedCompany) => void;
}) {
  const companyData: SelectedCompany = {
    id: company.id,
    name: company.name,
    color: company.color,
    groupName,
    groupId,
  };

  const { data: supplierCount } = trpc.supplierCompanyLinks.countByCompanyStringId.useQuery(
    { companyId: company.id },
    { staleTime: 30_000 }
  );

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-warm hover:shadow-warm-lg border border-white/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
      onClick={() => onSelect(companyData)}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: company.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-11 h-11 rounded-xl object-contain shrink-0 shadow-sm" />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: `${company.color}18`, color: company.color }}
              >
                <Building2 size={20} />
              </div>
            )}
            <div>
              <h3 className="font-bold font-heading text-foreground text-[15px] leading-tight">{company.name}</h3>
              {company.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{company.description}</p>
              )}
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full shrink-0 ml-2">
            Ativa
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-4 px-1">
          <Users size={13} className="text-muted-foreground shrink-0" />
          <span className="text-[12px] text-muted-foreground">
            <span className="font-bold text-foreground">{supplierCount ?? "—"}</span> fornecedor{supplierCount !== 1 ? "es" : ""} vinculado{supplierCount !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: company.color }}
          onClick={(e) => { e.stopPropagation(); onSelect(companyData); }}
        >
          Acessar <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Card de empresa na vista de Fornecedores (central de gestão) ─────────────
function CompanySupplierCard({
  company,
  groupName,
  groupId,
  onSelect,
}: {
  company: CompanyDef;
  groupName: string;
  groupId: number;
  onSelect: (c: SelectedCompany) => void;
}) {
  const companyData: SelectedCompany = {
    id: company.id,
    name: company.name,
    color: company.color,
    groupName,
    groupId,
  };

  const { data: count } = trpc.supplierCompanyLinks.countByCompanyStringId.useQuery(
    { companyId: company.id },
    { staleTime: 30_000 }
  );

  return (
    <button
      onClick={() => onSelect(companyData)}
      className="w-full text-left bg-white rounded-2xl border border-white/60 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: company.color }} />
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-xl object-contain shrink-0 shadow-sm" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: `${company.color}18`, color: company.color }}
            >
              <Building2 size={22} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold font-heading text-foreground text-[15px] leading-tight">{company.name}</h3>
            <p className="text-[12px] text-muted-foreground mt-1">
              <span className="font-bold" style={{ color: company.color }}>{count ?? "—"}</span> fornecedor{count !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
type View = "menu" | "empresas" | "fornecedores";

export default function SelectCompany() {
  const [, setLocation] = useLocation();
  const { activeUnit } = useBusinessUnitContext();
  const { setSelectedCompany } = useSelectedCompany();
  const [view, setView] = useState<View>("menu");

  const companies = activeUnit ? getCompaniesForGroup(activeUnit.name) : [];

  const { data: totalSuppliers } = trpc.supplierCompanyLinks.countByBusinessUnit.useQuery(
    { businessUnitId: activeUnit?.id ?? 0 },
    { enabled: !!activeUnit?.id, staleTime: 30_000 }
  );

  const handleSelect = (company: SelectedCompany) => {
    setSelectedCompany(company);
    setLocation("/dashboard");
  };

  const handleBack = () => {
    if (view !== "menu") {
      setView("menu");
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
              {activeUnit?.name}
            </p>
            {view === "menu" && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
                  O que deseja <span className="text-arqueo-laranja">acessar?</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Selecione uma área para continuar</p>
              </>
            )}
            {view === "empresas" && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
                  Selecione a <span className="text-arqueo-laranja">Empresa</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Escolha a empresa para acessar o painel de fornecedores</p>
              </>
            )}
            {view === "fornecedores" && (
              <>
                <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">
                  <span className="text-arqueo-laranja">Fornecedores</span> da Unidade
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Visão consolidada de todos os fornecedores desta área de negócio</p>
              </>
            )}
          </div>
        </div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/DW8xBeDMWJhhN24cgAUDzG/arqueo-10anos-logo_cb7a67b6.webp"
          alt="Grupo Arqueo - 10 Anos"
          className="h-14 md:h-16 w-auto"
        />
      </div>

      {/* ── Vista: menu principal (dois cards grandes) ── */}
      {view === "menu" && (
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
          {/* Card Empresas */}
          <button
            onClick={() => setView("empresas")}
            className="group text-left bg-white rounded-2xl shadow-warm hover:shadow-warm-lg border border-white/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-arqueo-laranja" />
            <div className="p-6 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl icon-laranja flex items-center justify-center shadow-sm">
                <Building2 size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-foreground">Empresas</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse o painel de uma empresa específica desta área de negócio
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                <span className="text-sm font-semibold text-arqueo-laranja">
                  {companies.length} empresa{companies.length !== 1 ? "s" : ""}
                </span>
                <ArrowRight size={18} className="text-arqueo-laranja group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card Fornecedores */}
          <button
            onClick={() => setLocation("/unit-suppliers")}
            className="group text-left bg-white rounded-2xl shadow-warm hover:shadow-warm-lg border border-white/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-arqueo-bordo" />
            <div className="p-6 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl icon-bordo flex items-center justify-center shadow-sm">
                <Users size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-foreground">Fornecedores</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualize e gerencie todos os fornecedores desta área de negócio
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                <span className="text-sm font-semibold text-arqueo-bordo">
                  {totalSuppliers ?? "—"} fornecedor{totalSuppliers !== 1 ? "es" : ""}
                </span>
                <ArrowRight size={18} className="text-arqueo-bordo group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Vista: lista de empresas ── */}
      {view === "empresas" && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl icon-laranja flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="font-bold font-heading text-foreground text-lg">Empresas</h2>
              <p className="text-xs text-muted-foreground">Selecione uma empresa para continuar ou cadastre um fornecedor diretamente</p>
            </div>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhuma empresa disponível para este grupo.</p>
              <Button onClick={() => setView("menu")} variant="outline" className="mt-4 gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                groupName={activeUnit?.name || ""}
                groupId={activeUnit?.id || 0}
                onSelect={handleSelect}
              />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Vista: fornecedores da unidade (central de gestão) ── */}
      {view === "fornecedores" && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl icon-bordo flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="font-bold font-heading text-foreground text-lg">Fornecedores</h2>
              <p className="text-xs text-muted-foreground">Todos os fornecedores vinculados a esta área de negócio</p>
            </div>
          </div>

          {/* Grid de empresas com contagem de fornecedores */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanySupplierCard
                key={company.id}
                company={company}
                groupName={activeUnit?.name || ""}
                groupId={activeUnit?.id || 0}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Botão para ver todos os fornecedores */}
          <div className="flex justify-center pt-4">
            <Button
              className="gap-2 bg-arqueo-bordo hover:bg-arqueo-bordo/90 text-white"
              onClick={() => setLocation("/unit-suppliers")}
            >
              <Users size={16} /> Acessar Central de Fornecedores
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
