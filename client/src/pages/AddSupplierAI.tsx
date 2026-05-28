import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Search,
  Link2,
  AlertTriangle,
  Sparkles,
  X,
  File,
  Image,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ShieldX,
  Info,
  Trash2,
  Plus,
} from "lucide-react";

type Step = "upload" | "extracting" | "review" | "confirm";

interface UploadedFile {
  file: File;
  base64: string;
  fileUrl?: string;
  fileKey?: string;
  uploaded: boolean;
}

interface FieldData {
  value: string;
  confidence: "high" | "medium" | "low" | "not_found";
  source: string;
}

interface ExtractionResult {
  runId: number;
  extracted: {
    documents_identified: Array<{ fileName: string; type: string; typeConfidence: number }>;
    fields: Record<string, FieldData>;
    summary: string;
    conflicts: string[];
    missingCritical: string[];
  };
  fields: any[];
  overallConfidence: number;
  processingTimeMs: number;
}

// Confidence visual config
const confidenceConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck; percent: number }> = {
  high: { label: "Alta", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: ShieldCheck, percent: 95 },
  medium: { label: "Média", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: ShieldAlert, percent: 70 },
  low: { label: "Baixa", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: ShieldQuestion, percent: 35 },
  not_found: { label: "Não encontrado", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: ShieldX, percent: 0 },
};

const docTypeLabels: Record<string, string> = {
  cnpj_card: "Cartão CNPJ",
  registration_form: "Ficha Cadastral",
  personal_id: "Documento Pessoal",
  address_proof: "Comprovante de Endereço",
  resume: "Currículo",
  diploma: "Diploma",
  certificate: "Certidão/Certificado",
  cnh: "CNH",
  contract: "Contrato",
  invoice: "Nota Fiscal",
  other: "Outro",
};

const fieldLabels: Record<string, string> = {
  companyName: "Razão Social",
  tradeName: "Nome Fantasia",
  cnpj: "CNPJ",
  stateRegistration: "Inscrição Estadual",
  municipalRegistration: "Inscrição Municipal",
  email: "E-mail",
  phone: "Telefone",
  website: "Website",
  street: "Logradouro",
  number: "Número",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  zipCode: "CEP",
  legalRepresentativeName: "Representante Legal",
  legalRepresentativeCpf: "CPF do Representante",
  legalRepresentativeRole: "Cargo/Função",
  bankName: "Banco",
  bankAgency: "Agência",
  bankAccount: "Conta",
  notes: "Observações",
};

