import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  LayoutTemplate,
  Copy,
  PenLine,
  X,
  FileText,
} from "lucide-react";
import type { ContractCreationMode } from "./ContractCreationModal";

interface ContractItem {
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  notes: string;
}

interface ContractEditorProps {
  supplierId: number;
  supplierName: string;
  supplierCnpj: string;
  mode: ContractCreationMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingContracts?: Array<{ id: number; title: string }>;
}

const contractTypeLabels: Record<string, string> = {
  service: "Prestação de Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Em Revisão",
  active: "Ativo",
  suspended: "Suspenso",
  expired: "Expirado",
  terminated: "Encerrado",
};

const modeInfo: Record<ContractCreationMode, { label: string; icon: React.ElementType; color: string }> = {
  manual: { label: "Do Zero", icon: PenLine, color: "text-blue-600" },
  template: { label: "A partir de Template", icon: LayoutTemplate, color: "text-orange-600" },
  duplicate: { label: "Duplicar Existente", icon: Copy, color: "text-purple-600" },
  ai: { label: "Gerar com IA", icon: Sparkles, color: "text-emerald-600" },
  pdf: { label: "Importado via PDF", icon: FileText, color: "text-rose-600" },
};

const emptyItem = (): ContractItem => ({
  description: "",
  unit: "",
  quantity: "",
  unitPrice: "",
  totalPrice: "",
  notes: "",
});

