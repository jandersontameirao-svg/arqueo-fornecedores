import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const severityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const severityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const alertTypeLabels: Record<string, string> = {
  expiration: "Expiração",
  compliance: "Conformidade",
  review: "Revisão",
  renewal: "Renovação",
};

export default function Compliance() {
  const [, setLocation] = useLocation();
  const { selectedCompany } = useSelectedCompany();
  const { data: alerts, isLoading } = trpc.compliance.getAlerts.useQuery({
    companyId: selectedCompany?.id || undefined,
    groupId: !selectedCompany?.id && selectedCompany?.groupId ? selectedCompany.groupId : undefined,
  });
  const utils = trpc.useUtils();

  const resolveMutation = trpc.compliance.resolveAlert.useMutation({
    onSuccess: () => {
      utils.compliance.getAlerts.invalidate();
    },
  });

  // Download seguro: gera URL assinada fresca via R2 usando fileKey permanente
  const getSignedUrlMutation = trpc.storage.getSignedUrl.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: () => {
      toast.error("Não foi possível gerar o link de download. Tente novamente.");
    },
  });

  const handleDownload = (fileKey: string | null | undefined, fileUrl: string | null | undefined) => {
    if (fileKey) {
      getSignedUrlMutation.mutate({ fileKey });
    } else if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      toast.error("Arquivo não disponível.");
    }
  };

  const activeAlerts = alerts?.filter((a) => !a.alert.resolvedAt) || [];
  const criticalCount = activeAlerts.filter((a) => a.alert.severity === "critical").length;
  const highCount = activeAlerts.filter((a) => a.alert.severity === "high").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conformidade</h1>
        <p className="text-muted-foreground">
          Monitore alertas e mantenha a conformidade dos fornecedores
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos (30d)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts?.filter((a) => a.alert.resolvedAt).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Alertas de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.map((item) => (
                  <TableRow key={item.alert.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.alert.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.alert.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.supplier ? (
                        <button
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                          onClick={() => setLocation(`/suppliers/${item.supplier!.id}`)}
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">{item.supplier.companyName}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {alertTypeLabels[item.alert.alertType] || item.alert.alertType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[item.alert.severity]}>
                        {severityLabels[item.alert.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.alert.dueDate ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(item.alert.dueDate).toLocaleDateString("pt-BR")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.document && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.document!.fileKey, item.document!.fileUrl)}
                            disabled={getSignedUrlMutation.isPending}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate({ id: item.alert.id })}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Tudo em conformidade!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Não há alertas ativos no momento
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
