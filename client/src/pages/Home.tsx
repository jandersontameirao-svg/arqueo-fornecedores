import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FolderOpen,
  Plus,
  Link2,
  BarChart3,
  ArrowRight,
  Globe,
  Activity,
  LayoutTemplate,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { getCompaniesForGroup } from "@/pages/SelectCompany";
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
  const { selectedCompany } = useSelectedCompany();
  // Usar companyId numérico para chamadas ao backend; id é preservado como slug visual
  const companyId = selectedCompany?.companyId
    ? String(selectedCompany.companyId)
    : undefined;
  // groupId via selectedCompany OU via activeUnit (visão por área)
  const groupId = selectedCompany?.groupId
    ? selectedCompany.groupId
    : activeUnit?.id || undefined;

  // Navega para /suppliers garantindo que activeUnit está persistido no localStorage
  const navigateToSuppliers = () => {
    if (activeUnit) {
      setActiveUnitId(activeUnit.id); // garante persistência no localStorage antes da navegação
    }
    setLocation("/suppliers");
  };

  // Verifica se a área tem empresas registradas
  const areaCompanies = activeUnit ? getCompaniesForGroup(activeUnit.name) : [];
  const areaHasCompanies = areaCompanies.length > 0;

  // ISOLAMENTO: só busca dados se há empresa selecionada ou área com empresas
  const hasScope = !!(companyId || (activeUnit && areaHasCompanies));

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    { companyId, groupId },
    { enabled: hasScope }
  );
  const { data: byCategory, isLoading: categoryLoading } = trpc.dashboard.suppliersByCategory.useQuery(
    { companyId, groupId },
    { enabled: hasScope }
  );
  const { data: byCriticality, isLoading: criticalityLoading } = trpc.dashboard.suppliersByCriticality.useQuery(
    { companyId, groupId },
    { enabled: hasScope }
  );
  const { data: alerts } = trpc.compliance.getAlerts.useQuery(
    { companyId, groupId },
    { enabled: hasScope }
  );
  const { data: pendingWorkflows } = trpc.workflows.getPending.useQuery(
    { companyId },
    { enabled: hasScope }
  );

  // --- Template modal state ---
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const { data: templates, isLoading: templatesLoading } = trpc.templates.listAll.useQuery(
    undefined,
    { enabled: showTemplateModal }
  );
  const filteredTemplates = (templates || []).filter((t) =>
    !templateSearch ||
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Preparar dados para o gráfico de pizza (categorias)
  const categoryChartData = (byCategory as Array<{ categoryName: string | null; count: number; categoryColor: string | null }> | undefined)?.map((cat, idx) => ({
    name: cat.categoryName || "Sem categoria",
    value: cat.count,
    color: cat.categoryColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  })) || [];

  // Preparar dados para o gráfico de barras (criticidade)
  const criticalityChartData = (byCriticality as Array<{ criticality: string | null; count: number }> | undefined)?.map((crit) => ({
    name: criticalityLabels[(crit.criticality || "medium") as keyof typeof criticalityLabels] || crit.criticality,
    value: crit.count,
    color: CRITICALITY_COLORS[(crit.criticality || "medium") as keyof typeof CRITICALITY_COLORS] || "#6B7280",
    key: crit.criticality,
  })) || [];

  // ESTADO VAZIO: apenas quando a área realmente não tem empresas cadastradas
  if (activeUnit && !areaHasCompanies) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <Badge variant="outline" className="font-medium">
                <Globe className="h-3 w-3 mr-1" />
                {activeUnit.name}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Área de negócio selecionada</p>
          </div>
        </div>

        {/* Empty state: área sem empresas */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Não há empresas registradas</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Esta área ainda não possui empresas cadastradas. Acesse a tela de seleção para cadastrar uma nova empresa.
          </p>
          <Button onClick={() => setLocation("/")} variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Voltar para Áreas de Negócio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {selectedCompany && (
              <Badge style={{ backgroundColor: `${selectedCompany.color}20`, color: selectedCompany.color, borderColor: `${selectedCompany.color}40` }} className="font-medium border">
                <Globe className="h-3 w-3 mr-1" />
                {selectedCompany.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {selectedCompany
              ? `Gestão de fornecedores — ${selectedCompany.name}`
              : "Visão geral da gestão de fornecedores do Grupo Arqueo"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={() => setLocation("/suppliers/new")} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>

          {/* Usar Template dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LayoutTemplate className="h-4 w-4" />
                Usar Template
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setLocation("/contract-templates")}>
                <Plus className="h-4 w-4 mr-2 text-primary" />
                Adicionar novo template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTemplateSearch(""); setShowTemplateModal(true); }}>
                <LayoutTemplate className="h-4 w-4 mr-2 text-primary" />
                Selecionar template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setLocation("/suppliers/link")} variant="outline" size="sm" className="gap-1.5">
            <Link2 className="h-4 w-4" />
            Vincular
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={navigateToSuppliers}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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

        <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setLocation("/approvals")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
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

        <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={navigateToSuppliers}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.expiringDocuments || 0} expirando em 15 dias
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setLocation("/compliance")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
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

      {/* Activity Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas Recentes
              </CardTitle>
              <CardDescription>Últimos alertas de conformidade</CardDescription>
            </div>
            {alerts && alerts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setLocation("/compliance")} className="gap-1 text-xs">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((item) => (
                  <div
                    key={item.alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Aprovações Pendentes
              </CardTitle>
              <CardDescription>Workflows aguardando ação</CardDescription>
            </div>
            {pendingWorkflows && pendingWorkflows.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setLocation("/approvals")} className="gap-1 text-xs">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            )}
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

      {/* Modal: Selecionar Template */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Selecionar Template
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
            />
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <LayoutTemplate className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {templateSearch ? "Nenhum template encontrado" : "Nenhum template cadastrado"}
                </p>
                {!templateSearch && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => { setShowTemplateModal(false); setLocation("/contract-templates"); }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar primeiro template
                  </Button>
                )}
              </div>
            ) : (
              filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setLocation(`/generate-contract?templateId=${t.id}`);
                    }}
                  >
                    Usar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