const fieldSections: Array<{ title: string; fields: string[] }> = [
  { title: "Dados Principais", fields: ["companyName", "tradeName", "cnpj", "stateRegistration", "municipalRegistration"] },
  { title: "Contato", fields: ["email", "phone", "website"] },
  { title: "Endereço", fields: ["street", "number", "complement", "neighborhood", "city", "state", "zipCode"] },
  { title: "Representante Legal", fields: ["legalRepresentativeName", "legalRepresentativeCpf", "legalRepresentativeRole"] },
  { title: "Dados Bancários", fields: ["bankName", "bankAgency", "bankAccount"] },
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

export default function AddSupplierAI() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { selectedCompany } = useSelectedCompany();

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reviewedFields, setReviewedFields] = useState<Set<string>>(new Set());

  // Confirm step
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [criticality, setCriticality] = useState("medium");
  const [serviceScope, setServiceScope] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const { data: companies } = trpc.companies.listAll.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const extractMutation = trpc.suppliers.extractFromDocs.useMutation({
    onSuccess: (result: any) => {
      setExtractionResult(result);
      // Store uploaded file URLs for later saveViaAI
      if (result.uploadedFiles) {
        setFiles(prev => prev.map((f, i) => {
          const uploaded = result.uploadedFiles[i];
          if (uploaded) {
            return { ...f, fileUrl: uploaded.fileUrl, fileKey: uploaded.fileKey, uploaded: true };
          }
          return f;
        }));
      }
      // Populate form data from extracted fields
      const newFormData: Record<string, string> = {};
      if (result.extracted?.fields) {
        for (const [key, val] of Object.entries(result.extracted.fields)) {
          const v = val as FieldData;
          if (v.value) {
            newFormData[key] = v.value;
          }
        }
      }
      setFormData(newFormData);
      setStep("review");
      toast.success(`Dados extraídos com sucesso! ${result.processingTimeMs ? `(${(result.processingTimeMs / 1000).toFixed(1)}s)` : ""}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao extrair dados dos documentos.");
      setStep("upload");
    },
  });

  const saveMutation = trpc.suppliers.saveViaAI.useMutation({
    onSuccess: (result: any) => {
      toast.success("Fornecedor cadastrado via I.A. com sucesso!");
      // If "all companies" was selected, link to all companies of Grupo Arqueo Brasil
      if (selectedCompanyId === "all_grupo_arqueo_brasil" && result.supplierId) {
        // Link to remaining companies (first one is already set as primary)
        for (const company of grupoArqueoBrasilCompanies.slice(1)) {
          linkMutation.mutate({
            supplierId: result.supplierId,
            companyId: company.id,
            criticality: criticality as "low" | "medium" | "high" | "critical",
            serviceScope: serviceScope || undefined,
            internalNotes: internalNotes || undefined,
          });
        }
      }
      setLocation(`/suppliers/${result.supplierId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar fornecedor.");
    },
  });

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: (result) => {
      toast.success("Fornecedor cadastrado na base geral!");
      if (selectedCompanyId) {
        linkToCompany(result.id);
      } else {
        setLocation(`/suppliers/${result.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar fornecedor.");
    },
  });

  const linkMutation = trpc.supplierCompanyLinks.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor vinculado à empresa com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular fornecedor.");
    },
  });

  // Companies that belong to Grupo Arqueo Brasil (businessUnitId=1)
  const grupoArqueoBrasilCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: any) => c.businessUnitId === 1);
  }, [companies]);

  const isGrupoArqueoBrasil = selectedCompany?.groupId === 1;

  const linkToCompany = (supplierId: number) => {
    if (!selectedCompanyId) return;

    if (selectedCompanyId === "all_grupo_arqueo_brasil") {
      // Link to all 4 companies of Grupo Arqueo Brasil
      for (const company of grupoArqueoBrasilCompanies) {
        linkMutation.mutate({
          supplierId,
          companyId: company.id,
          criticality: criticality as "low" | "medium" | "high" | "critical",
          serviceScope: serviceScope || undefined,
          internalNotes: internalNotes || undefined,
        });
      }
    } else {
      linkMutation.mutate({
        supplierId,
        companyId: parseInt(selectedCompanyId, 10),
        criticality: criticality as "low" | "medium" | "high" | "critical",
        serviceScope: serviceScope || undefined,
        internalNotes: internalNotes || undefined,
      });
    }
  };

  // File handling
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} excede 16MB.`);
        return false;
      }
      return true;
    });
    if (files.length + valid.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} arquivos.`);
      return;
    }
    // Read base64 for each file
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFiles(prev => [...prev, { file: f, base64, uploaded: false }]);
      };
      reader.readAsDataURL(f);
    });
  }, [files.length]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleExtract = () => {
    if (files.length === 0) return;
    setStep("extracting");
    extractMutation.mutate({
      files: files.map(f => ({
        base64: f.base64,
        fileName: f.file.name,
        mimeType: f.file.type || "application/octet-stream",
      })),
      groupId: selectedCompany?.groupId || undefined,
    });
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setReviewedFields(prev => new Set(prev).add(key));
  };

  const getFieldConfidence = (key: string): "high" | "medium" | "low" | "not_found" => {
    if (!extractionResult?.extracted?.fields?.[key]) return "not_found";
    return (extractionResult.extracted.fields[key].confidence as any) || "not_found";
  };

  const overallConfidencePercent = useMemo(() => {
    return extractionResult?.overallConfidence ?? 0;
  }, [extractionResult]);

  const filledFieldsCount = useMemo(() => {
    return Object.values(formData).filter(v => v && v.trim()).length;
  }, [formData]);

  const handleSaveViaAI = () => {
    if (!formData.companyName) {
      toast.error("Razão Social é obrigatória.");
      return;
    }
    if (!formData.cnpj) {
      toast.error("CNPJ é obrigatório.");
      return;
    }
    if (!formData.email) {
      toast.error("E-mail é obrigatório.");
      return;
    }

    if (extractionResult?.runId) {
      // Use saveViaAI procedure
      saveMutation.mutate({
        supplierData: {
          companyName: formData.companyName,
          tradeName: formData.tradeName || "",
          cnpj: formData.cnpj,
          stateRegistration: formData.stateRegistration || "",
          municipalRegistration: formData.municipalRegistration || "",
          email: formData.email,
          phone: formData.phone || "",
          website: formData.website || "",
          street: formData.street || "",
          number: formData.number || "",
          complement: formData.complement || "",
          neighborhood: formData.neighborhood || "",
          city: formData.city || "",
          state: formData.state || "",
          zipCode: formData.zipCode || "",
          bankName: formData.bankName || "",
          bankAgency: formData.bankAgency || "",
          bankAccount: formData.bankAccount || "",
          notes: formData.notes || "",
          criticality: criticality as "low" | "medium" | "high" | "critical",
          companyId: selectedCompanyId === "all_grupo_arqueo_brasil"
            ? String(grupoArqueoBrasilCompanies[0]?.id || "")
            : (selectedCompanyId || (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined) || ""),
          groupId: selectedCompany?.groupId || 1,
        },
        extractionRunId: extractionResult.runId,
        uploadedFiles: files.filter(f => f.fileUrl).map(f => ({
          fileUrl: f.fileUrl!,
          fileKey: f.fileKey!,
          fileName: f.file.name,
          fileSize: f.file.size,
          mimeType: f.file.type || "application/octet-stream",
          documentType: extractionResult.extracted.documents_identified.find(d => d.fileName === f.file.name)?.type,
          documentTypeConfidence: extractionResult.extracted.documents_identified.find(d => d.fileName === f.file.name)?.typeConfidence,
        })),
        reviewedFields: Array.from(reviewedFields).map(key => ({
          fieldKey: key,
          wasReviewed: true,
          confirmedValue: formData[key] || "",
        })),
      });
    } else {
      // Fallback: use regular create
      createMutation.mutate({
        companyName: formData.companyName,
        tradeName: formData.tradeName || "",
        cnpj: formData.cnpj,
        email: formData.email,
        phone: formData.phone || "",
        street: formData.street || "",
        neighborhood: formData.neighborhood || "",
        city: formData.city || "",
        state: formData.state || "",
        zipCode: formData.zipCode || "",
        bankName: formData.bankName || "",
        bankAgency: formData.bankAgency || "",
        bankAccount: formData.bankAccount || "",
        criticality: criticality as "low" | "medium" | "high" | "critical",
        companyId: selectedCompanyId === "all_grupo_arqueo_brasil"
          ? String(grupoArqueoBrasilCompanies[0]?.id || "")
          : (selectedCompanyId || (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined) || ""),
        groupId: selectedCompany?.groupId || 1,
      });
    }
  };

  // Step indicators
  const stepsList = [
    { id: "upload" as const, label: "Upload", icon: Upload },
    { id: "extracting" as const, label: "Extração IA", icon: Brain },
    { id: "review" as const, label: "Revisão", icon: Search },
    { id: "confirm" as const, label: "Confirmação", icon: CheckCircle },
  ];

  const renderConfidenceBadge = (confidence: string) => {
    const conf = confidenceConfig[confidence] || confidenceConfig.not_found;
    const Icon = conf.icon;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${conf.bg} ${conf.color} ${conf.border} ml-2 gap-1 cursor-help`}>
            <Icon className="h-3 w-3" />
            {conf.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confiança: {conf.percent}% — {confidence === "high" ? "Dado extraído com alta certeza" : confidence === "medium" ? "Dado extraído, verificação recomendada" : confidence === "low" ? "Dado incerto, revisão necessária" : "Campo não encontrado nos documentos"}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderFieldInput = (key: string, type: "text" | "email" = "text", placeholder?: string, colSpan?: string) => {
    const confidence = getFieldConfidence(key);
    const isReviewed = reviewedFields.has(key);
    const isRequired = ["companyName", "cnpj", "email"].includes(key);
    return (
      <div className={`space-y-1.5 ${colSpan || ""}`} key={key}>
        <div className="flex items-center">
          <Label className={isRequired ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
            {fieldLabels[key] || key}
          </Label>
          {renderConfidenceBadge(confidence)}
          {isReviewed && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-1 gap-1">
              <CheckCircle className="h-3 w-3" />
              Revisado
            </Badge>
          )}
        </div>
        <Input
          type={type}
          value={formData[key] || ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={placeholder || fieldLabels[key]}
          className={confidence === "high" ? "border-emerald-300 focus:border-emerald-400" : confidence === "medium" ? "border-amber-300 focus:border-amber-400" : confidence === "low" ? "border-orange-300 focus:border-orange-400" : ""}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {stepsList.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isPast = stepsList.findIndex(x => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : isPast
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < stepsList.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-7 w-7 text-violet-600" />
              Cadastrar Fornecedor via I.A.
            </CardTitle>
            <CardDescription className="text-base max-w-2xl mx-auto">
              Envie um ou mais documentos do fornecedor e a IA extrairá os dados automaticamente.
              Aceita: Cartão CNPJ, Contrato Social, Ficha Cadastral, CNH, Comprovantes, Certidões, Currículos, Notas Fiscais e outros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragActive
                  ? "border-violet-500 bg-violet-50"
                  : files.length > 0
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "border-muted-foreground/25 hover:border-violet-400/50 hover:bg-violet-50/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload-ai")?.click()}
            >
              <input
                id="file-upload-ai"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                multiple
                onChange={handleFileChange}
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Arraste e solte os documentos aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar arquivos</p>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, PNG, JPG, TXT, DOC, DOCX — até {MAX_FILES} arquivos, 16MB cada
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{files.length} documento{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-xs text-muted-foreground">
                    Limpar todos
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {files.map((f, i) => {
                    const isImage = f.file.type.startsWith("image/");
                    const isPdf = f.file.type === "application/pdf";
                    const FileIcon = isImage ? Image : isPdf ? FileText : File;
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 group">
                        <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {files.length < MAX_FILES && (
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload-ai")?.click()} className="w-full mt-2 gap-1.5 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    Adicionar mais documentos
                  </Button>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLocation("/suppliers")}>
                Cancelar
              </Button>
              <Button
                onClick={handleExtract}
                disabled={files.length === 0}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Brain className="h-4 w-4" />
                Extrair com I.A.
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Extracting */}
      {step === "extracting" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <Loader2 className="h-16 w-16 text-violet-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-violet-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analisando documentos...</h3>
            <p className="text-muted-foreground max-w-md">
              A I.A. está lendo {files.length} documento{files.length > 1 ? "s" : ""} e extraindo os dados cadastrais do fornecedor.
              Isso pode levar de 10 a 30 segundos.
            </p>
            <div className="flex flex-col items-center gap-2 mt-6 text-sm text-muted-foreground">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span>{f.file.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && extractionResult && (
        <div className="space-y-6">
          {/* Extraction Summary */}
          <Card className="border-violet-200 bg-violet-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-violet-900">Resultado da Extração por I.A.</h3>
                    <p className="text-sm text-violet-700 mt-1">{extractionResult.extracted.summary}</p>
                  </div>

                  {/* Overall confidence bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-violet-700 font-medium">Confiança geral</span>
                      <span className="font-mono text-violet-800">{overallConfidencePercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={overallConfidencePercent} className="h-2" />
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{filledFieldsCount} campos preenchidos</span>
                    <span className="px-2 py-1 rounded bg-violet-100 text-violet-700">{extractionResult.extracted.documents_identified.length} documentos analisados</span>
                    {extractionResult.processingTimeMs && (
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">{(extractionResult.processingTimeMs / 1000).toFixed(1)}s de processamento</span>
                    )}
                  </div>

                  {/* Conflicts */}
                  {extractionResult.extracted.conflicts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        Conflitos detectados
                      </div>
                      <ul className="text-xs text-amber-600 list-disc list-inside space-y-0.5">
                        {extractionResult.extracted.conflicts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing critical */}
                  {extractionResult.extracted.missingCritical.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-1">
                        <ShieldX className="h-4 w-4" />
                        Campos críticos não encontrados
                      </div>
                      <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                        {extractionResult.extracted.missingCritical.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents identified */}
          {extractionResult.extracted.documents_identified.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {extractionResult.extracted.documents_identified.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">{docTypeLabels[doc.type] || doc.type}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${doc.typeConfidence >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : doc.typeConfidence >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {doc.typeConfidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted data form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Revisão dos Dados Extraídos
              </CardTitle>
              <CardDescription>
                Revise e corrija os dados antes de confirmar. A borda colorida indica o nível de confiança da I.A.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fieldSections.map((section, si) => (
                <div key={si}>
                  {si > 0 && <Separator className="mb-6" />}
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map(key => {
                      const colSpan = ["website", "street", "notes"].includes(key) ? "md:col-span-2" : "";
                      const type = key === "email" ? "email" as const : "text" as const;
                      return renderFieldInput(key, type, undefined, colSpan);
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <Separator />
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label>Observações</Label>
                  {renderConfidenceBadge(getFieldConfidence("notes"))}
                </div>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setFiles([]);
                    setFormData({});
                    setExtractionResult(null);
                    setReviewedFields(new Set());
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  Próximo: Confirmação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Confirmar Cadastro via I.A.
              </CardTitle>
              <CardDescription>
                Revise o resumo e configure o vínculo antes de salvar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supplier summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{formData.companyName || "Fornecedor"}</p>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {formData.cnpj || "Não informado"} | E-mail: {formData.email || "Não informado"}
                    </p>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Via I.A.
                  </Badge>
                </div>
              </div>

              {/* Confidence summary */}
              {extractionResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["high", "medium", "low", "not_found"] as const).map(level => {
                    const conf = confidenceConfig[level];
                    const Icon = conf.icon;
                    const count = extractionResult.extracted?.fields
                      ? Object.values(extractionResult.extracted.fields).filter(
                          (f: any) => f.confidence === level && f.value
                        ).length
                      : 0;
                    return (
                      <div key={level} className={`p-3 rounded-lg border ${conf.border} ${conf.bg}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`h-4 w-4 ${conf.color}`} />
                          <span className={`text-xs font-medium ${conf.color}`}>{conf.label}</span>
                        </div>
                        <p className={`text-lg font-bold ${conf.color}`}>{count}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              {/* Link configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuração do Vínculo (opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa/Unidade</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {isGrupoArqueoBrasil && grupoArqueoBrasilCompanies.length > 1 && (
                          <SelectItem value="all_grupo_arqueo_brasil" className="font-semibold text-violet-700">
                            Ambas as {grupoArqueoBrasilCompanies.length} empresas
                          </SelectItem>
                        )}
                        {companies?.map((company: any) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.tradeName || company.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Criticidade</Label>
                    <Select value={criticality} onValueChange={setCriticality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Escopo de Serviço</Label>
                    <Input
                      value={serviceScope}
                      onChange={(e) => setServiceScope(e.target.value)}
                      placeholder="Ex: Consultoria arqueológica, Serviços de campo..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Observações Internas</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notas internas sobre este vínculo..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("review")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSaveViaAI}
                  disabled={saveMutation.isPending || createMutation.isPending || !formData.companyName}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  {(saveMutation.isPending || createMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Cadastrar Fornecedor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
