import { trpc } from "@/lib/trpc";
import { ContractAmendments } from "./ContractAmendments";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Tag,
  Sparkles,
  GitBranch,
  Users,
  History,
  Send,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
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

const signerRoleLabels: Record<string, string> = {
  contractor: "Contratante",
  contracted: "Contratado",
  witness: "Testemunha",
  guarantor: "Fiador",
};

const signerStatusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "text-yellow-600 bg-yellow-50" },
  signed: { label: "Assinado", icon: CheckCircle2, className: "text-green-600 bg-green-50" },
  refused: { label: "Recusado", icon: XCircle, className: "text-red-600 bg-red-50" },
  expired: { label: "Expirado", icon: AlertTriangle, className: "text-gray-500 bg-gray-50" },
};

export function ContractViewer({ contractId, open, onOpenChange }: ContractViewerProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: open && contractId > 0 }
  );

  const { data: signers, isLoading: signersLoading } = trpc.contracts.listSigners.useQuery(
    { contractId },
    { enabled: open && contractId > 0 }
  );

  const { data: versions } = trpc.contracts.listVersions.useQuery(
    { contractId },
    { enabled: open && contractId > 0 }
  );

  const { data: clicksignEvents } = trpc.contracts.listClicksignEvents.useQuery(
    { contractId },
    { enabled: open && contractId > 0 }
  );

  // Signer form state
  const [showSignerForm, setShowSignerForm] = useState(false);
  const [signerForm, setSignerForm] = useState({
    name: "",
    email: "",
    cpfCnpj: "",
    role: "contractor" as "contractor" | "contracted" | "witness" | "guarantor",
    signOrder: 1,
  });
  const [deleteSignerId, setDeleteSignerId] = useState<number | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    status: "",
    object: "",
    totalValue: "",
    paymentTerms: "",
    notes: "",
  });

  // Version description
  const [versionDesc, setVersionDesc] = useState("");
  const [showVersionDialog, setShowVersionDialog] = useState(false);

  // Mutations
  const addSignerMutation = trpc.contracts.addSigner.useMutation({
    onSuccess: () => {
      toast.success("Signatário adicionado");
      utils.contracts.listSigners.invalidate({ contractId });
      setShowSignerForm(false);
      setSignerForm({ name: "", email: "", cpfCnpj: "", role: "contractor", signOrder: 1 });
    },
    onError: (err) => toast.error("Erro ao adicionar signatário", { description: err.message }),
  });

  const removeSignerMutation = trpc.contracts.removeSigner.useMutation({
    onSuccess: () => {
      toast.success("Signatário removido");
      utils.contracts.listSigners.invalidate({ contractId });
      setDeleteSignerId(null);
    },
    onError: (err) => toast.error("Erro ao remover", { description: err.message }),
  });

  const sendToClicksignMutation = trpc.contracts.sendToClicksign.useMutation({
    onSuccess: (result) => {
      toast.success("Enviado para assinatura", { description: result.message });
      utils.contracts.listClicksignEvents.invalidate({ contractId });
      utils.contracts.getById.invalidate({ id: contractId });
    },
    onError: (err) => toast.error("Erro ao enviar", { description: err.message }),
  });

  const resendMutation = trpc.contracts.resendNotification.useMutation({
    onSuccess: (result: any) => {
      toast.success(result.message);
      utils.contracts.listClicksignEvents.invalidate({ contractId });
    },
    onError: (err: any) => toast.error("Erro ao reenviar", { description: err.message }),
  });

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado");
      utils.contracts.getById.invalidate({ id: contractId });
      setIsEditing(false);
    },
    onError: (err) => toast.error("Erro ao atualizar", { description: err.message }),
  });

  const cancelClicksignMutation = trpc.contracts.cancelClicksign.useMutation({
    onSuccess: (result: any) => {
      toast.success(result.message);
      utils.contracts.getById.invalidate({ id: contractId });
      utils.contracts.listClicksignEvents.invalidate({ contractId });
      utils.contracts.listSigners.invalidate({ contractId });
    },
    onError: (err: any) => toast.error("Erro ao cancelar", { description: err.message }),
  });

  const syncStatusMutation = trpc.contracts.syncClicksignStatus.useMutation({
    onSuccess: (result: any) => {
      toast.success(result.message);
      utils.contracts.getById.invalidate({ id: contractId });
      utils.contracts.listClicksignEvents.invalidate({ contractId });
    },
    onError: (err: any) => toast.error("Erro ao sincronizar", { description: err.message }),
  });

  const createVersionMutation = trpc.contracts.createVersion.useMutation({
    onSuccess: (result) => {
      toast.success(`Versão ${result.versionNumber} salva`);
      utils.contracts.listVersions.invalidate({ contractId });
      setShowVersionDialog(false);
      setVersionDesc("");
    },
    onError: (err) => toast.error("Erro ao salvar versão", { description: err.message }),
  });

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

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("pt-BR");
  };

  const contract = data?.contract;
  const items = data?.items || [];
  const effectiveEndDate = data?.effectiveEndDate;
  const effectiveSource = data?.source;
  const amendmentTitle = data?.amendmentTitle;
  const sc = contract ? (statusConfig[contract.status] || statusConfig.draft) : null;

  const startEditing = () => {
    if (!contract) return;
    setEditForm({
      title: contract.title || "",
      status: contract.status || "draft",
      object: contract.object || "",
      totalValue: contract.totalValue || "",
      paymentTerms: contract.paymentTerms || "",
      notes: contract.notes || "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      id: contractId,
      ...editForm,
      status: editForm.status as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    {canManage && !isEditing && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={startEditing}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
                <TabsTrigger value="signers" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Signatários {signers && signers.length > 0 && `(${signers.length})`}
                </TabsTrigger>
                <TabsTrigger value="versions" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  Versões {versions && versions.length > 0 && `(${versions.length})`}
                </TabsTrigger>
                <TabsTrigger value="signing" className="text-xs">
                  <Send className="h-3 w-3 mr-1" />
                  Assinatura
                </TabsTrigger>
              </TabsList>

              {/* ==================== TAB: DETALHES ==================== */}
              <TabsContent value="details" className="space-y-5 pt-2">
                {isEditing ? (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Editando Contrato</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                          <Save className="h-3 w-3 mr-1" />
                          {updateMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Status</Label>
                        <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Objeto</Label>
                        <Input
                          value={editForm.object}
                          onChange={(e) => setEditForm(f => ({ ...f, object: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor Total</Label>
                        <Input
                          value={editForm.totalValue}
                          onChange={(e) => setEditForm(f => ({ ...f, totalValue: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Condições de Pagamento</Label>
                        <Input
                          value={editForm.paymentTerms}
                          onChange={(e) => setEditForm(f => ({ ...f, paymentTerms: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Observações</Label>
                        <Input
                          value={editForm.notes}
                          onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary Row with effective end date */}
                    <TooltipProvider>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`rounded-lg p-3 text-center ${effectiveSource === "amendment" ? "bg-blue-50 border border-blue-200" : "bg-muted/40"}`}>
                              {effectiveSource === "amendment" ? (
                                <GitBranch className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                              ) : (
                                <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                              )}
                              <p className="text-xs text-muted-foreground">Término Efetivo</p>
                              <p className={`font-semibold text-sm ${effectiveSource === "amendment" ? "text-blue-700" : ""}`}>
                                {formatDate(effectiveEndDate)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {effectiveSource === "amendment"
                              ? `Vigência prorrogada pelo aditivo: ${amendmentTitle || "aditivo ativo"}`
                              : "Vigência original do contrato"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>

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
                  </>
                )}
              </TabsContent>

              {/* ==================== TAB: SIGNATÁRIOS ==================== */}
              <TabsContent value="signers" className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Signatários do Contrato</p>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setShowSignerForm(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>

                {showSignerForm && (
                  <Card className="border-dashed border-primary/40">
                    <CardContent className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            value={signerForm.name}
                            onChange={(e) => setSignerForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nome completo"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">E-mail *</Label>
                          <Input
                            value={signerForm.email}
                            onChange={(e) => setSignerForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="email@exemplo.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">CPF/CNPJ</Label>
                          <Input
                            value={signerForm.cpfCnpj}
                            onChange={(e) => setSignerForm(f => ({ ...f, cpfCnpj: e.target.value }))}
                            placeholder="000.000.000-00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Papel</Label>
                          <Select value={signerForm.role} onValueChange={(v: any) => setSignerForm(f => ({ ...f, role: v }))}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contractor">Contratante</SelectItem>
                              <SelectItem value="contracted">Contratado</SelectItem>
                              <SelectItem value="witness">Testemunha</SelectItem>
                              <SelectItem value="guarantor">Fiador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowSignerForm(false)}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addSignerMutation.mutate({ contractId, ...signerForm })}
                          disabled={!signerForm.name || !signerForm.email || addSignerMutation.isPending}
                        >
                          {addSignerMutation.isPending ? "Adicionando..." : "Adicionar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {signersLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : signers && signers.length > 0 ? (
                  <div className="space-y-2">
                    {signers.map((signer) => {
                      const st = signerStatusConfig[signer.status] || signerStatusConfig.pending;
                      const StatusIcon = st.icon;
                      return (
                        <div key={signer.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${st.className}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{signer.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {signerRoleLabels[signer.role] || signer.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{signer.email}</p>
                            {signer.cpfCnpj && (
                              <p className="text-xs text-muted-foreground">CPF/CNPJ: {signer.cpfCnpj}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-xs border-0 ${st.className}`}>{st.label}</Badge>
                            {signer.status === "pending" && canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => resendMutation.mutate({ contractId, message: `Lembrete para ${signer.name}: por favor assine o documento.` })}
                                disabled={resendMutation.isPending}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteSignerId(signer.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum signatário adicionado</p>
                    <p className="text-xs mt-1">Adicione signatários para enviar o contrato para assinatura</p>
                  </div>
                )}
              </TabsContent>

              {/* ==================== TAB: VERSÕES ==================== */}
              <TabsContent value="versions" className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Histórico de Versões</p>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setShowVersionDialog(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Salvar Versão
                    </Button>
                  )}
                </div>

                {versions && versions.length > 0 ? (
                  <div className="space-y-2">
                    {versions.map((ver) => (
                      <div key={ver.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold">v{ver.versionNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ver.changeDescription || `Versão ${ver.versionNumber}`}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDateTime(ver.createdAt)}</span>
                            {ver.title && <span>Título: {ver.title}</span>}
                            {ver.totalValue && <span>Valor: {formatCurrency(ver.totalValue)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma versão salva</p>
                    <p className="text-xs mt-1">Salve versões para manter o histórico de alterações</p>
                  </div>
                )}
              </TabsContent>

              {/* ==================== TAB: ASSINATURA ==================== */}
              <TabsContent value="signing" className="space-y-4 pt-2">
                {/* Status Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Assinatura Digital (Clicksign)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Signature Status Banner */}
                    {(() => {
                      const sigStatus = contract?.signatureStatus || "not_sent";
                      const statusMap: Record<string, { label: string; desc: string; color: string; icon: any }> = {
                        not_sent: { label: "Não enviado", desc: "O contrato ainda não foi enviado para assinatura.", color: "bg-gray-50 border-gray-200 text-gray-700", icon: Clock },
                        sending: { label: "Enviando...", desc: "O contrato está sendo processado pelo Clicksign.", color: "bg-blue-50 border-blue-200 text-blue-700", icon: RefreshCw },
                        sent: { label: "Enviado", desc: "Aguardando assinatura dos signatários.", color: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: Send },
                        partially_signed: { label: "Parcialmente assinado", desc: "Alguns signatários já assinaram.", color: "bg-amber-50 border-amber-200 text-amber-700", icon: UserCheck },
                        signed: { label: "Assinado", desc: "Todos os signatários assinaram o contrato.", color: "bg-green-50 border-green-200 text-green-700", icon: CheckCircle2 },
                        refused: { label: "Recusado", desc: "Um ou mais signatários recusaram a assinatura.", color: "bg-red-50 border-red-200 text-red-700", icon: XCircle },
                        cancelled: { label: "Cancelado", desc: "O envelope foi cancelado no Clicksign.", color: "bg-gray-50 border-gray-200 text-gray-500", icon: XCircle },
                        expired: { label: "Expirado", desc: "O prazo de assinatura expirou.", color: "bg-orange-50 border-orange-200 text-orange-600", icon: AlertTriangle },
                        send_failed: { label: "Falha no envio", desc: contract?.lastSendError || "Ocorreu um erro ao enviar para o Clicksign.", color: "bg-red-50 border-red-200 text-red-700", icon: AlertTriangle },
                      };
                      const st = statusMap[sigStatus] || statusMap.not_sent;
                      const StIcon = st.icon;
                      return (
                        <div className={`flex items-start gap-3 p-3 rounded-lg border ${st.color}`}>
                          <StIcon className={`h-5 w-5 mt-0.5 ${sigStatus === "sending" ? "animate-spin" : ""}`} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{st.label}</p>
                            <p className="text-xs mt-0.5 opacity-80">{st.desc}</p>
                            {contract?.clicksignEnvelopeId && (
                              <p className="text-xs mt-1 font-mono opacity-60">Envelope: {contract.clicksignEnvelopeId}</p>
                            )}
                            {contract?.sendAttemptCount && contract.sendAttemptCount > 0 && (
                              <p className="text-xs mt-0.5 opacity-60">
                                Tentativas: {contract.sendAttemptCount} | Última: {formatDateTime(contract.lastSendAttemptAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Send Button - only when not_sent or send_failed */}
                      {(contract?.signatureStatus === "not_sent" || contract?.signatureStatus === "send_failed" || !contract?.signatureStatus) && canManage && (
                        <Button
                          onClick={() => sendToClicksignMutation.mutate({ contractId })}
                          disabled={sendToClicksignMutation.isPending || !signers || signers.length === 0}
                          className="bg-[oklch(0.50_0.15_15)] hover:bg-[oklch(0.45_0.15_15)]"
                        >
                          {sendToClicksignMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {contract?.signatureStatus === "send_failed" ? "Tentar Novamente" : "Enviar para Assinatura"}
                        </Button>
                      )}

                      {/* Resend Notification - when sent or partially_signed */}
                      {(contract?.signatureStatus === "sent" || contract?.signatureStatus === "partially_signed") && canManage && (
                        <Button
                          variant="outline"
                          onClick={() => resendMutation.mutate({ contractId })}
                          disabled={resendMutation.isPending}
                        >
                          {resendMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          Reenviar Notificação
                        </Button>
                      )}

                      {/* Cancel - when sent or partially_signed */}
                      {(contract?.signatureStatus === "sent" || contract?.signatureStatus === "partially_signed") && canManage && (
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja cancelar o envio no Clicksign? Esta ação não pode ser desfeita.")) {
                              cancelClicksignMutation.mutate({ contractId });
                            }
                          }}
                          disabled={cancelClicksignMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar Envio
                        </Button>
                      )}

                      {/* Validation warnings */}
                      {(!signers || signers.length === 0) && !contract?.signatureStatus && (
                        <p className="text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Adicione signatários na aba anterior
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Clicksign Events Log */}
                {clicksignEvents && clicksignEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Histórico de Eventos</p>
                    <div className="space-y-2">
                      {clicksignEvents.map((event) => {
                        const eventLabels: Record<string, string> = {
                          envelope_created: "Envelope criado",
                          document_uploaded: "Documento enviado",
                          signers_added: "Signatários adicionados",
                          requirements_set: "Requisitos configurados",
                          envelope_activated: "Envelope ativado",
                          notification_sent: "Notificação enviada",
                          signer_signed: "Signatário assinou",
                          signer_refused: "Signatário recusou",
                          envelope_completed: "Assinatura concluída",
                          envelope_cancelled: "Envelope cancelado",
                          envelope_expired: "Envelope expirado",
                          send_failed: "Falha no envio",
                          resend: "Reenvio de notificação",
                          webhook_received: "Evento recebido",
                        };
                        const eventColors: Record<string, string> = {
                          envelope_activated: "bg-green-100 text-green-700",
                          notification_sent: "bg-blue-100 text-blue-700",
                          signer_signed: "bg-green-100 text-green-700",
                          signer_refused: "bg-red-100 text-red-700",
                          envelope_completed: "bg-green-100 text-green-700",
                          envelope_cancelled: "bg-gray-100 text-gray-500",
                          send_failed: "bg-red-100 text-red-700",
                          resend: "bg-blue-100 text-blue-700",
                        };
                        const color = eventColors[event.eventType] || "bg-muted text-muted-foreground";
                        return (
                          <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg border text-xs">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${color}`}>
                              <FileText className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{eventLabels[event.eventType] || event.eventType}</span>
                              {event.errorMessage && (
                                <p className="text-red-600 mt-0.5 truncate" title={event.errorMessage}>
                                  Erro: {event.errorMessage}
                                </p>
                              )}
                              {event.httpStatus && (
                                <span className="ml-2 text-muted-foreground">HTTP {event.httpStatus}</span>
                              )}
                            </div>
                            <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(event.createdAt)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Contrato não encontrado
          </div>
        )}
      </DialogContent>

      {/* Delete Signer Confirmation */}
      <AlertDialog open={deleteSignerId !== null} onOpenChange={(v) => { if (!v) setDeleteSignerId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Signatário</AlertDialogTitle>
            <AlertDialogDescription>
              O signatário será removido deste contrato. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteSignerId && removeSignerMutation.mutate({ id: deleteSignerId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Version Dialog */}
      <AlertDialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar Versão</AlertDialogTitle>
            <AlertDialogDescription>
              Descreva brevemente o que mudou nesta versão do contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={versionDesc}
              onChange={(e) => setVersionDesc(e.target.value)}
              placeholder="Ex: Ajuste de cláusula de pagamento"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => createVersionMutation.mutate({ contractId, changeDescription: versionDesc })}
              disabled={createVersionMutation.isPending}
            >
              {createVersionMutation.isPending ? "Salvando..." : "Salvar Versão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
