import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  FolderOpen,
} from "lucide-react";
import { useLocation } from "wouter";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { ArrowLeft, Globe } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Cores do Grupo Arqueo para os gráficos
const CATEGORY_COLORS = [
  "#8B1538", // bordô
  "#E85D04", // laranja
  "#1A56DB", // azul
  "#F5A623", // amarelo
  "#10B981", // verde
  "#8B5CF6", // roxo
  "#EC4899", // rosa
  "#06B6D4", // ciano
];

const CRITICALITY_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F5A623",
  high: "#E85D04",
  critical: "#EF4444",
};

const criticalityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} fornecedor{payload[0].value !== 1 ? "es" : ""}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{payload[0].value} fornecedor{payload[0].value !== 1 ? "es" : ""}</p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeUnit, setActiveUnitId } = useBusinessUnitContext();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byCategory, isLoading: categoryLoading } = trpc.dashboard.suppliersByCategory.useQuery();
  const { data: byCriticality, isLoading: criticalityLoading } = trpc.dashboard.suppliersByCriticality.useQuery();
  const { data: alerts } = trpc.compliance.getAlerts.useQuery();
  const { data: pendingWorkflows } = trpc.workflows.getPending.useQuery();

  // Preparar dados para o gráfico de pizza (categorias)
  const categoryChartData = byCategory?.map((cat, idx) => ({
    name: cat.categoryName || "Sem categoria",
    value: cat.count,
    color: cat.categoryColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  })) || [];

  // Preparar dados para o gráfico de barras (criticidade)
  const criticalityChartData = byCriticality?.map((crit) => ({
    name: criticalityLabels[crit.criticality || "medium"] || crit.criticality,
    value: crit.count,
    color: CRITICALITY_COLORS[crit.criticality || "medium"] || "#6B7280",
    key: crit.criticality,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setActiveUnitId(null); setLocation("/"); }}
          className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
          title="Voltar para Áreas de Negócio"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {activeUnit && (
              <Badge className="bg-[#8B1538]/10 text-[#8B1538] border-[#8B1538]/20 font-medium">
                <Globe className="h-3 w-3 mr-1" />
                {activeUnit.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {activeUnit
              ? `Gestão de fornecedores — ${activeUnit.name}`
              : "Visão geral da gestão de fornecedores do Grupo Arqueo"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/suppliers")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.approvedSuppliers || 0} aprovados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/approvals")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingSuppliers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando homologação
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/suppliers")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.expiringDocuments || 0} expirando em 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/compliance")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.activeAlerts || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart - Suppliers by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Fornecedores por Categoria
            </CardTitle>
            <CardDescription>Distribuição por tipo de fornecedor</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex items-center justify-center h-[260px]">
                <div className="space-y-3 w-full">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ) : categoryChartData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Suppliers by Criticality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fornecedores por Criticidade
            </CardTitle>
            <CardDescription>Classificação por nível de importância</CardDescription>
          </CardHeader>
          <CardContent>
            {criticalityLoading ? (
              <div className="flex items-center justify-center h-[260px]">
                <div className="space-y-3 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ) : criticalityChartData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={criticalityChartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {criticalityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhum fornecedor cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Recentes
            </CardTitle>
            <CardDescription>Últimos alertas de conformidade</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((item) => (
                  <div
                    key={item.alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 ${
                        item.alert.severity === "critical"
                          ? "text-red-500"
                          : item.alert.severity === "high"
                          ? "text-orange-500"
                          : "text-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.alert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.supplier?.companyName || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground">Nenhum alerta ativo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Aprovações Pendentes
            </CardTitle>
            <CardDescription>Workflows aguardando ação</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingWorkflows && pendingWorkflows.length > 0 ? (
              <div className="space-y-3">
                {pendingWorkflows.slice(0, 5).map((item) => (
                  <div
                    key={item.workflow.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setLocation(`/suppliers/${item.supplier.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.supplier.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Etapa {item.workflow.currentStep} de {item.workflow.totalSteps}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.workflow.status === "pending" ? "secondary" : "default"
                      }
                    >
                      {item.workflow.status === "pending"
                        ? "Pendente"
                        : "Em andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground">Nenhuma aprovação pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
