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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";

// Sub-components
import SupplierDocuments from "@/components/supplier/SupplierDocuments";
import SupplierContacts from "@/components/supplier/SupplierContacts";
import SupplierInteractions from "@/components/supplier/SupplierInteractions";
import SupplierEvaluations from "@/components/supplier/SupplierEvaluations";
import SupplierWorkflow from "@/components/supplier/SupplierWorkflow";

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
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  inactive: "bg-gray-100 text-gray-800",
};

const criticalityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function SupplierDetail({ id }: SupplierDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.suppliers.getById.useQuery({ id });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/suppliers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {supplier.companyName}
              </h1>
              <Badge className={statusColors[supplier.status]}>
                {statusLabels[supplier.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{supplier.tradeName || supplier.cnpj}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {supplier.status === "pending" && isAdmin && (
            <>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => approveMutation.mutate({ id })}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => rejectMutation.mutate({ id })}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setLocation(`/suppliers/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
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

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info Cards */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Gerais</CardTitle>
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
              {category && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color || "#6B7280" }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Criticidade</p>
                <Badge variant="outline">
                  {criticalityLabels[supplier.criticality || "medium"]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          {supplier.street && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
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
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
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

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="workflow" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="workflow" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Aprovação</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Contatos</span>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Interações</span>
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Avaliações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflow">
              <SupplierWorkflow supplierId={id} />
            </TabsContent>

            <TabsContent value="documents">
              <SupplierDocuments supplierId={id} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="contacts">
              <SupplierContacts supplierId={id} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="interactions">
              <SupplierInteractions supplierId={id} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="evaluations">
              <SupplierEvaluations supplierId={id} canEdit={canEdit} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Notes */}
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
    </div>
  );
}
