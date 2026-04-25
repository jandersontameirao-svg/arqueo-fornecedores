import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Link2,
  Shield,
  User,
} from "lucide-react";

interface SupplierHistoryProps {
  supplierId: number;
}

const actionLabels: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  approve: "Aprovação",
  reject: "Rejeição",
  suspend: "Suspensão",
  upload: "Upload",
  link: "Vinculação",
  unlink: "Desvinculação",
};

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  approve: CheckCircle,
  reject: XCircle,
  upload: FileText,
  link: Link2,
  unlink: Link2,
  suspend: Shield,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  upload: "bg-purple-100 text-purple-700",
  link: "bg-cyan-100 text-cyan-700",
  unlink: "bg-orange-100 text-orange-700",
  suspend: "bg-yellow-100 text-yellow-700",
};

const entityLabels: Record<string, string> = {
  supplier: "Fornecedor",
  document: "Documento",
  contract: "Contrato",
  evaluation: "Avaliação",
  interaction: "Interação",
  contact: "Contato",
  supplier_company_link: "Vínculo",
  workflow: "Workflow",
};

export default function SupplierHistory({ supplierId }: SupplierHistoryProps) {
  const { data: auditLogs, isLoading } = trpc.audit.list.useQuery({
    entityType: "supplier",
    entityId: supplierId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Histórico de Atividades</h3>
        <p className="text-sm text-muted-foreground">
          Registro completo de todas as alterações realizadas neste fornecedor
        </p>
      </div>

      {auditLogs && auditLogs.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {auditLogs.map((log: any, index: number) => {
              const IconComponent = actionIcons[log.action] || Edit;
              const colorClass = actionColors[log.action] || "bg-gray-100 text-gray-700";

              return (
                <div key={log.id || index} className="relative flex items-start gap-4 pl-2">
                  {/* Timeline dot */}
                  <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <Card className="flex-1">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entityLabels[log.entityType] || log.entityType}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {log.userEmail || "Sistema"}
                        </span>
                      </div>

                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                          {Object.entries(log.changes).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex gap-1">
                              <span className="font-medium">{key}:</span>
                              <span className="truncate">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(log.changes).length > 5 && (
                            <span className="text-muted-foreground">
                              +{Object.keys(log.changes).length - 5} campos
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <h4 className="font-medium">Nenhum registro encontrado</h4>
            <p className="text-sm text-muted-foreground mt-1">
              O histórico de atividades será registrado conforme ações forem realizadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
