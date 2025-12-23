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

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byCategory, isLoading: categoryLoading } = trpc.dashboard.suppliersByCategory.useQuery();
  const { data: byCriticality, isLoading: criticalityLoading } = trpc.dashboard.suppliersByCriticality.useQuery();
  const { data: alerts } = trpc.compliance.getAlerts.useQuery();
  const { data: pendingWorkflows } = trpc.workflows.getPending.useQuery();

  const criticalityColors: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const criticalityLabels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da gestão de fornecedores do Grupo Arqueo
        </p>
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

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/documents")}>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Suppliers by Category */}
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
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : byCategory && byCategory.length > 0 ? (
              <div className="space-y-3">
                {byCategory.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.categoryColor || "#6B7280" }}
                      />
                      <span className="font-medium">
                        {cat.categoryName || "Sem categoria"}
                      </span>
                    </div>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma categoria cadastrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Suppliers by Criticality */}
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
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : byCriticality && byCriticality.length > 0 ? (
              <div className="space-y-3">
                {byCriticality.map((crit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <Badge className={criticalityColors[crit.criticality || "medium"]}>
                      {criticalityLabels[crit.criticality || "medium"]}
                    </Badge>
                    <span className="font-bold">{crit.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum fornecedor cadastrado
              </p>
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
