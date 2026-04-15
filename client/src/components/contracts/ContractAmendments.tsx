import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Save,
  FilePlus,
} from "lucide-react";

interface ContractAmendmentsProps {
  contractId: number;
  canManage: boolean;
}

const amendmentTypeLabels: Record<string, string> = {
  financial: "Financeiro",
  scope: "Escopo",
  term: "Prazo",
  mixed: "Misto",
};

const amendmentTypeColors: Record<string, string> = {
  financial: "bg-blue-100 text-blue-700 border-blue-200",
  scope: "bg-purple-100 text-purple-700 border-purple-200",
  term: "bg-orange-100 text-orange-700 border-orange-200",
  mixed: "bg-gray-100 text-gray-700 border-gray-200",
};

const amendmentStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Em Revisão",
  active: "Ativo",
  terminated: "Encerrado",
};

const amendmentStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  active: "bg-green-100 text-green-700 border-green-200",
  terminated: "bg-red-100 text-red-600 border-red-200",
};

const milestoneStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  cancelled: "Cancelado",
};

const milestoneStatusColors: Record<string, string> = {
  pending: "text-yellow-600",
  paid: "text-green-600",
  overdue: "text-red-600",
  cancelled: "text-gray-400",
};

function MilestoneStatusIcon({ status }: { status: string }) {
  if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "overdue") return <AlertTriangle className="h-4 w-4 text-red-600" />;
  if (status === "cancelled") return <X className="h-4 w-4 text-gray-400" />;
  return <Clock className="h-4 w-4 text-yellow-600" />;
}