export function ContractEditor({
  supplierId,
  supplierName,
  supplierCnpj,
  mode,
  open,
  onOpenChange,
  onSuccess,
  existingContracts = [],
}: ContractEditorProps) {
  const utils = trpc.useUtils();

  // AI mode state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);

  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Duplicate mode state
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [object, setObject] = useState("");
  const [contractType, setContractType] = useState<string>("service");
  const [status, setStatus] = useState<string>("draft");
  const [totalValue, setTotalValue] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractorName, setContractorName] = useState("Grupo Arqueo Participações");
  const [contractorCnpj, setContractorCnpj] = useState("");
  const [contractorRepresentative, setContractorRepresentative] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ContractItem[]>([emptyItem()]);

  // Queries
  const { data: templates } = trpc.contracts.getTemplates.useQuery(undefined, {
    enabled: mode === "template" && open,
  });

  const { data: duplicateData } = trpc.contracts.getById.useQuery(
    { id: parseInt(selectedDuplicateId) },
    { enabled: mode === "duplicate" && !!selectedDuplicateId }
  );

  // When duplicate is selected, populate form
  useEffect(() => {
    if (mode === "duplicate" && duplicateData) {
      const c = duplicateData.contract;
      setTitle(`Cópia de ${c.title}`);
      setNumber("");
      setObject(c.object || "");
      setContractType(c.contractType || "service");
      setStatus("draft");
      setTotalValue(c.totalValue || "");
      setPaymentTerms(c.paymentTerms || "");
      setContent(c.content || "");
      setNotes(c.notes || "");
      setContractorName(c.contractorName || "Grupo Arqueo Participações");
      setContractorCnpj(c.contractorCnpj || "");
      setContractorRepresentative(c.contractorRepresentative || "");
      if (duplicateData.items.length > 0) {
        setItems(duplicateData.items.map((i) => ({
          description: i.description,
          unit: i.unit || "",
          quantity: i.quantity || "",
          unitPrice: i.unitPrice || "",
          totalPrice: i.totalPrice || "",
          notes: i.notes || "",
        })));
      }
    }
  }, [duplicateData, mode]);

  // When template is selected, populate content
  useEffect(() => {
    if (mode === "template" && selectedTemplateId && templates) {
      const tpl = templates.find((t) => t.id === parseInt(selectedTemplateId));
      if (tpl) {
        setContent(tpl.content);
        if (!title) setTitle(`Contrato - ${supplierName}`);
      }
    }
  }, [selectedTemplateId, templates, mode]);

  // Mutations
  const generateAIMutation = trpc.contracts.generateWithAI.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      if (!title) setTitle(data.suggestedTitle || `Contrato - ${supplierName}`);
      setAiGenerated(true);
      toast.success("Contrato gerado com IA!", { description: "Revise e ajuste o conteúdo antes de salvar." });
    },
    onError: (err) => toast.error("Erro ao gerar com IA", { description: err.message }),
  });

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      utils.contracts.listBySupplier.invalidate({ supplierId });
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error("Erro ao criar contrato", { description: err.message }),
  });

  const resetForm = () => {
    setTitle(""); setNumber(""); setObject(""); setContractType("service");
    setStatus("draft"); setTotalValue(""); setPaymentTerms("");
    setStartDate(""); setEndDate(""); setContent(""); setNotes("");
    setContractorName("Grupo Arqueo Participações"); setContractorCnpj("");
    setContractorRepresentative(""); setItems([emptyItem()]);
    setAiPrompt(""); setAiGenerated(false);
    setSelectedTemplateId(""); setSelectedDuplicateId("");
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Título do contrato é obrigatório");
      return;
    }
    const validItems = items.filter((i) => i.description.trim());
    createMutation.mutate({
      supplierId,
      title: title.trim(),
      number: number || undefined,
      object: object || undefined,
      contractType: contractType as any,
      status: status as any,
      creationMode: (mode === "pdf" ? "ai" : mode) as "manual" | "template" | "duplicate" | "ai" | undefined,
      totalValue: totalValue || undefined,
      paymentTerms: paymentTerms || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      contractorName: contractorName || undefined,
      contractorCnpj: contractorCnpj || undefined,
      contractorRepresentative: contractorRepresentative || undefined,
      content: content || undefined,
      notes: notes || undefined,
      items: validItems.length > 0 ? validItems : undefined,
    });
  };

  const updateItem = (idx: number, field: keyof ContractItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-calc total
      if (field === "quantity" || field === "unitPrice") {
        const qty = parseFloat(next[idx].quantity) || 0;
        const price = parseFloat(next[idx].unitPrice) || 0;
        if (qty && price) next[idx].totalPrice = (qty * price).toFixed(2);
      }
      return next;
    });
  };

  const ModeIcon = modeInfo[mode].icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ModeIcon className={`h-5 w-5 ${modeInfo[mode].color}`} />
            </div>
            <div>
              <DialogTitle>Novo Contrato — {modeInfo[mode].label}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fornecedor: <span className="font-medium">{supplierName}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* === AI MODE: prompt first === */}
          {mode === "ai" && !aiGenerated && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold text-emerald-800">Geração por Inteligência Artificial</p>
              </div>
              <p className="text-sm text-emerald-700">
                Descreva o escopo do contrato. A IA irá gerar um contrato completo com base nos dados do fornecedor e na sua descrição.
              </p>
              <Textarea
                placeholder="Ex: Contrato de prestação de serviços de limpeza e conservação para as instalações do Grupo Arqueo, com frequência diária, incluindo fornecimento de materiais..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={5}
                className="bg-white"
              />
              <Button
                onClick={() => generateAIMutation.mutate({ supplierId, prompt: aiPrompt })}
                disabled={!aiPrompt.trim() || generateAIMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {generateAIMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando contrato...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Gerar Contrato com IA</>
                )}
              </Button>
            </div>
          )}

          {/* === TEMPLATE MODE: select template === */}
          {mode === "template" && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-orange-600" />
                <p className="font-semibold text-orange-800">Selecione um Template</p>
              </div>
              {templates && templates.length > 0 ? (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Escolha um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name} — {contractTypeLabels[t.contractType || "other"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-orange-700">Nenhum template disponível. O contrato será criado em branco.</p>
              )}
            </div>
          )}

          {/* === DUPLICATE MODE: select existing === */}
          {mode === "duplicate" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-purple-600" />
                <p className="font-semibold text-purple-800">Selecione o Contrato de Origem</p>
              </div>
              {existingContracts.length > 0 ? (
                <Select value={selectedDuplicateId} onValueChange={setSelectedDuplicateId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Escolha um contrato para duplicar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {existingContracts.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-purple-700">Nenhum contrato existente para duplicar. O contrato será criado em branco.</p>
              )}
            </div>
          )}

          {/* === FORM FIELDS (always visible after AI generates or for other modes) === */}
          {(mode !== "ai" || aiGenerated) && (
            <>
              {/* Identification */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                  Identificação
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="title">Título do Contrato *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Contrato de Prestação de Serviços de TI"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="number">Número do Contrato</Label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Ex: CTR-2025-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contractType">Tipo de Contrato</Label>
                    <Select value={contractType} onValueChange={setContractType}>
                      <SelectTrigger id="contractType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(contractTypeLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="object">Objeto do Contrato</Label>
                    <Textarea
                      id="object"
                      value={object}
                      onChange={(e) => setObject(e.target.value)}
                      placeholder="Descreva o objeto principal do contrato..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Parties */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                  Partes Contratantes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="rounded-lg bg-muted/40 p-3 border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">CONTRATADA (Fornecedor)</p>
                      <p className="text-sm font-semibold">{supplierName}</p>
                      <p className="text-xs text-muted-foreground">CNPJ: {supplierCnpj}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contractorName">Contratante (Empresa)</Label>
                    <Input
                      id="contractorName"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contractorCnpj">CNPJ do Contratante</Label>
                    <Input
                      id="contractorCnpj"
                      value={contractorCnpj}
                      onChange={(e) => setContractorCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="contractorRep">Representante Legal</Label>
                    <Input
                      id="contractorRep"
                      value={contractorRepresentative}
                      onChange={(e) => setContractorRepresentative(e.target.value)}
                      placeholder="Nome do representante"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial & Dates */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                  Valores e Vigência
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="totalValue">Valor Total (R$)</Label>
                    <Input
                      id="totalValue"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      placeholder="0,00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                    <Textarea
                      id="paymentTerms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Ex: Pagamento em 30 dias após emissão da nota fiscal..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items / Scope */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">4</span>
                    Itens / Escopo
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-lg border p-3 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Descrição do item *"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Unidade"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        />
                        <Input
                          placeholder="Qtd."
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        />
                        <Input
                          placeholder="Preço Unit."
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        />
                        <Input
                          placeholder="Total"
                          type="number"
                          step="0.01"
                          value={item.totalPrice}
                          onChange={(e) => updateItem(idx, "totalPrice", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Content */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">5</span>
                  Conteúdo do Contrato
                  {mode === "ai" && aiGenerated && (
                    <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-0 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Gerado por IA
                    </Badge>
                  )}
                </h3>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Texto completo do contrato, cláusulas, condições..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações Internas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas sobre este contrato (não aparecem no documento)..."
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancelar
          </Button>
          {(mode !== "ai" || aiGenerated) && (
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || !title.trim()}
              className="bg-[oklch(0.50_0.15_15)] hover:bg-[oklch(0.45_0.15_15)]"
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Salvar Contrato</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
