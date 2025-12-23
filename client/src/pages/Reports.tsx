import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  FileCheck,
  BarChart3,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type ReportType = "suppliers" | "documents" | "evaluations" | "audit" | "expiringDocuments";

interface ReportConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  adminOnly?: boolean;
}

const reportConfigs: Record<ReportType, ReportConfig> = {
  suppliers: {
    title: "Fornecedores",
    description: "Lista completa de fornecedores com dados cadastrais, status e categorização",
    icon: <Users className="h-6 w-6" />,
    color: "text-[oklch(0.45_0.15_350)]",
  },
  documents: {
    title: "Documentos",
    description: "Relatório de todos os documentos cadastrados com status de validade",
    icon: <FileCheck className="h-6 w-6" />,
    color: "text-[oklch(0.45_0.15_250)]",
  },
  evaluations: {
    title: "Avaliações",
    description: "Histórico de avaliações de desempenho dos fornecedores",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-[oklch(0.45_0.15_145)]",
  },
  audit: {
    title: "Auditoria",
    description: "Trilha de auditoria com todas as ações realizadas no sistema",
    icon: <Shield className="h-6 w-6" />,
    color: "text-[oklch(0.45_0.15_45)]",
    adminOnly: true,
  },
  expiringDocuments: {
    title: "Documentos Expirando",
    description: "Relatório de documentos que expiram nos próximos 30 dias",
    icon: <AlertTriangle className="h-6 w-6" />,
    color: "text-[oklch(0.55_0.15_85)]",
  },
};

export default function Reports() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [loading, setLoading] = useState(false);

  // Report mutations
  const suppliersMutation = trpc.reports.suppliers.useMutation();
  const documentsMutation = trpc.reports.documents.useMutation();
  const evaluationsMutation = trpc.reports.evaluations.useMutation();
  const auditMutation = trpc.reports.audit.useMutation();
  const expiringDocsMutation = trpc.reports.expiringDocuments.useMutation();

  const isAdmin = user?.role === "admin";
  const canExport = user?.role === "admin" || user?.role === "manager";

  const downloadFile = (data: string, filename: string, contentType: string) => {
    const blob = new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async (reportType: ReportType) => {
    if (!canExport) {
      toast.error("Você não tem permissão para exportar relatórios");
      return;
    }

    setLoading(true);
    setSelectedReport(reportType);

    try {
      let result: { data: string; filename: string; contentType: string };

      switch (reportType) {
        case "suppliers":
          result = await suppliersMutation.mutateAsync({ format });
          break;
        case "documents":
          result = await documentsMutation.mutateAsync({ format });
          break;
        case "evaluations":
          result = await evaluationsMutation.mutateAsync({ format });
          break;
        case "audit":
          result = await auditMutation.mutateAsync({ format });
          break;
        case "expiringDocuments":
          result = await expiringDocsMutation.mutateAsync({});
          break;
        default:
          throw new Error("Tipo de relatório inválido");
      }

      downloadFile(result.data, result.filename, result.contentType);
      toast.success(`Relatório "${reportConfigs[reportType].title}" exportado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar relatório");
    } finally {
      setLoading(false);
      setSelectedReport(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">
          Exporte relatórios em formato CSV (Excel) ou JSON
        </p>
      </div>

      {/* Format Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurações de Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <Label>Formato de Exportação</Label>
              <Select value={format} onValueChange={(v: "csv" | "json") => setFormat(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {format === "csv"
                ? "Formato compatível com Excel e outras planilhas"
                : "Formato para integração com outros sistemas"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(reportConfigs).map(([key, config]) => {
          const reportType = key as ReportType;
          const isDisabled = config.adminOnly && !isAdmin;
          const isLoading = loading && selectedReport === reportType;

          return (
            <Card
              key={key}
              className={`relative overflow-hidden transition-all ${
                isDisabled ? "opacity-50" : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                    {config.icon}
                  </div>
                  {config.adminOnly && (
                    <span className="text-xs bg-[oklch(0.90_0.05_45)] text-[oklch(0.45_0.15_45)] px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{config.title}</CardTitle>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={isDisabled ? "outline" : "default"}
                  disabled={isDisabled || isLoading || !canExport}
                  onClick={() => handleExport(reportType)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar {format.toUpperCase()}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      {!canExport && (
        <Card className="border-[oklch(0.80_0.05_45)] bg-[oklch(0.98_0.01_45)]">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[oklch(0.55_0.15_45)]" />
              <p className="text-sm text-[oklch(0.45_0.10_45)]">
                Você precisa de permissão de Gestor ou Administrador para exportar relatórios.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
