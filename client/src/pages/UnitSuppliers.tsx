import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
  Users,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pendente",   color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  approved:  { label: "Aprovado",   color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  rejected:  { label: "Rejeitado",  color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  suspended: { label: "Suspenso",   color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
  inactive:  { label: "Inativo",    color: "bg-gray-100 text-gray-500 border-gray-200", icon: XCircle },
};

const CRITICALITY_LABELS: Record<string, { label: string; color: string }> = {
  low:      { label: "Baixa",    color: "bg-blue-100 text-blue-700" },
  medium:   { label: "Média",    color: "bg-yellow-100 text-yellow-700" },
  high:     { label: "Alta",     color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica",  color: "bg-red-100 text-red-700" },
};

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function UnitSuppliers() {
  const [, setLocation] = useLocation();
  const { activeUnit } = useBusinessUnitContext();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();

  const { data: suppliersRaw, isLoading, refetch } = trpc.suppliers.list.useQuery(
    {
      businessUnitId: activeUnit?.id,
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      criticality: criticalityFilter !== "all" ? criticalityFilter : undefined,
      categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    },
    {
      enabled: !!activeUnit?.id,
      staleTime: 15_000,
    }
  );

  const suppliers = useMemo(() => suppliersRaw ?? [], [suppliersRaw]);

  const activeFiltersCount = [
    statusFilter !== "all",
    criticalityFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setCriticalityFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/select-company")}
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
              <span className="text-arqueo-laranja">Fornecedores</span> da Unidade
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Central de cadastro e gestão — {isLoading ? "..." : suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/DW8xBeDMWJhhN24cgAUDzG/arqueo-10anos-logo_cb7a67b6.webp"
            alt="Grupo Arqueo"
            className="h-12 w-auto"
          />
        </div>
      </div>

      {/* ── Barra de ações ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros */}
        <Button
          variant="outline"
          className="gap-2 bg-white relative"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-arqueo-laranja text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Exportar */}
        <Button variant="outline" className="gap-2 bg-white">
          <Download size={16} />
          Exportar
        </Button>

        {/* Novo Fornecedor */}
        <Button
          className="gap-2 bg-arqueo-laranja hover:bg-arqueo-laranja/90 text-white"
          onClick={() => setLocation("/suppliers/new")}
        >
          <Plus size={16} />
          Novo Fornecedor
        </Button>
      </div>

      {/* ── Painel de filtros ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-border/40 shadow-warm p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Criticidade</label>
            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Categoria</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* ── Lista de fornecedores ── */}
      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-border/40 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border/40">
          <div className="w-16 h-16 rounded-2xl icon-laranja flex items-center justify-center mx-auto mb-4">
            <Users size={28} />
          </div>
          <h3 className="font-bold font-heading text-foreground text-lg mb-2">
            {search || activeFiltersCount > 0 ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {search || activeFiltersCount > 0
              ? "Tente ajustar os filtros ou a busca."
              : "Cadastre o primeiro fornecedor desta unidade de negócio."}
          </p>
          {!search && activeFiltersCount === 0 && (
            <Button
              className="gap-2 bg-arqueo-laranja hover:bg-arqueo-laranja/90 text-white"
              onClick={() => setLocation("/suppliers/new")}
            >
              <Plus size={16} /> Novo Fornecedor
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/40 shadow-warm overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/30 border-b border-border/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Fornecedor</span>
            <span>CNPJ</span>
            <span>Categoria</span>
            <span>Status</span>
            <span>Criticidade</span>
            <span></span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-border/30">
            {suppliers.map((row: any) => {
              const s = row.supplier;
              const cat = row.category;
              const statusInfo = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending;
              const critInfo = CRITICALITY_LABELS[s.criticality] ?? CRITICALITY_LABELS.medium;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={s.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => setLocation(`/suppliers/${s.id}`)}
                >
                  {/* Fornecedor */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-arqueo-laranja/10 text-arqueo-laranja flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{s.companyName}</p>
                      {s.tradeName && (
                        <p className="text-xs text-muted-foreground truncate">{s.tradeName}</p>
                      )}
                      {s.city && (
                        <p className="text-xs text-muted-foreground truncate md:hidden">{s.city}{s.state ? `, ${s.state}` : ""}</p>
                      )}
                    </div>
                  </div>

                  {/* CNPJ */}
                  <div className="hidden md:block">
                    <span className="text-sm text-muted-foreground font-mono">{formatCnpj(s.cnpj)}</span>
                  </div>

                  {/* Categoria */}
                  <div className="hidden md:block">
                    {cat ? (
                      <Badge
                        className="text-[11px] font-semibold rounded-full"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40` }}
                      >
                        {cat.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <StatusIcon size={13} />
                    <Badge className={`text-[11px] font-semibold rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Criticidade */}
                  <div className="hidden md:block">
                    <Badge className={`text-[11px] font-semibold rounded-full ${critInfo.color}`}>
                      {critInfo.label}
                    </Badge>
                  </div>

                  {/* Ação */}
                  <div className="flex justify-end">
                    <ChevronRight
                      size={18}
                      className="text-muted-foreground group-hover:text-arqueo-laranja group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé */}
          <div className="px-5 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""} exibido{suppliers.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => refetch()}
            >
              Atualizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
