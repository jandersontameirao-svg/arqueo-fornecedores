import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ClipboardCheck,
  Building2,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  X,
} from "lucide-react";

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

export default function Approvals() {
  const [, setLocation] = useLocation();
  const { selectedCompany } = useSelectedCompany();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  // Fornecedor aguardando confirmação de rejeição (ação destrutiva).
  const [rejecting, setRejecting] = useState<{ id: number; name: string } | null>(null);

  const { data: pendingWorkflows, isLoading } = trpc.workflows.getPending.useQuery({
    companyId: selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined,
  });

  // Revalida a fila e os contadores após decidir, para a linha sair da lista.
  const refreshAfterDecision = () => {
    utils.workflows.getPending.invalidate();
    utils.suppliers.list.invalidate();
    utils.dashboard.stats.invalidate();
  };

  const approveMutation = trpc.suppliers.approve.useMutation({
    onSuccess: () => {
      refreshAfterDecision();
      toast.success("Fornecedor aprovado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.suppliers.reject.useMutation({
    onSuccess: () => {
      refreshAfterDecision();
      setRejecting(null);
      toast.success("Fornecedor rejeitado");
    },
    onError: (e) => {
      setRejecting(null);
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aprovações Pendentes</h1>
        <p className="text-muted-foreground">
          Gerencie os workflows de homologação de fornecedores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Workflows Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingWorkflows && pendingWorkflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Iniciado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWorkflows.map((item) => (
                  <TableRow key={item.workflow.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.supplier.companyName}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier.cnpj}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.workflow.status]}>
                        {item.workflow.status === "pending" ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {statusLabels[item.workflow.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${((item.workflow.currentStep - 1) / item.workflow.totalSteps) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.workflow.currentStep}/{item.workflow.totalSteps}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.workflow.startedAt).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Decidir direto na fila evita entrar/sair do fornecedor a cada aprovação. */}
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ id: item.supplier.id })}
                            >
                              <Check className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() =>
                                setRejecting({
                                  id: item.supplier.id,
                                  name: item.supplier.companyName,
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => setLocation(`/suppliers/${item.supplier.id}`)}
                        >
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma aprovação pendente</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Todos os workflows de homologação foram concluídos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmação de rejeição — única ação destrutiva da fila. */}
      <AlertDialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              O fornecedor <strong>{rejecting?.name}</strong> será marcado como rejeitado e sairá
              da fila de homologação. A ação fica registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={rejectMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (rejecting) rejectMutation.mutate({ id: rejecting.id });
              }}
            >
              {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
