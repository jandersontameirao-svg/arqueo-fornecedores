import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Save,
  Users,
  Building2,
  Search,
  Info,
  FileUp,
  Brain,
  ShieldCheck,
  Edit3,
} from "lucide-react";

// Steps
const STEPS = [
  { id: 1, title: "Selecionar Template", icon: FileText },
  { id: 2, title: "Selecionar Fornecedor", icon: Users },
  { id: 3, title: "Preencher Campos", icon: Edit3 },
  { id: 4, title: "Revisão e Confirmação", icon: ShieldCheck },
];

// Confidence badge
function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 90) return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Alta ({confidence}%)</Badge>;
  if (confidence >= 60) return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Média ({confidence}%)</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-0 text-xs"><XCircle className="h-3 w-3 mr-1" />Baixa ({confidence}%)</Badge>;
}

export default function GenerateContract() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedTemplateId = params.get("templateId") ? parseInt(params.get("templateId")!) : null;
  const preselectedSupplierId = params.get("supplierId") ? parseInt(params.get("supplierId")!) : null;

  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(preselectedTemplateId);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(preselectedSupplierId);
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  const [fieldOrigins, setFieldOrigins] = useState<Record<string, string>>({});
  const [aiConfidenceScore, setAiConfidenceScore] = useState<number | undefined>();
  const [extractionRunId, setExtractionRunId] = useState<number | undefined>();
  const [searchTemplate, setSearchTemplate] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: templates, isLoading: loadingTemplates } = trpc.templates.listAll.useQuery();
  const { data: suppliers, isLoading: loadingSuppliers } = trpc.suppliers.list.useQuery({});
  const { data: templateFields, isLoading: loadingFields } = trpc.templates.getFields.useQuery(
    { templateId: selectedTemplateId! },
    { enabled: !!selectedTemplateId }
  );

  // Selected template & supplier details
  const selectedTemplate = useMemo(() => templates?.find((t: any) => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId || !suppliers) return null;
    return (suppliers as any[]).find((s: any) => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  // Filtered lists
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((t: any) =>
      t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTemplate.toLowerCase())
    );
  }, [templates, searchTemplate]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return (suppliers as any[]).filter((s: any) =>
      s.companyName.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      (s.cnpj || "").includes(searchSupplier) ||
      (s.email || "").toLowerCase().includes(searchSupplier.toLowerCase())
    );
  }, [suppliers, searchSupplier]);

  // Auto-fill supplier data into fields
  useEffect(() => {
    if (selectedSupplier && templateFields && templateFields.length > 0) {
      const supplierMap: Record<string, string> = {
        nome_empresa: selectedSupplier.companyName || "",
        razao_social: selectedSupplier.companyName || "",
        nome_fantasia: selectedSupplier.tradeName || "",
        cnpj: selectedSupplier.cnpj || "",
        email: selectedSupplier.email || "",
        telefone: selectedSupplier.phone || "",
        endereco: [selectedSupplier.street, selectedSupplier.number, selectedSupplier.complement, selectedSupplier.neighborhood, selectedSupplier.city, selectedSupplier.state].filter(Boolean).join(", "),
        cidade: selectedSupplier.city || "",
        estado: selectedSupplier.state || "",
        cep: selectedSupplier.zipCode || "",
        banco: selectedSupplier.bankName || "",
        agencia: selectedSupplier.bankAgency || "",
        conta: selectedSupplier.bankAccount || "",
        pix: selectedSupplier.pixKey || "",
      };

      const newFields = { ...filledFields };
      const newOrigins = { ...fieldOrigins };
      for (const field of templateFields) {
        const key = field.fieldKey.toLowerCase();
        // Try to match supplier data
        for (const [mapKey, mapValue] of Object.entries(supplierMap)) {
          if (key.includes(mapKey) && mapValue && !newFields[field.fieldKey]) {
            newFields[field.fieldKey] = mapValue;
            newOrigins[field.fieldKey] = "auto_supplier";
            break;
          }
        }
        // Set default value if not filled
        if (!newFields[field.fieldKey] && field.defaultValue) {
          newFields[field.fieldKey] = field.defaultValue;
          newOrigins[field.fieldKey] = "default";
        }
      }
      setFilledFields(newFields);
      setFieldOrigins(newOrigins);
    }
  }, [selectedSupplier, templateFields]);

  // Extract from PDF mutation
  const extractMutation = trpc.templates.extractFromPdf.useMutation({
    onSuccess: (data) => {
      toast.success("Dados extraídos com sucesso!");
      setExtractionRunId(data.runId);
      setAiConfidenceScore(data.overallConfidence);
      // Fill fields from extraction
      const newFields = { ...filledFields };
      const newOrigins = { ...fieldOrigins };
      for (const field of data.fields) {
        if (field.extractedValue) {
          newFields[field.fieldKey] = field.extractedValue;
          newOrigins[field.fieldKey] = `ai_${field.confidence || "50"}`;
        }
      }
      setFilledFields(newFields);
      setFieldOrigins(newOrigins);
      setShowPdfUpload(false);
    },
    onError: (e) => toast.error("Erro na extração", { description: e.message }),
  });

  const utils = trpc.useUtils();
  const [idempotencyKey] = useState(() => `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Generate contract mutation
  const generateMutation = trpc.templates.generateContract.useMutation({
    onSuccess: (data: { contractId: number; supplierId: number }) => {
      toast.success("Contrato gerado e salvo com sucesso!", {
        description: `Contrato criado com ID #${data.contractId}. Redirecionando para o fornecedor...`,
        duration: 4000,
      });
      // Invalidate contracts cache so the new contract appears immediately
      utils.contracts.listBySupplier.invalidate({ supplierId: data.supplierId });
      utils.contracts.listAll.invalidate();
      // Navigate to supplier contracts tab
      navigate(`/suppliers/${data.supplierId}?tab=contratos`);
    },
    onError: (e: { message?: string }) => {
      const msg = e.message || "Erro desconhecido ao gerar contrato";
      toast.error("Falha ao gerar contrato", {
        description: msg,
        duration: 6000,
      });
    },
  });

  // Handle PDF upload
  const handlePdfFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && !file.name.toLowerCase().endsWith(".txt")) {
      toast.error("Apenas arquivos PDF ou TXT são aceitos");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 16MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      extractMutation.mutate({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        templateId: selectedTemplateId || undefined,
      });
    };
    reader.readAsDataURL(file);
  }, [selectedTemplateId, extractMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handlePdfFile(f);
  }, [handlePdfFile]);

  // Handle generate
  const handleGenerate = () => {
    if (!selectedTemplateId || !selectedSupplierId) {
      toast.error("Selecione template e fornecedor");
      return;
    }
    generateMutation.mutate({
      templateId: selectedTemplateId,
      supplierId: selectedSupplierId,
      filledFields,
      filledFieldsOrigin: fieldOrigins,
      aiConfidenceScore,
      extractionRunId,
      idempotencyKey,
    });
  };

  // Field update
  const updateField = (key: string, value: string) => {
    setFilledFields(prev => ({ ...prev, [key]: value }));
    setFieldOrigins(prev => ({ ...prev, [key]: "manual" }));
  };

  // Can advance
  const canAdvance = () => {
    if (step === 1) return !!selectedTemplateId;
    if (step === 2) return !!selectedSupplierId;
    if (step === 3) {
      if (!templateFields) return true;
      const requiredFields = templateFields.filter((f: any) => f.isRequired);
      return requiredFields.every((f: any) => filledFields[f.fieldKey]?.trim());
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/contract-templates")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Gerar Contrato</h1>
              <p className="text-sm text-muted-foreground">Crie um contrato a partir de um template com preenchimento inteligente</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full ${
                    isActive ? "bg-primary/10 text-primary font-medium" :
                    isDone ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground"
                  }`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? "bg-primary text-primary-foreground" :
                      isDone ? "bg-emerald-500 text-white" : "bg-muted"
                    }`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                    </div>
                    <span className="text-sm hidden md:inline">{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="h-px bg-border flex-1 min-w-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 max-w-4xl">
        {/* Step 1: Select Template */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Selecione o Template</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar template..." value={searchTemplate} onChange={e => setSearchTemplate(e.target.value)} />
              </div>
            </div>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((t: any) => (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplateId === t.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedTemplateId(t.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedTemplateId === t.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{t.name}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          {t.contractType && (
                            <Badge variant="outline" className="text-xs">{t.contractType}</Badge>
                          )}
                          {selectedTemplateId === t.id && (
                            <Badge className="bg-primary text-primary-foreground text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Selecionado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum template encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Crie templates na área de Templates antes de gerar contratos</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Supplier */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Selecione o Fornecedor</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar fornecedor..." value={searchSupplier} onChange={e => setSearchSupplier(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Os dados do fornecedor selecionado serão usados para pré-preencher campos do contrato automaticamente.
              </p>
            </div>

            {loadingSuppliers ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredSuppliers.map((s: any) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm ${
                      selectedSupplierId === s.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedSupplierId(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedSupplierId === s.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{s.companyName}</p>
                        <p className="text-xs text-muted-foreground">{s.cnpj} {s.email ? `· ${s.email}` : ""}</p>
                      </div>
                      {selectedSupplierId === s.id && (
                        <Badge className="bg-primary text-primary-foreground text-xs shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Selecionado</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum fornecedor encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Fill Fields */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preencher Campos do Contrato</h2>
              <Button variant="outline" onClick={() => setShowPdfUpload(true)}>
                <Brain className="h-4 w-4 mr-1.5 text-purple-600" />
                Preencher com IA (PDF)
              </Button>
            </div>

            {/* AI Summary */}
            {aiConfidenceScore !== undefined && (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Preenchimento por IA</span>
                  <ConfidenceBadge confidence={aiConfidenceScore} />
                </div>
                <p className="text-xs text-purple-600 mt-1">Revise os campos preenchidos automaticamente. Campos com baixa confiança estão destacados.</p>
              </div>
            )}

            {/* Info about auto-filled */}
            {selectedSupplier && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Campos pré-preenchidos com dados de <strong>{selectedSupplier.companyName}</strong>
                </p>
              </div>
            )}

            {loadingFields ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : templateFields && templateFields.length > 0 ? (
              <div className="space-y-3">
                {templateFields.map((field: any) => {
                  const origin = fieldOrigins[field.fieldKey];
                  const isAi = origin?.startsWith("ai_");
                  const aiConf = isAi ? parseInt(origin.split("_")[1]) : null;
                  const isAutoSupplier = origin === "auto_supplier";

                  return (
                    <div key={field.id} className={`rounded-lg border p-3 ${
                      isAi && aiConf !== null && aiConf < 60 ? "border-amber-300 bg-amber-50/50" : ""
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.isRequired && <span className="text-destructive ml-0.5">*</span>}
                        </Label>
                        {isAi && aiConf !== null && <ConfidenceBadge confidence={aiConf} />}
                        {isAutoSupplier && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Auto (Fornecedor)</Badge>}
                        {origin === "default" && <Badge variant="outline" className="text-xs">Padrão</Badge>}
                        {origin === "manual" && <Badge variant="outline" className="text-xs">Manual</Badge>}
                      </div>
                      {field.description && <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>}
                      {field.fieldType === "textarea" ? (
                        <Textarea
                          value={filledFields[field.fieldKey] || ""}
                          onChange={e => updateField(field.fieldKey, e.target.value)}
                          rows={3}
                          placeholder={`Preencha ${field.label.toLowerCase()}...`}
                        />
                      ) : field.fieldType === "select" && field.selectOptions ? (
                        <Select value={filledFields[field.fieldKey] || ""} onValueChange={v => updateField(field.fieldKey, v)}>
                          <SelectTrigger><SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} /></SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(field.selectOptions) ? field.selectOptions : []).map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.fieldType === "number" || field.fieldType === "currency" ? "text" : field.fieldType === "date" ? "date" : "text"}
                          value={filledFields[field.fieldKey] || ""}
                          onChange={e => updateField(field.fieldKey, e.target.value)}
                          placeholder={`Preencha ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Este template não possui campos configurados.</p>
                <p className="text-xs text-muted-foreground mt-1">O contrato será gerado com o template base sem campos variáveis.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Revisão Final</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Template</span>
                </div>
                <p className="font-medium">{selectedTemplate?.name}</p>
                {selectedTemplate?.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.description}</p>}
                {selectedTemplate?.contractType && <Badge variant="outline" className="mt-2 text-xs">{selectedTemplate.contractType}</Badge>}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Fornecedor</span>
                </div>
                <p className="font-medium">{selectedSupplier?.companyName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedSupplier?.cnpj}</p>
                {selectedSupplier?.email && <p className="text-xs text-muted-foreground">{selectedSupplier.email}</p>}
              </div>
            </div>

            {/* AI confidence */}
            {aiConfidenceScore !== undefined && (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-800">Confiança geral da IA:</span>
                <ConfidenceBadge confidence={aiConfidenceScore} />
              </div>
            )}

            {/* Fields summary */}
            {templateFields && templateFields.length > 0 && (
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b">
                  <span className="font-semibold text-sm">Campos Preenchidos</span>
                </div>
                <div className="divide-y">
                  {templateFields.map((field: any) => (
                    <div key={field.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.isRequired && <span className="text-destructive text-xs ml-1">*</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-right max-w-xs truncate">{filledFields[field.fieldKey] || <span className="text-muted-foreground italic">Vazio</span>}</span>
                        {fieldOrigins[field.fieldKey]?.startsWith("ai_") && (
                          <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">IA</Badge>
                        )}
                        {fieldOrigins[field.fieldKey] === "auto_supplier" && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Auto</Badge>
                        )}
                        {fieldOrigins[field.fieldKey] === "manual" && (
                          <Badge variant="outline" className="text-xs">Manual</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Ao confirmar, o contrato será gerado e salvo automaticamente no cadastro do fornecedor.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate("/contract-templates")} disabled={generateMutation.isPending}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Gerar e Salvar Contrato
            </Button>
          )}
        </div>
      </div>

      {/* PDF Upload Dialog */}
      <Dialog open={showPdfUpload} onOpenChange={setShowPdfUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Preenchimento por IA via PDF
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
              <p className="text-xs text-purple-700">
                Envie um PDF contratual ou documental. A IA irá extrair dados relevantes e preencher automaticamente os campos do contrato. Você poderá revisar e corrigir antes de salvar.
              </p>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragOver ? "border-purple-500 bg-purple-50" : "border-muted-foreground/25 hover:border-purple-400"
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfFile(f); }}
              />
              {extractMutation.isPending ? (
                <div className="space-y-2">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
                  <p className="text-sm font-medium text-purple-700">Extraindo dados com IA...</p>
                  <p className="text-xs text-purple-500">Isso pode levar alguns segundos</p>
                </div>
              ) : (
                <>
                  <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Arraste o PDF aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF ou TXT, máximo 16MB</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfUpload(false)} disabled={extractMutation.isPending}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
