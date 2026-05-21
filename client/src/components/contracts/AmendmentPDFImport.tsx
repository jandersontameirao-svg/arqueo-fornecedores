import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Eye,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AmendmentPDFImportProps {
  contractId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const amendmentTypeLabels: Record<string, string> = {
  financial: "Financeiro",
  scope: "Escopo",
  term: "Prazo",
  mixed: "Misto",
};

type ExtractedAmendmentData = {
  title: string;
  number: string;
  amendmentType: string;
  description: string;
  valueChange: string;
  newTotalValue: string;
  newEndDate: string;
  content: string;
  signedAt: string;
  milestones: Array<{
    title: string;
    plannedValue: string;
    dueDate: string;
    description: string;
  }>;
  summary: string;
};

type Step = "upload" | "extracting" | "review" | "saving";

export function AmendmentPDFImport({ contractId, open, onClose, onSuccess }: AmendmentPDFImportProps) {
  const utils = trpc.useUtils();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfKey, setPdfKey] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractedAmendmentData | null>(null);
  const [showMilestones, setShowMilestones] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable review fields
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [amendmentType, setAmendmentType] = useState("financial");
  const [status, setStatus] = useState("review");
  const [description, setDescription] = useState("");
  const [valueChange, setValueChange] = useState("");
  const [newTotalValue, setNewTotalValue] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [milestones, setMilestones] = useState<ExtractedAmendmentData["milestones"]>([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  // Download seguro: gera URL assinada fresca via R2 usando pdfKey permanente
  const getSignedUrlMutation = trpc.storage.getSignedUrl.useMutation({
    onSuccess: ({ url }: { url: string }) => {
      window.open(url, "_blank");
    },
    onError: () => {
      toast.error("Não foi possível abrir o PDF.");
    },
  });

  const extractMutation = trpc.amendments.extractFromPDF.useMutation({
    onSuccess: (data: { extracted: ExtractedAmendmentData; pdfUrl: string; pdfKey?: string }) => {
      const ext = data.extracted as ExtractedAmendmentData;
      setExtracted(ext);
      setPdfUrl(data.pdfUrl);
      setPdfKey(data.pdfKey || "");
      // Populate review fields
      setTitle(ext.title || "");
      setNumber(ext.number || "");
      const validTypes = ["financial", "scope", "term", "mixed"];
      setAmendmentType(validTypes.includes(ext.amendmentType) ? ext.amendmentType : "financial");
      setDescription(ext.description || "");
      setValueChange(ext.valueChange || "");
      setNewTotalValue(ext.newTotalValue || "");
      setNewEndDate(ext.newEndDate || "");
      setSignedAt(ext.signedAt || "");
      setContent(ext.content || "");
      setNotes(ext.summary ? `Resumo IA: ${ext.summary}` : "");
      setMilestones(ext.milestones || []);
      setStep("review");
    },
    onError: (e: { message: string }) => {
      toast.error("Erro ao extrair dados do PDF", { description: e.message });
      setStep("upload");
    },
  });

  const createMilestoneMutation = trpc.milestones.create.useMutation();

  const createMutation = trpc.amendments.create.useMutation({
    onSuccess: async (newAmendment) => {
      // Create milestones if any
      if (milestones.length > 0) {
        for (const m of milestones) {
          try {
            await createMilestoneMutation.mutateAsync({
              contractId,
              amendmentId: newAmendment.id,
              title: m.title,
              description: m.description,
              plannedValue: m.plannedValue,
              dueDate: m.dueDate,
              status: "pending",
              paymentDeadlineDays: 30,
            });
          } catch {
            // Continue even if milestone creation fails
          }
        }
      }
      utils.amendments.listByContract.invalidate({ contractId });
      toast.success("Aditivo importado com sucesso!", {
        description: `${milestones.length} marco(s) financeiro(s) criado(s) automaticamente.`,
      });
      onSuccess();
      handleClose();
    },
    onError: (e: { message: string }) => {
      toast.error("Erro ao salvar aditivo", { description: e.message });
      setStep("review");
    },
  });

  const handleClose = () => {
    setStep("upload");
    setSelectedFile(null);
    setPdfUrl("");
    setExtracted(null);
    setReviewConfirmed(false);
    setTitle("");
    setNumber("");
    setAmendmentType("financial");
    setStatus("review");
    setDescription("");
    setValueChange("");
    setNewTotalValue("");
    setNewEndDate("");
    setSignedAt("");
    setContent("");
    setNotes("");
    setMilestones([]);
    onClose();
  };

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 16MB");
      return;
    }
    setSelectedFile(file);
    setStep("extracting");

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      extractMutation.mutate({
        contractId,
        pdfBase64: base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, [contractId, extractMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSave = () => {
    if (!reviewConfirmed) {
      toast.error("Confirme a revisão dos dados antes de salvar");
      return;
    }
    if (!title.trim()) {
      toast.error("O título do aditivo é obrigatório");
      return;
    }
    setStep("saving");
    createMutation.mutate({
      contractId,
      title,
      number: number || undefined,
      amendmentType: amendmentType as "financial" | "scope" | "term" | "mixed",
      status: status as "draft" | "review" | "active" | "terminated",
      description: description || undefined,
      valueChange: valueChange || undefined,
      newTotalValue: newTotalValue || undefined,
      newEndDate: newEndDate || undefined,
      signedAt: signedAt || undefined,
      content: content || undefined,
      notes: notes || undefined,
    });
  };

  const updateMilestone = (idx: number, field: string, value: string) => {
    setMilestones((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Importar Aditivo via PDF
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-1">
          {(["upload", "extracting", "review", "saving"] as Step[]).map((s, idx) => {
            const labels = ["1. Upload", "2. Extração IA", "3. Revisão", "4. Salvar"];
            const isCurrent = step === s;
            const isDone = ["upload", "extracting", "review", "saving"].indexOf(step) > idx;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isCurrent ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {labels[idx]}
                </div>
                {idx < 3 && <div className="h-px w-4 bg-border" />}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-2">
            <div
              className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm">Arraste o PDF do aditivo aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Apenas arquivos PDF — Máximo 16MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                A IA irá extrair automaticamente: título, tipo (financeiro/escopo/prazo), valores, datas, marcos financeiros e cláusulas do aditivo. Todos os dados extraídos passarão por revisão obrigatória antes de serem salvos.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Extracting */}
        {step === "extracting" && (
          <div className="py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold">Analisando o aditivo com IA...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Extraindo dados de <span className="font-medium">{selectedFile?.name}</span>
              </p>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Identificando tipo do aditivo...</p>
              <p>Extraindo valores e variações...</p>
              <p>Detectando marcos financeiros...</p>
              <p>Analisando cláusulas e prazos...</p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        )}

        {/* STEP 3: Review */}
        {(step === "review" || step === "saving") && extracted && (
          <div className="space-y-5 py-2">
            {/* Warning Banner */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold">Revisão obrigatória</p>
                <p>Verifique todos os dados extraídos pela IA antes de salvar. Corrija qualquer informação incorreta ou incompleta.</p>
              </div>
            </div>

            {/* Summary */}
            {notes && (
              <div className="rounded-lg bg-muted/30 border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-600" />Resumo da IA
                </p>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-xs bg-transparent border-0 p-0 resize-none focus-visible:ring-0" />
              </div>
            )}

            {/* Main Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Título do Aditivo *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Primeiro Aditivo ao Contrato CPST Nº 102/10-2025" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ex: ADT-001" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo do Aditivo *</Label>
                <Select value={amendmentType} onValueChange={setAmendmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(amendmentTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
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
                <Label className="text-xs">Data de Assinatura</Label>
                <Input type="date" value={signedAt} onChange={(e) => setSignedAt(e.target.value)} />
              </div>

              {(amendmentType === "financial" || amendmentType === "mixed") && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Variação de Valor (R$)</Label>
                    <Input type="number" step="0.01" value={valueChange} onChange={(e) => setValueChange(e.target.value)} placeholder="Ex: 50000.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Novo Valor Total (R$)</Label>
                    <Input type="number" step="0.01" value={newTotalValue} onChange={(e) => setNewTotalValue(e.target.value)} placeholder="Ex: 250000.00" />
                  </div>
                </>
              )}

              {(amendmentType === "term" || amendmentType === "mixed") && (
                <div className="space-y-1">
                  <Label className="text-xs">Nova Data de Término</Label>
                  <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                </div>
              )}

              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descreva o objeto deste aditivo..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Conteúdo / Cláusulas</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Texto completo do aditivo..." />
              </div>
            </div>

            {/* Milestones */}
            <div className="rounded-xl border overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                onClick={() => setShowMilestones(!showMilestones)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-700">
                    Marcos Financeiros ({milestones.length})
                    {milestones.length > 0 && <span className="font-normal text-blue-600 ml-1">— serão criados automaticamente</span>}
                  </p>
                </div>
                {showMilestones ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
              </button>
              {showMilestones && (
                <div className="p-3 space-y-3">
                  {milestones.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum marco financeiro identificado no PDF.</p>
                  ) : (
                    milestones.map((m, idx) => (
                      <div key={idx} className="rounded-lg border bg-blue-50/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-blue-700">Marco {idx + 1}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => removeMilestone(idx)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 space-y-0.5">
                            <Label className="text-xs">Título</Label>
                            <Input value={m.title} onChange={(e) => updateMilestone(idx, "title", e.target.value)} className="h-7 text-xs" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-xs">Valor Previsto (R$)</Label>
                            <Input value={m.plannedValue} onChange={(e) => updateMilestone(idx, "plannedValue", e.target.value)} className="h-7 text-xs" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-xs">Data de Vencimento</Label>
                            <Input type="date" value={m.dueDate} onChange={(e) => updateMilestone(idx, "dueDate", e.target.value)} className="h-7 text-xs" />
                          </div>
                          <div className="col-span-2 space-y-0.5">
                            <Label className="text-xs">Descrição</Label>
                            <Input value={m.description} onChange={(e) => updateMilestone(idx, "description", e.target.value)} className="h-7 text-xs" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-blue-600"
                    onClick={() => setMilestones((prev) => [...prev, { title: "", plannedValue: "", dueDate: "", description: "" }])}
                  >
                    + Adicionar Marco
                  </Button>
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div
              className={`rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                reviewConfirmed ? "border-green-500 bg-green-50" : "border-dashed border-muted-foreground/40 hover:border-primary/50"
              }`}
              onClick={() => setReviewConfirmed(!reviewConfirmed)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                  reviewConfirmed ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
                }`}>
                  {reviewConfirmed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <p className="text-sm font-medium">
                  Confirmo que revisei todos os dados extraídos e eles estão corretos
                </p>
              </div>
            </div>

            {(pdfKey || pdfUrl) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (pdfKey) {
                    getSignedUrlMutation.mutate({ fileKey: pdfKey });
                  } else {
                    window.open(pdfUrl, "_blank");
                  }
                }}
                disabled={getSignedUrlMutation.isPending}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Visualizar PDF Original
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === "extracting" && (
            <Button variant="outline" onClick={() => { setStep("upload"); extractMutation.reset(); }}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
          )}
          {(step === "review" || step === "saving") && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <RefreshCw className="h-4 w-4 mr-1" />Novo Upload
              </Button>
              <Button
                onClick={handleSave}
                disabled={!reviewConfirmed || step === "saving"}
                className={reviewConfirmed ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                {step === "saving" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Salvando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" />Salvar Aditivo</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
