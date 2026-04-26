import { useLocation } from "wouter";
import { ArrowLeft, Building2, ChevronRight, UserPlus, Users } from "lucide-react";
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

// Grupos que possuem tela intermediária de seleção de empresa
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

// ─── Componente de card de empresa ───────────────────────────────────────────
function CompanyCard({
  company,
  groupName,
  groupId,
  onSelect,
  onRegisterSupplier,
}: {
  company: CompanyDef;
  groupName: string;
  groupId: number;
  onSelect: (c: SelectedCompany) => void;
  onRegisterSupplier: (c: SelectedCompany) => void;
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
      {/* Accent bar top */}
      <div className="h-1.5 w-full" style={{ backgroundColor: company.color }} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-11 h-11 rounded-xl object-contain shrink-0 shadow-sm"
              />
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

        {/* Card de Fornecedores */}
        <div
          className="flex items-center gap-3 rounded-xl p-3 mb-3 border"
          style={{ backgroundColor: `${company.color}0D`, borderColor: `${company.color}30` }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(companyData);
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${company.color}20`, color: company.color }}
          >
            <Users size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fornecedores</p>
            <p className="text-lg font-bold leading-tight" style={{ color: company.color }}>
              {supplierCount ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">vinculados</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Acessar Dashboard */}
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: company.color }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(companyData);
            }}
          >
            Acessar <ChevronRight size={16} />
          </button>

          {/* Cadastrar Fornecedor — botão secundário */}
          <button
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:opacity-80 active:scale-[0.98] bg-white"
            style={{ borderColor: company.color, color: company.color }}
            onClick={(e) => {
              e.stopPropagation();
              onRegisterSupplier(companyData);
            }}
            title={`Cadastrar fornecedor para ${company.name}`}
          >
            <UserPlus size={15} />
            Cadastrar Fornecedor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SelectCompany() {
  const [, setLocation] = useLocation();
  const { activeUnit } = useBusinessUnitContext();
  const { setSelectedCompany } = useSelectedCompany();

  const companies = activeUnit ? getCompaniesForGroup(activeUnit.name) : [];

  const handleSelect = (company: SelectedCompany) => {
    setSelectedCompany(company);
    setLocation("/dashboard");
  };

  const handleRegisterSupplier = (company: SelectedCompany) => {
    // Define o contexto da empresa e navega direto para o formulário de cadastro
    setSelectedCompany(company);
    setLocation("/suppliers/new");
  };

  const handleBack = () => {
    setLocation("/");
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
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
              Selecione a <span className="text-arqueo-laranja">Empresa</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Escolha a empresa para acessar o painel de fornecedores
            </p>
          </div>
        </div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/DW8xBeDMWJhhN24cgAUDzG/arqueo-10anos-logo_cb7a67b6.webp"
          alt="Grupo Arqueo - 10 Anos"
          className="h-14 md:h-16 w-auto"
        />
      </div>

      {/* ── Cards de empresas ── */}
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
            <Button onClick={handleBack} variant="outline" className="mt-4 gap-2">
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
                onRegisterSupplier={handleRegisterSupplier}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
