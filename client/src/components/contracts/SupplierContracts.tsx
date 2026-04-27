import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Tag,
  GitBranch,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { ContractCreationModal, type ContractCreationMode } from "./ContractCreationModal";
import { ContractEditor } from "./ContractEditor";
import { ContractViewer } from "./ContractViewer";
import { ContractPDFImport } from "./ContractPDFImport";

interface SupplierContractsProps {
  supplierId: number;
  supplierName: string;
  supplierCnpj: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-gray-100 text-gray-700" },
  review: { label: "Em Revisão", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Ativo", className: "bg-green-100 text-green-700" },
  suspended: { label: "Suspenso", className: "bg-orange-100 text-orange-700" },
  expired: { label: "Expirado", className: "bg-red-100 text-red-700" },
  terminated: { label: "Encerrado", className: "bg-gray-100 text-gray-500" },
};

const typeLabels: Record<string, string> = {
  service: "Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

export default function SupplierContracts({ supplierId, supplierName, supplierCnpj }: SupplierContractsProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ContractCreationMode | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerId, setViewerId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: contractRows, isLoading } = trpc.contracts.listBySupplier.useQuery({ supplierId });

  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato excluído");
      utils.contracts.listBySupplier.invalidate({ supplierId });
      setDeleteId(null);
    },
    onError: (err) => toast.error("Erro ao excluir", { description: err.message }),
  });

  const [pdfImportOpen, setPdfImportOpen] = useState(false);

  const handleModeSelect = (mode: ContractCreationMode) => {
    setSelectedMode(mode);
    if (mode === "pdf") {
      setPdfImportOpen(true);
    } else {
      setEditorOpen(true);
    }
  };

  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("pt-BR");
  };

  /** Retorna true se a vigência efetiva vence nos próximos 7 dias */
  const isExpiringSoon = (effectiveEndDate: Date | null | undefined) => {
    if (!effectiveEndDate) return false;
    const now = Date.now();
    const end = new Date(effectiveEndDate).getTime();
    const diff = end - now;
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Contratos</h3>
          <p className="text-sm text-muted-foreground">
            {contractRows?.length || 0} contrato{(contractRows?.length || 0) !== 1 ? "s" : ""} cadastrado{(contractRows?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/generate-contract?supplierId=${supplierId}`)}
            >
              <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
              Gerar via Template
            </Button>
            <Button
              onClick={() => setCreationModalOpen(true)}
              className="bg-[oklch(0.50_0.15_15)] hover:bg-[oklch(0.45_0.15_15)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contractRows && contractRows.length > 0 ? (
        <TooltipProvider>
          <div className="space-y-3">
            {contractRows.map((row) => {
              const { contract, effectiveEndDate, source, amendmentTitle } = row;
              const sc = statusConfig[contract.status] || statusConfig.draft;
              const expiringSoon = isExpiringSoon(effectiveEndDate);
              return (
                <Card
                  key={contract.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${expiringSoon ? "border-amber-400 ring-1 ring-amber-300" : ""}`}
                  onClick={() => setViewerId(contract.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{contract.title}</p>
                            {contract.number && (
                              <span className="text-xs text-muted-foreground">#{contract.number}</span>
                            )}
                            {expiringSoon && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 cursor-help">
                                    <AlertTriangle className="h-3 w-3" />
                                    Vence em breve
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Vigência efetiva encerra em {formatDate(effectiveEndDate)}
                                  {source === "amendment" && amendmentTitle
                                    ? ` (via aditivo: ${amendmentTitle})`
                                    : ""}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <Badge className={`text-xs border-0 ${sc.className}`}>
                              {sc.label}
                            </Badge>
                            {contract.contractType && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="h-3 w-3" />
                                {typeLabels[contract.contractType] || contract.contractType}
                              </span>
                            )}
                            {contract.totalValue && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(contract.totalValue)}
                              </span>
                            )}
                            {/* Vigência efetiva: usa effectiveEndDate em vez de endDate */}
                            {(contract.startDate || effectiveEndDate) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`flex items-center gap-1 text-xs cursor-help ${source === "amendment" ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                                    {source === "amendment" ? (
                                      <GitBranch className="h-3 w-3" />
                                    ) : (
                                      <Calendar className="h-3 w-3" />
                                    )}
                                    {formatDate(contract.startDate)} — {formatDate(effectiveEndDate) || "Indeterminado"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {source === "amendment"
                                    ? `Vigência prorrogada pelo aditivo: ${amendmentTitle || "aditivo ativo"}`
                                    : "Vigência original do contrato"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {contract.object && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{contract.object}</p>
                          )}
                        </div>
                      </div>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewerId(contract.id); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(contract.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Nenhum contrato cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie o primeiro contrato para este fornecedor
              </p>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => setCreationModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creation Mode Modal */}
      <ContractCreationModal
        open={creationModalOpen}
        onOpenChange={setCreationModalOpen}
        onSelect={handleModeSelect}
      />

      {/* Contract Editor */}
      {selectedMode && (
        <ContractEditor
          supplierId={supplierId}
          supplierName={supplierName}
          supplierCnpj={supplierCnpj}
          mode={selectedMode}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSuccess={() => utils.contracts.listBySupplier.invalidate({ supplierId })}
          existingContracts={contractRows?.map((r) => ({ id: r.contract.id, title: r.contract.title })) || []}
        />
      )}

      {/* Contract Viewer */}
      {viewerId !== null && (
        <ContractViewer
          contractId={viewerId}
          open={viewerId !== null}
          onOpenChange={(v: boolean) => { if (!v) setViewerId(null); }}
        />
      )}

      {/* PDF Import */}
      <ContractPDFImport
        supplierId={supplierId}
        open={pdfImportOpen}
        onClose={() => setPdfImportOpen(false)}
        onSuccess={() => utils.contracts.listBySupplier.invalidate({ supplierId })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contrato será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
