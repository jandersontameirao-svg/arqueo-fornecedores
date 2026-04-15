import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Calendar,
  Shield,
  Star,
} from "lucide-react";

// Sub-components
import SupplierDocuments from "@/components/supplier/SupplierDocuments";
import SupplierContacts from "@/components/supplier/SupplierContacts";
import SupplierInteractions from "@/components/supplier/SupplierInteractions";
import SupplierEvaluations from "@/components/supplier/SupplierEvaluations";
import SupplierWorkflow from "@/components/supplier/SupplierWorkflow";
import SupplierContracts from "@/components/contracts/SupplierContracts";

interface SupplierDetailProps {
  id: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
  inactive: "Inativo",
};

const statusColors: Record<string, string> = {
  pending: "bg-[oklch(0.92_0.08_85)] text-[oklch(0.45_0.12_85)]",
  approved: "bg-[oklch(0.92_0.08_145)] text-[oklch(0.40_0.12_145)]",
  rejected: "bg-[oklch(0.92_0.08_25)] text-[oklch(0.45_0.15_25)]",
  suspended: "bg-[oklch(0.92_0.08_45)] text-[oklch(0.45_0.12_45)]",
  inactive: "bg-gray-100 text-gray-800",
};

const criticalityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const criticalityColors: Record<string, string> = {
  low: "bg-[oklch(0.92_0.05_145)] text-[oklch(0.40_0.10_145)]",
  medium: "bg-[oklch(0.92_0.05_250)] text-[oklch(0.40_0.10_250)]",
  high: "bg-[oklch(0.92_0.08_45)] text-[oklch(0.45_0.12_45)]",
  critical: "bg-[oklch(0.92_0.08_15)] text-[oklch(0.45_0.15_15)]",
};

