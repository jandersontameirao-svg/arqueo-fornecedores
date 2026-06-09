import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Users,
  ArrowRight,
  FileText,
  Plus,
} from "lucide-react";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useSelectedCompany, type SelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Importação do módulo centralizado de empresas ──────────────────────────────
import {
  COMPANIES_BY_GROUP,
  hasCompanySelection,
  getCompaniesForGroup,
  type CompanyDef,
} from "@/lib/companies";

// Re-exportar para manter compatibilidade com imports existentes
export { hasCompanySelection, getCompaniesForGroup };

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
    companyId: company.companyId,
    name: company.name,
    color: company.color,
    groupName,
    groupId,
  };

  const { data: supplierCount } = trpc.supplierCompanyLinks.countByCompanyStringId.useQuery(
    { companyId: String(company.companyId) },
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
    companyId: company.companyId,
    name: company.name,
    color: company.color,
    groupName,
    groupId,
  };

  const { data: count } = trpc.supplierCompanyLinks.countByCompanyStringId.useQuery(
    { companyId: String(company.companyId) },
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
  const { user } = useAuth();
  const [view, setView] = useState<View>("menu");
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  // ── Criação de empresa na área atual ──
  const [createOpen, setCreateOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ legalName: "", tradeName: "", cnpj: "" });
  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Empresa cadastrada com sucesso!");
      utils.businessUnits.getCompanies.invalidate();
      utils.companies.listAll.invalidate();
      utils.supplierCompanyLinks.countByBusinessUnit.invalidate();
      setCreateOpen(false);
      setNewCompany({ legalName: "", tradeName: "", cnpj: "" });
    },
    onError: (e) => toast.error(e.message || "Erro ao cadastrar empresa."),
  });

  const handleCreateCompany = () => {
    if (!activeUnit?.id) { toast.error("Selecione uma área de negócio primeiro."); return; }
    if (!newCompany.legalName.trim()) { toast.error("Razão Social é obrigatória."); return; }
    createCompanyMutation.mutate({
      businessUnitId: activeUnit.id,
      legalName: newCompany.legalName.trim(),
      tradeName: newCompany.tradeName.trim() || undefined,
      cnpj: newCompany.cnpj.trim() || undefined,
    });
  };

  // Fonte primária: backend (businessUnits.getCompanies por businessUnitId real).
  // Sem isto, a lista vinha de um dicionário hardcoded que dependia do nome da
  // Área bater EXATAMENTE com a chave "Grupo Arqueo Brasil"/"Foods and Drinks"
  // — qualquer divergência (acento, renomeação) fazia a tela vir vazia.
  const { data: backendCompanies } = trpc.businessUnits.getCompanies.useQuery(
    { businessUnitId: activeUnit?.id ?? 0 },
    { enabled: !!activeUnit?.id, staleTime: 30_000 }
  );

  // Dicionário hardcoded permanece como ENRIQUECIMENTO visual (cor/descrição/slug)
  // para empresas conhecidas. Empresas novas no banco aparecem com defaults.
  const fallbackList = activeUnit ? getCompaniesForGroup(activeUnit.name) : [];
  const dictById = new Map<number, CompanyDef>(fallbackList.map(c => [c.companyId, c]));
  const dictByName = new Map<string, CompanyDef>(fallbackList.map(c => [c.name.toLowerCase().trim(), c]));

  const companies: CompanyDef[] = (backendCompanies && backendCompanies.length > 0)
    ? backendCompanies.map((bc: any) => {
        const fromDict = dictById.get(bc.id) || dictByName.get(String(bc.tradeName || bc.legalName || "").toLowerCase().trim());
        return {
          id: fromDict?.id || `empresa-${bc.id}`,
          companyId: bc.id,
          name: bc.tradeName || bc.legalName || `Empresa ${bc.id}`,
          color: fromDict?.color || "#F09327",
          description: fromDict?.description,
          logoUrl: fromDict?.logoUrl || bc.logoUrl || undefined,
          businessUnitId: bc.businessUnitId ?? activeUnit?.id,
        };
      })
    : fallbackList;

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
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
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl icon-laranja flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-bold font-heading text-foreground text-lg">Empresas</h2>
                <p className="text-xs text-muted-foreground">Selecione uma empresa para continuar ou cadastre um fornecedor diretamente</p>
              </div>
            </div>
            {isAdmin && activeUnit && (
              <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-arqueo-laranja hover:bg-arqueo-laranja-light text-white shrink-0">
                <Plus size={16} /> Nova Empresa
              </Button>
            )}
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Nenhuma empresa cadastrada nesta área ainda.</p>
              {isAdmin && activeUnit ? (
                <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-arqueo-laranja hover:bg-arqueo-laranja-light text-white">
                  <Plus size={16} /> Cadastrar primeira empresa
                </Button>
              ) : (
                <Button onClick={() => setView("menu")} variant="outline" className="gap-2">
                  <ArrowLeft size={16} /> Voltar
                </Button>
              )}
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

      {/* ── Diálogo: cadastrar empresa na área atual ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar empresa</DialogTitle>
            <DialogDescription>
              A empresa será criada na área <strong>{activeUnit?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Razão Social *</Label>
              <Input
                id="legalName"
                value={newCompany.legalName}
                onChange={(e) => setNewCompany({ ...newCompany, legalName: e.target.value })}
                placeholder="Ex: Arqueo Foods Ltda"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                value={newCompany.tradeName}
                onChange={(e) => setNewCompany({ ...newCompany, tradeName: e.target.value })}
                placeholder="Ex: Arqueo Foods"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={newCompany.cnpj}
                onChange={(e) => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateCompany}
              disabled={createCompanyMutation.isPending}
              className="bg-arqueo-laranja hover:bg-arqueo-laranja-light text-white"
            >
              {createCompanyMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
