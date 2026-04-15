import { trpc } from "@/lib/trpc";
import { ContractAmendments } from "./ContractAmendments";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Tag,
  Sparkles,
} from "lucide-react";

interface ContractViewerProps {
  contractId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  service: "Prestação de Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

const modeLabels: Record<string, string> = {
  manual: "Criado manualmente",
  template: "Criado a partir de template",
  duplicate: "Duplicado de contrato existente",
  ai: "Gerado por IA",
};

export function ContractViewer({ contractId, open, onOpenChange }: ContractViewerProps) {
  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: open && contractId > 0 }
  );

  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const contract = data?.contract;
  const items = data?.items || [];
  const sc = contract ? (statusConfig[contract.status] || statusConfig.draft) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : contract ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg leading-tight">{contract.title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {sc && (
                      <Badge className={`text-xs border-0 ${sc.className}`}>{sc.label}</Badge>
                    )}
                    {contract.contractType && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {typeLabels[contract.contractType] || contract.contractType}
                      </span>
                    )}
                    {contract.number && (
                      <span className="text-xs text-muted-foreground">#{contract.number}</span>
                    )}
                    {contract.creationMode === "ai" && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Summary Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-semibold text-sm">{formatCurrency(contract.totalValue)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-semibold text-sm">{formatDate(contract.startDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Término</p>
                  <p className="font-semibold text-sm">{formatDate(contract.endDate)}</p>
                </div>
              </div>

              {/* Object */}
              {contract.object && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Objeto</p>
                  <p className="text-sm">{contract.object}</p>
                </div>
              )}

              <Separator />

              {/* Parties */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Partes</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">CONTRATANTE</p>
                    </div>
                    <p className="text-sm font-semibold">{contract.contractorName || "—"}</p>
                    {contract.contractorCnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {contract.contractorCnpj}</p>
                    )}
                    {contract.contractorRepresentative && (
                      <p className="text-xs text-muted-foreground">Rep.: {contract.contractorRepresentative}</p>
                    )}
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">CONTRATADA</p>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground italic">
                      (Dados do fornecedor)
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              {contract.paymentTerms && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Condições de Pagamento</p>
                    <p className="text-sm">{contract.paymentTerms}</p>
                  </div>
                </>
              )}

              {/* Items */}
              {items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Itens / Escopo</p>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descrição</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Un.</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Qtd.</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Preço Unit.</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                              <td className="px-3 py-2">{item.description}</td>
                              <td className="px-3 py-2 text-center text-muted-foreground">{item.unit || "—"}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{item.quantity || "—"}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">
                                {item.unitPrice ? formatCurrency(item.unitPrice) : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {item.totalPrice ? formatCurrency(item.totalPrice) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Content */}
              {contract.content && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conteúdo do Contrato</p>
                    <div className="rounded-lg border bg-muted/20 p-4 max-h-80 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                        {contract.content}
                      </pre>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {contract.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observações Internas</p>
                    <p className="text-sm text-muted-foreground">{contract.notes}</p>
                  </div>
                </>
              )}

              {/* Amendments */}
              <Separator />
              <ContractAmendments contractId={contractId} canManage={canManage} />

              {/* Footer meta */}
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                <span>{contract.creationMode ? modeLabels[contract.creationMode] : ""}</span>
                <span>Criado em {formatDate(contract.createdAt)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Contrato não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