function formatCurrency(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

// ===== MILESTONE FORM =====
interface MilestoneFormProps {
  contractId: number;
  amendmentId?: number;
  milestoneId?: number;
  initial?: Record<string, unknown>;
  onSuccess: () => void;
  onCancel: () => void;
}

function MilestoneForm({ contractId, amendmentId, milestoneId, initial, onSuccess, onCancel }: MilestoneFormProps) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState((initial?.title as string) || "");
  const [description, setDescription] = useState((initial?.description as string) || "");
  const [plannedValue, setPlannedValue] = useState((initial?.plannedValue as string) || "");
  const [paidValue, setPaidValue] = useState((initial?.paidValue as string) || "");
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? new Date(initial.dueDate as string).toISOString().split("T")[0] : ""
  );
  const [paidAt, setPaidAt] = useState(
    initial?.paidAt ? new Date(initial.paidAt as string).toISOString().split("T")[0] : ""
  );
  const [paymentDeadlineDays, setPaymentDeadlineDays] = useState(
    (initial?.paymentDeadlineDays as number)?.toString() || "30"
  );
  const [status, setStatus] = useState((initial?.status as string) || "pending");
  const [notes, setNotes] = useState((initial?.notes as string) || "");

  const invalidate = () => {
    utils.milestones.listByContract.invalidate({ contractId });
    if (amendmentId) utils.milestones.listByAmendment.invalidate({ amendmentId });
  };

  const createMutation = trpc.milestones.create.useMutation({
    onSuccess: () => { toast.success("Marco criado!"); invalidate(); onSuccess(); },
    onError: (e) => toast.error("Erro ao criar marco", { description: e.message }),
  });

  const updateMutation = trpc.milestones.update.useMutation({
    onSuccess: () => { toast.success("Marco atualizado!"); invalidate(); onSuccess(); },
    onError: (e) => toast.error("Erro ao atualizar marco", { description: e.message }),
  });

  const handleSave = () => {
    if (!title.trim() || !plannedValue || !dueDate) {
      toast.error("Preencha título, valor previsto e data de vencimento");
      return;
    }
    if (milestoneId) {
      updateMutation.mutate({
        id: milestoneId,
        title, description, plannedValue,
        paidValue: paidValue || undefined,
        dueDate,
        paidAt: paidAt || undefined,
        paymentDeadlineDays: parseInt(paymentDeadlineDays) || 30,
        status: status as "pending" | "paid" | "overdue" | "cancelled",
        notes,
      });
    } else {
      createMutation.mutate({
        contractId,
        amendmentId,
        title, description, plannedValue,
        paidValue: paidValue || undefined,
        dueDate,
        paidAt: paidAt || undefined,
        paymentDeadlineDays: parseInt(paymentDeadlineDays) || 30,
        status: status as "pending" | "paid" | "overdue" | "cancelled",
        notes,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-primary">{milestoneId ? "Editar Marco" : "Novo Marco Financeiro"}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Parcela 1 - Mobilização" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor Previsto (R$) *</Label>
          <Input type="number" step="0.01" value={plannedValue} onChange={(e) => setPlannedValue(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor Pago (R$)</Label>
          <Input type="number" step="0.01" value={paidValue} onChange={(e) => setPaidValue(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data de Vencimento *</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data de Pagamento</Label>
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prazo de Pagamento (dias)</Label>
          <Input type="number" value={paymentDeadlineDays} onChange={(e) => setPaymentDeadlineDays(e.target.value)} placeholder="30" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descrição do marco..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="Notas internas..." />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ===== MILESTONE LIST =====
function MilestoneList({ contractId, amendmentId, canManage }: { contractId: number; amendmentId?: number; canManage: boolean }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: milestonesFromContract } = trpc.milestones.listByContract.useQuery(
    { contractId },
    { enabled: !amendmentId }
  );
  const { data: milestonesFromAmendment } = trpc.milestones.listByAmendment.useQuery(
    { amendmentId: amendmentId! },
    { enabled: !!amendmentId }
  );
  const milestones = amendmentId ? milestonesFromAmendment : milestonesFromContract;

  const deleteMutation = trpc.milestones.delete.useMutation({
    onSuccess: () => {
      toast.success("Marco excluído");
      utils.milestones.listByContract.invalidate({ contractId });
      if (amendmentId) utils.milestones.listByAmendment.invalidate({ amendmentId });
      setDeleteId(null);
    },
    onError: (e) => toast.error("Erro ao excluir", { description: e.message }),
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Marcos Financeiros</p>
        {canManage && !showForm && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Marco
          </Button>
        )}
      </div>

      {showForm && (
        <MilestoneForm
          contractId={contractId}
          amendmentId={amendmentId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {milestones && milestones.length > 0 ? (
        <div className="space-y-2">
          {milestones.map((m) => {
            const isOverdue = m.status === "overdue";
            return (
              <div key={m.id}>
                {editId === m.id ? (
                  <MilestoneForm
                    contractId={contractId}
                    amendmentId={amendmentId}
                    milestoneId={m.id}
                    initial={m as Record<string, unknown>}
                    onSuccess={() => setEditId(null)}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div className={`rounded-lg border p-3 ${isOverdue ? "border-red-200 bg-red-50/50" : "bg-muted/20"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <MilestoneStatusIcon status={m.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{m.title}</p>
                            <Badge variant="outline" className={`text-xs ${milestoneStatusColors[m.status] || ""}`}>
                              {milestoneStatusLabels[m.status] || m.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-1.5">
                            <div>
                              <p className="text-xs text-muted-foreground">Previsto</p>
                              <p className="text-xs font-semibold">{formatCurrency(m.plannedValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Pago</p>
                              <p className="text-xs font-semibold">{formatCurrency(m.paidValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimento</p>
                              <p className={`text-xs font-semibold ${isOverdue ? "text-red-600" : ""}`}>{formatDate(m.dueDate)}</p>
                            </div>
                          </div>
                          {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditId(m.id)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <p className="text-xs text-muted-foreground italic py-2">Nenhum marco financeiro cadastrado.</p>
        )
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Marco</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

// ===== AMENDMENT FORM DIALOG =====
interface AmendmentFormDialogProps {
  contractId: number;
  open: boolean;
  onClose: () => void;
  initial?: Record<string, unknown>;
  amendmentId?: number;
}

function AmendmentFormDialog({ contractId, open, onClose, initial, amendmentId }: AmendmentFormDialogProps) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState((initial?.title as string) || "");
  const [number, setNumber] = useState((initial?.number as string) || "");
  const [amendmentType, setAmendmentType] = useState((initial?.amendmentType as string) || "financial");
  const [status, setStatus] = useState((initial?.status as string) || "draft");
  const [description, setDescription] = useState((initial?.description as string) || "");
  const [valueChange, setValueChange] = useState((initial?.valueChange as string) || "");
  const [newTotalValue, setNewTotalValue] = useState((initial?.newTotalValue as string) || "");
  const [newEndDate, setNewEndDate] = useState(
    initial?.newEndDate ? new Date(initial.newEndDate as string).toISOString().split("T")[0] : ""
  );
  const [content, setContent] = useState((initial?.content as string) || "");
  const [notes, setNotes] = useState((initial?.notes as string) || "");

  const invalidate = () => utils.amendments.listByContract.invalidate({ contractId });

  const createMutation = trpc.amendments.create.useMutation({
    onSuccess: () => { toast.success("Aditivo criado!"); invalidate(); onClose(); },
    onError: (e) => toast.error("Erro ao criar aditivo", { description: e.message }),
  });

  const updateMutation = trpc.amendments.update.useMutation({
    onSuccess: () => { toast.success("Aditivo atualizado!"); invalidate(); onClose(); },
    onError: (e) => toast.error("Erro ao atualizar aditivo", { description: e.message }),
  });

  const handleSave = () => {
    if (!title.trim()) { toast.error("Informe o título do aditivo"); return; }
    if (amendmentId) {
      updateMutation.mutate({
        id: amendmentId,
        title, number: number || undefined,
        amendmentType: amendmentType as "financial" | "scope" | "term" | "mixed",
        status: status as "draft" | "review" | "active" | "terminated",
        description, valueChange, newTotalValue,
        newEndDate: newEndDate || undefined,
        content, notes,
      });
    } else {
      createMutation.mutate({
        contractId, title, number: number || undefined,
        amendmentType: amendmentType as "financial" | "scope" | "term" | "mixed",
        status: status as "draft" | "review" | "active" | "terminated",
        description, valueChange, newTotalValue,
        newEndDate: newEndDate || undefined,
        content, notes,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{amendmentId ? "Editar Aditivo" : "Novo Aditivo Contratual"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Título do Aditivo *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aditivo nº 1 - Reajuste de Valor" />
            </div>
            <div className="space-y-1">
              <Label>Número</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ex: ADT-001" />
            </div>
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={amendmentType} onValueChange={setAmendmentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="scope">Escopo</SelectItem>
                  <SelectItem value="term">Prazo</SelectItem>
                  <SelectItem value="mixed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="terminated">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nova Data de Término</Label>
              <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
            </div>
            {(amendmentType === "financial" || amendmentType === "mixed") && (
              <>
                <div className="space-y-1">
                  <Label>Variação de Valor (R$)</Label>
                  <Input type="number" step="0.01" value={valueChange} onChange={(e) => setValueChange(e.target.value)} placeholder="Ex: 50000.00" />
                </div>
                <div className="space-y-1">
                  <Label>Novo Valor Total (R$)</Label>
                  <Input type="number" step="0.01" value={newTotalValue} onChange={(e) => setNewTotalValue(e.target.value)} placeholder="Ex: 250000.00" />
                </div>
              </>
            )}
            <div className="col-span-2 space-y-1">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descreva o objeto deste aditivo..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Conteúdo / Cláusulas</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Texto completo do aditivo..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas internas..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {amendmentId ? "Salvar Alterações" : "Criar Aditivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN COMPONENT =====
export function ContractAmendments({ contractId, canManage }: ContractAmendmentsProps) {
  const utils = trpc.useUtils();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editAmendment, setEditAmendment] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: amendments, isLoading } = trpc.amendments.listByContract.useQuery({ contractId });

  const deleteMutation = trpc.amendments.delete.useMutation({
    onSuccess: () => {
      toast.success("Aditivo excluído");
      utils.amendments.listByContract.invalidate({ contractId });
      setDeleteId(null);
    },
    onError: (e) => toast.error("Erro ao excluir", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Aditivos Contratuais</h3>
          <p className="text-xs text-muted-foreground">Gerenciar aditivos financeiros, de escopo e prazo</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <FilePlus className="h-4 w-4 mr-1.5" />
            Novo Aditivo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : amendments && amendments.length > 0 ? (
        <div className="space-y-3">
          {amendments.map((a) => {
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-xl border bg-card overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{a.title}</p>
                      {a.number && <span className="text-xs text-muted-foreground">#{a.number}</span>}
                      <Badge variant="outline" className={`text-xs ${amendmentTypeColors[a.amendmentType] || ""}`}>
                        {amendmentTypeLabels[a.amendmentType] || a.amendmentType}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${amendmentStatusColors[a.status] || ""}`}>
                        {amendmentStatusLabels[a.status] || a.status}
                      </Badge>
                    </div>
                    {a.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      {a.newTotalValue && (
                        <span className="text-xs text-muted-foreground">
                          Novo total: <span className="font-semibold text-foreground">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(a.newTotalValue))}
                          </span>
                        </span>
                      )}
                      {a.newEndDate && (
                        <span className="text-xs text-muted-foreground">
                          Nova vigência: <span className="font-semibold text-foreground">{new Date(a.newEndDate).toLocaleDateString("pt-BR")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditAmendment(a as unknown as Record<string, unknown>)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t bg-muted/10 p-4 space-y-4">
                    {a.content && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Conteúdo</p>
                        <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                      </div>
                    )}
                    <MilestoneList
                      contractId={contractId}
                      amendmentId={a.id}
                      canManage={canManage}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <FilePlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum aditivo cadastrado para este contrato.</p>
          {canManage && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Criar Primeiro Aditivo
            </Button>
          )}
        </div>
      )}

      {/* Marcos do contrato (sem aditivo) */}
      <div className="rounded-xl border p-4">
        <MilestoneList contractId={contractId} canManage={canManage} />
      </div>

      {/* Dialogs */}
      <AmendmentFormDialog
        contractId={contractId}
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {editAmendment && (
        <AmendmentFormDialog
          contractId={contractId}
          open={true}
          onClose={() => setEditAmendment(null)}
          initial={editAmendment}
          amendmentId={editAmendment.id as number}
        />
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aditivo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o aditivo e todos os seus marcos financeiros. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
