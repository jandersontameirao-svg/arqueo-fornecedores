import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, FileText, AlertTriangle, CheckCircle, Clock,
  DollarSign, CalendarClock, ArrowRight, ShieldAlert, FileSignature,
} from "lucide-react";
import { useLocation } from "wouter";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { getCompaniesForGroup } from "@/pages/SelectCompany";
import { APPROVAL_POLICY_LABEL } from "@shared/approval";
import { Printer } from "lucide-react";

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

const CRIT_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" };
const CRIT_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

/** Painel Executivo — visão consolidada para a diretoria administrativa. */
export default function Painel() {
  const [, setLocation] = useLocation();
  const { activeUnit } = useBusinessUnitContext();
  const { selectedCompany } = useSelectedCompany();

  const companyId = selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined;
  const groupId = selectedCompany?.groupId ? selectedCompany.groupId : activeUnit?.id || undefined;
  const areaCompanies = activeUnit ? getCompaniesForGroup(activeUnit.name) : [];
  const hasScope = !!(companyId || (activeUnit && areaCompanies.length > 0));

  const { data, isLoading } = trpc.dashboard.executive.useQuery({ companyId, groupId }, { enabled: hasScope });
  const { data: monthly } = trpc.reports.monthlySummary.useQuery({}, { enabled: hasScope });

  if (!hasScope) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Selecione uma área de negócio ou empresa para ver o painel executivo.
      </div>
    );
  }

  const s = data?.stats;
  const c = data?.contracts;
  const crit = (data?.criticality ?? []) as Array<{ criticality: string; count: number }>;
  const upcoming = data?.upcomingDocs ?? [];

  const Kpi = ({ icon: Icon, label, value, tone, onClick }: any) => (
    <Card className={onClick ? "cursor-pointer transition hover:shadow-md" : ""} onClick={onClick}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl p-3 ${tone || "bg-muted"}`}><Icon className="h-6 w-6" /></div>
        <div>
          <div className="text-2xl font-bold leading-tight">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel Executivo</h1>
          <p className="text-muted-foreground">Visão consolidada de contratos, risco e pendências.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir resumo
        </Button>
      </div>

      {/* Política de alçada (feature: aprovação por valor) */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
        ℹ️ {APPROVAL_POLICY_LABEL}
      </div>

      {/* Resumo do mês (relatório da diretoria) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do mês {monthly?.month?.periodo ? `(${monthly.month.periodo})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><div className="text-xl font-bold">{monthly?.month?.newSuppliers ?? "—"}</div><div className="text-xs text-muted-foreground">Novos fornecedores</div></div>
          <div><div className="text-xl font-bold">{monthly?.month?.contractsCreated ?? "—"}</div><div className="text-xs text-muted-foreground">Contratos criados</div></div>
          <div><div className="text-xl font-bold">{monthly ? BRL(monthly.month.contractsValue) : "—"}</div><div className="text-xs text-muted-foreground">Valor contratado</div></div>
          <div><div className="text-xl font-bold">{monthly?.pendingApprovals ?? "—"}</div><div className="text-xs text-muted-foreground">Aprovações pendentes</div></div>
        </CardContent>
      </Card>

      {/* Linha 1 — dinheiro e contratos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} tone="bg-emerald-100 text-emerald-700"
          label="Valor sob contrato ativo" value={BRL(c?.totalValueActive)} />
        <Kpi icon={FileSignature} tone="bg-blue-100 text-blue-700"
          label="Contratos ativos" value={c?.activeCount ?? 0}
          onClick={() => setLocation("/suppliers")} />
        <Kpi icon={CalendarClock} tone="bg-amber-100 text-amber-700"
          label="Vencem em 30 dias" value={c?.expiring30 ?? 0} />
        <Kpi icon={Clock} tone="bg-orange-100 text-orange-700"
          label="Vencem em 90 dias" value={c?.expiring90 ?? 0} />
      </div>

      {/* Linha 2 — fornecedores e conformidade */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Building2} tone="bg-slate-100 text-slate-700"
          label="Fornecedores" value={s?.totalSuppliers ?? 0}
          onClick={() => setLocation("/suppliers")} />
        <Kpi icon={CheckCircle} tone="bg-emerald-100 text-emerald-700"
          label="Aprovados" value={s?.approvedSuppliers ?? 0} />
        <Kpi icon={AlertTriangle} tone="bg-amber-100 text-amber-700"
          label="Pendentes de aprovação" value={s?.pendingSuppliers ?? 0}
          onClick={() => setLocation("/approvals")} />
        <Kpi icon={FileText} tone="bg-red-100 text-red-700"
          label="Documentos vencendo" value={s?.expiringDocuments ?? 0}
          onClick={() => setLocation("/documents")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição de risco/criticidade */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-5 w-5" /> Fornecedores por criticidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-24 w-full" /> : crit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de criticidade.</p>
            ) : crit.map((r) => (
              <div key={r.criticality} className="flex items-center justify-between">
                <Badge variant="secondary" className={CRIT_COLOR[r.criticality] || ""}>
                  {CRIT_LABEL[r.criticality] || r.criticality}
                </Badge>
                <span className="font-semibold">{r.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximos vencimentos de documentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-5 w-5" /> Próximos vencimentos (30 dias)</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/documents")}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-24 w-full" /> : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento vencendo nos próximos 30 dias. 🎉</p>
            ) : upcoming.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between border-b pb-1 text-sm last:border-0">
                <span className="truncate">{d.nome}</span>
                <span className="shrink-0 text-muted-foreground">
                  {d.vence ? new Date(d.vence).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