export default function SupplierDetail({ id }: SupplierDetailProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.suppliers.getById.useQuery({ id });
  const { data: documentsData } = trpc.documents.list.useQuery({ supplierId: id });
  const { data: evaluationsData } = trpc.evaluations.list.useQuery({ supplierId: id });
  const { data: interactionsData } = trpc.interactions.list.useQuery({ supplierId: id });
  const { data: contactsData } = trpc.suppliers.getContacts.useQuery({ supplierId: id });

  const approveMutation = trpc.suppliers.approve.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor aprovado com sucesso!");
      utils.suppliers.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const rejectMutation = trpc.suppliers.reject.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor rejeitado");
      utils.suppliers.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor excluído");
      setLocation("/suppliers");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === "admin";
  const canEdit = user?.role === "admin" || user?.role === "manager";

  // Calculate stats
  const documentsCount = documentsData?.length || 0;
  const expiredDocs = documentsData?.filter((d: any) => 
    d.expirationDate && new Date(d.expirationDate) < new Date()
  ).length || 0;
  const expiringDocs = documentsData?.filter((d: any) => {
    if (!d.expirationDate) return false;
    const expDate = new Date(d.expirationDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expDate >= now && expDate <= thirtyDaysFromNow;
  }).length || 0;
  
  const evaluationsCount = evaluationsData?.length || 0;
  const lastEvaluation = evaluationsData?.[0];
  const averageScore = evaluationsData?.length 
    ? (evaluationsData.reduce((acc: number, e: any) => acc + parseFloat(e.evaluation?.overallScore || "0"), 0) / evaluationsData.length).toFixed(1)
    : null;
  
  const interactionsCount = interactionsData?.length || 0;
  const contactsCount = contactsData?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Fornecedor não encontrado</h3>
        <Button className="mt-4" onClick={() => setLocation("/suppliers")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const { supplier, category } = data;

  return (
    <div className="space-y-6">
      {/* Header - Área do Fornecedor */}
      <div className="bg-gradient-to-r from-[oklch(0.35_0.15_350)] to-[oklch(0.45_0.12_350)] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/suppliers")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {supplier.companyName}
                  </h1>
                  <Badge className={`${statusColors[supplier.status]} border-0`}>
                    {statusLabels[supplier.status]}
                  </Badge>
                  <Badge className={`${criticalityColors[supplier.criticality || "medium"]} border-0`}>
                    {criticalityLabels[supplier.criticality || "medium"]}
                  </Badge>
                </div>
                <p className="text-white/80 mt-1">{supplier.tradeName || supplier.cnpj}</p>
                {category && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color || "#fff" }}
                    />
                    <span className="text-sm text-white/90">{category.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {supplier.status === "pending" && isAdmin && (
              <>
                <Button
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => approveMutation.mutate({ id })}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => rejectMutation.mutate({ id })}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
            {canEdit && (
              <Button 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setLocation(`/suppliers/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-red-500/80 text-white border-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados, documentos e
                      histórico serão permanentemente removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteMutation.mutate({ id })}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("documents")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documentos</p>
                <p className="text-2xl font-bold">{documentsCount}</p>
                {expiredDocs > 0 && (
                  <p className="text-xs text-[oklch(0.55_0.15_25)]">
                    {expiredDocs} vencido{expiredDocs > 1 ? "s" : ""}
                  </p>
                )}
                {expiringDocs > 0 && expiredDocs === 0 && (
                  <p className="text-xs text-[oklch(0.55_0.12_45)]">
                    {expiringDocs} expirando
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${expiredDocs > 0 ? "bg-[oklch(0.95_0.05_25)]" : "bg-[oklch(0.95_0.03_250)]"}`}>
                <FileText className={`h-6 w-6 ${expiredDocs > 0 ? "text-[oklch(0.55_0.15_25)]" : "text-[oklch(0.50_0.10_250)]"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("contacts")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contatos</p>
                <p className="text-2xl font-bold">{contactsCount}</p>
                <p className="text-xs text-muted-foreground">cadastrados</p>
              </div>
              <div className="p-3 rounded-xl bg-[oklch(0.95_0.03_145)]">
                <Users className="h-6 w-6 text-[oklch(0.50_0.10_145)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("interactions")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interações</p>
                <p className="text-2xl font-bold">{interactionsCount}</p>
                <p className="text-xs text-muted-foreground">registradas</p>
              </div>
              <div className="p-3 rounded-xl bg-[oklch(0.95_0.03_45)]">
                <MessageSquare className="h-6 w-6 text-[oklch(0.55_0.12_45)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("evaluations")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação</p>
                <p className="text-2xl font-bold">{averageScore || "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {evaluationsCount} avaliação{evaluationsCount !== 1 ? "ões" : ""}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[oklch(0.95_0.05_85)]">
                <Star className="h-6 w-6 text-[oklch(0.55_0.15_85)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full h-auto p-1 bg-muted/50">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden lg:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="cadastro" className="flex items-center gap-2 py-2.5">
            <FileText className="h-4 w-4" />
            <span className="hidden lg:inline">Cadastro</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 py-2.5">
            <FileCheck className="h-4 w-4" />
            <span className="hidden lg:inline">Documentos</span>
            {expiredDocs > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs justify-center">
                {expiredDocs}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2 py-2.5">
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">Contatos</span>
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2 py-2.5">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden lg:inline">Interações</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2 py-2.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Avaliações</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-2 py-2.5">
            <CreditCard className="h-4 w-4" />
            <span className="hidden lg:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2 py-2.5">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">Aprovação</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Info Cards */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.email}</span>
                  </div>
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                    <p className="font-mono text-sm">{supplier.cnpj}</p>
                  </div>
                  {supplier.stateRegistration && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Inscrição Estadual</p>
                      <p className="font-mono text-sm">{supplier.stateRegistration}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              {supplier.street && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {supplier.street}, {supplier.number}
                      {supplier.complement && ` - ${supplier.complement}`}
                    </p>
                    <p className="text-sm">
                      {supplier.neighborhood && `${supplier.neighborhood}, `}
                      {supplier.city} - {supplier.state}
                    </p>
                    <p className="text-sm">{supplier.zipCode}</p>
                    <p className="text-sm text-muted-foreground">{supplier.country}</p>
                  </CardContent>
                </Card>
              )}

              {/* Bank Info */}
              {supplier.bankName && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                      Dados Bancários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="text-sm">{supplier.bankName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Agência</p>
                        <p className="text-sm font-mono">{supplier.bankAgency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conta</p>
                        <p className="text-sm font-mono">{supplier.bankAccount}</p>
                      </div>
                    </div>
                    {supplier.pixKey && (
                      <div>
                        <p className="text-xs text-muted-foreground">Chave PIX</p>
                        <p className="text-sm font-mono">{supplier.pixKey}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Activity Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Documents Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                      Resumo de Documentos
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("documents")}>
                      Ver todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-[oklch(0.97_0.01_145)]">
                      <p className="text-2xl font-bold text-[oklch(0.45_0.12_145)]">{documentsCount - expiredDocs - expiringDocs}</p>
                      <p className="text-xs text-muted-foreground">Em dia</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-[oklch(0.97_0.02_45)]">
                      <p className="text-2xl font-bold text-[oklch(0.50_0.12_45)]">{expiringDocs}</p>
                      <p className="text-xs text-muted-foreground">Expirando</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-[oklch(0.97_0.02_25)]">
                      <p className="text-2xl font-bold text-[oklch(0.50_0.15_25)]">{expiredDocs}</p>
                      <p className="text-xs text-muted-foreground">Vencidos</p>
                    </div>
                  </div>
                  {documentsCount > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Conformidade documental</span>
                        <span>{Math.round(((documentsCount - expiredDocs) / documentsCount) * 100)}%</span>
                      </div>
                      <Progress 
                        value={((documentsCount - expiredDocs) / documentsCount) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              {lastEvaluation && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                        Última Avaliação
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("evaluations")}>
                        Ver histórico
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{lastEvaluation.evaluation?.qualityScore || "-"}</p>
                        <p className="text-xs text-muted-foreground">Qualidade</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{lastEvaluation.evaluation?.deliveryScore || "-"}</p>
                        <p className="text-xs text-muted-foreground">Entrega</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{lastEvaluation.evaluation?.priceScore || "-"}</p>
                        <p className="text-xs text-muted-foreground">Preço</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{lastEvaluation.evaluation?.communicationScore || "-"}</p>
                        <p className="text-xs text-muted-foreground">Comunicação</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[oklch(0.95_0.05_85)]">
                        <p className="text-lg font-bold text-[oklch(0.50_0.15_85)]">{lastEvaluation.evaluation?.overallScore || "-"}</p>
                        <p className="text-xs text-muted-foreground">Geral</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Período: {lastEvaluation.evaluation?.evaluationPeriod}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Interactions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                      Últimas Interações
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("interactions")}>
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {interactionsData && interactionsData.length > 0 ? (
                    <div className="space-y-3">
                      {interactionsData.slice(0, 3).map((item: any) => (
                        <div key={item.interaction.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-[oklch(0.95_0.03_350)] flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.interaction.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.interaction.interactionDate).toLocaleDateString("pt-BR")} • {item.interaction.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma interação registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cadastro Tab - Dados Cadastrais Completos */}
        <TabsContent value="cadastro" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Identificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Razão Social</p>
                    <p className="text-sm font-medium">{supplier.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                    <p className="text-sm font-medium">{supplier.tradeName || "-"}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="text-sm font-mono">{supplier.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                    <p className="text-sm font-mono">{supplier.stateRegistration || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inscrição Municipal</p>
                    <p className="text-sm font-mono">{supplier.municipalRegistration || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Contato Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm">{supplier.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm">{supplier.phone || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  {supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {supplier.website}
                    </a>
                  ) : (
                    <p className="text-sm">-</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Logradouro</p>
                    <p className="text-sm">{supplier.street || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Número</p>
                    <p className="text-sm">{supplier.number || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Complemento</p>
                    <p className="text-sm">{supplier.complement || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bairro</p>
                    <p className="text-sm">{supplier.neighborhood || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="text-sm">{supplier.city || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="text-sm">{supplier.state || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CEP</p>
                    <p className="text-sm font-mono">{supplier.zipCode || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Classificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Classificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    {category ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color || "#6B7280" }} />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    ) : (
                      <p className="text-sm">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criticidade</p>
                    <Badge className={`${criticalityColors[supplier.criticality || "medium"]} mt-1`}>
                      {criticalityLabels[supplier.criticality || "medium"]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[supplier.status]} mt-1`}>
                    {statusLabels[supplier.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <SupplierDocuments supplierId={id} canEdit={canEdit} />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <SupplierContacts supplierId={id} canEdit={canEdit} />
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions">
          <SupplierInteractions supplierId={id} canEdit={canEdit} />
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations">
          <SupplierEvaluations supplierId={id} canEdit={canEdit} />
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dados Bancários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Dados Bancários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="text-sm font-medium">{supplier.bankName || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="text-sm font-mono">{supplier.bankAgency || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conta</p>
                    <p className="text-sm font-mono">{supplier.bankAccount || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de Conta</p>
                  <p className="text-sm">{supplier.bankAccountType === "checking" ? "Conta Corrente" : supplier.bankAccountType === "savings" ? "Poupança" : "-"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Chave PIX</p>
                  <p className="text-sm font-mono">{supplier.pixKey || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Informações Fiscais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Informações Fiscais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="text-sm font-mono">{supplier.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                    <p className="text-sm font-mono">{supplier.stateRegistration || "Isento"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inscrição Municipal</p>
                  <p className="text-sm font-mono">{supplier.municipalRegistration || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contratos */}
            <div className="lg:col-span-2">
              <SupplierContracts
                supplierId={id}
                supplierName={supplier.companyName}
                supplierCnpj={supplier.cnpj}
              />
            </div>
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow">
          <SupplierWorkflow supplierId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
