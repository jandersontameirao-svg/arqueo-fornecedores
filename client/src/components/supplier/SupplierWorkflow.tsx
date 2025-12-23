import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface SupplierWorkflowProps {
  supplierId: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <AlertCircle className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

export default function SupplierWorkflow({ supplierId }: SupplierWorkflowProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState("");
  const utils = trpc.useUtils();

  const { data: workflow, isLoading } = trpc.workflows.getBySupplierId.useQuery({ supplierId });
  const { data: steps } = trpc.workflows.getSteps.useQuery(
    { workflowId: workflow?.id || 0 },
    { enabled: !!workflow?.id }
  );

  const approveMutation = trpc.workflows.approveStep.useMutation({
    onSuccess: () => {
      toast.success("Etapa aprovada com sucesso!");
      utils.workflows.getBySupplierId.invalidate({ supplierId });
      utils.workflows.getSteps.invalidate({ workflowId: workflow?.id || 0 });
      utils.suppliers.getById.invalidate({ id: supplierId });
      setComments("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.workflows.rejectStep.useMutation({
    onSuccess: () => {
      toast.success("Workflow rejeitado");
      utils.workflows.getBySupplierId.invalidate({ supplierId });
      utils.workflows.getSteps.invalidate({ workflowId: workflow?.id || 0 });
      utils.suppliers.getById.invalidate({ id: supplierId });
      setComments("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canApprove = isAdmin || isManager;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow de Aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum workflow de aprovação iniciado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = steps?.find((s) => s.step.stepNumber === workflow.currentStep && s.step.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Workflow de Aprovação</CardTitle>
          <Badge className={statusColors[workflow.status]}>
            {statusIcons[workflow.status]}
            <span className="ml-1">{statusLabels[workflow.status]}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <span className="text-sm font-medium">
            Etapa {workflow.currentStep} de {workflow.totalSteps}
          </span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-primary transition-all"
            style={{ width: `${(workflow.currentStep / workflow.totalSteps) * 100}%` }}
          />
        </div>

        {/* Steps Timeline */}
        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((item) => {
              const isCompleted = item.step.status === "approved";
              const isRejected = item.step.status === "rejected";
              const isCurrent = item.step.stepNumber === workflow.currentStep && workflow.status !== "approved" && workflow.status !== "rejected";
              const isPending = item.step.status === "pending" && !isCurrent;

              return (
                <div
                  key={item.step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isCompleted
                      ? "border-green-200 bg-green-50"
                      : isRejected
                      ? "border-red-200 bg-red-50"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isRejected
                        ? "bg-red-500 text-white"
                        : isCurrent
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isRejected ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{item.step.stepNumber}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{item.step.stepName}</p>
                      {isCurrent && (
                        <Badge variant="outline" className="text-primary border-primary">
                          Atual
                        </Badge>
                      )}
                    </div>
                    {item.step.approvedAt && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {isCompleted ? "Aprovado" : "Rejeitado"}
                        </span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>
                          {new Date(item.step.approvedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                    {item.step.comments && (
                      <div className="flex items-start gap-2 mt-2 text-xs">
                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{item.step.comments}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {workflow.status !== "approved" && workflow.status !== "rejected" && canApprove && currentStepData && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentários (opcional)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Adicione um comentário sobre esta etapa..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  approveMutation.mutate({
                    stepId: currentStepData.step.id,
                    workflowId: workflow.id,
                    comments: comments || undefined,
                  })
                }
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {workflow.currentStep === workflow.totalSteps
                  ? "Aprovar Fornecedor"
                  : "Aprovar Etapa"}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  rejectMutation.mutate({
                    stepId: currentStepData.step.id,
                    workflowId: workflow.id,
                    comments: comments || "Rejeitado",
                  })
                }
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {workflow.status === "approved" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Fornecedor Aprovado</p>
              <p className="text-sm text-green-600">
                Todas as etapas de homologação foram concluídas com sucesso.
              </p>
            </div>
          </div>
        )}

        {workflow.status === "rejected" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Fornecedor Rejeitado</p>
              <p className="text-sm text-red-600">
                O processo de homologação foi rejeitado.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
